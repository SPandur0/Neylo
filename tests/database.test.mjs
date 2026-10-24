// Disse tests kontrollerer migrationer, dataopbevaring og sikkerhed i SQLite-laget, så ældre data og nye tabeller kan håndteres sikkert.
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

// Exercise production repositories and migrations against a real disk SQLite
// database. Only Expo's native bridge is replaced with a Node SQLite adapter.
function adapter(path) {
  const connection = new DatabaseSync(path);
  return {
    execAsync: async sql => connection.exec(sql),
    runAsync: async (sql, params = []) => {
      const result = connection.prepare(sql).run(...params);
      return { changes: result.changes, lastInsertRowId: result.lastInsertRowid };
    },
    getFirstAsync: async (sql, params = []) => connection.prepare(sql).get(...params),
    getAllAsync: async (sql, params = []) => connection.prepare(sql).all(...params),
    closeAsync: async () => connection.close(),
    async withTransactionAsync(operation) {
      connection.exec('BEGIN');
      try { await operation(); connection.exec('COMMIT'); }
      catch (error) { connection.exec('ROLLBACK'); throw error; }
    },
  };
}
// Reconstruct the pre-category schema for older-version migration fixtures.
async function restoreLegacyExpenses(db) {
  await db.execAsync(`DROP TABLE expenses; DROP TABLE expense_categories;
    CREATE TABLE expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT,
      amount INTEGER NOT NULL, month INTEGER NOT NULL, year INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT '2025-01-01', updated_at TEXT NOT NULL DEFAULT '2025-01-01'
    ); CREATE INDEX expenses_period ON expenses(year, month);`);
}
async function loadModules(path) {
  const cache = new Map();
  const connections = [];
  globalThis.__openFinanceTestDatabase = async () => {
    const db = adapter(path); connections.push(db); return db;
  };
  async function load(url) {
    if (cache.has(url.href)) return cache.get(url.href);
    let source = await readFile(url, 'utf8');
    if (url.pathname.endsWith('/database.js')) {
      source = source.replace("import { openDatabaseAsync } from 'expo-sqlite';", 'const openDatabaseAsync = globalThis.__openFinanceTestDatabase;');
    }
    for (const match of [...source.matchAll(/from '(\.[^']+)'/g)]) {
      source = source.replace(match[0], `from '${await load(new URL(match[1], url))}'`);
    }
    const encoded = `data:text/javascript;base64,${Buffer.from(source + `\n// session ${path}-${session++}`).toString('base64')}`;
    cache.set(url.href, encoded);
    return encoded;
  }
  const modules = {};
  for (const name of ['income', 'expense', 'savings', 'investment', 'savingsHistory', 'profile', 'expenseCategory']) {
    modules[name] = await import(await load(new URL(`../database/repositories/${name}Repository.js`, import.meta.url)));
  }
  modules.migrations = await import(await load(new URL('../database/migrations.js', import.meta.url)));
  modules.finance = await import(await load(new URL('../data/financeData.js', import.meta.url)));
  modules.close = async () => { for (const db of connections) await db.closeAsync(); };
  return modules;
}
let session = 0;

test('failed migration rolls back schema and version; future versions are refused', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'neylo-migration-'));
  const modules = await loadModules(join(directory, 'unused.db'));
  const db = adapter(':memory:');
  try {
    const original = db.execAsync;
    db.execAsync = async sql => { await original(sql); if (sql.includes('CREATE TABLE')) throw new Error('Simulated disk failure'); };
    await assert.rejects(modules.migrations.migrateDatabase(db), /disk failure/);
    assert.equal((await db.getFirstAsync('PRAGMA user_version')).user_version, 0);
    assert.equal((await db.getFirstAsync("SELECT count(*) AS count FROM sqlite_master WHERE name = 'income'")).count, 0);
    db.execAsync = original;
    await modules.migrations.migrateDatabase(db);
    await db.execAsync('PRAGMA user_version = 99');
    await assert.rejects(modules.migrations.migrateDatabase(db), /newer version/);
    assert.equal((await db.getFirstAsync('PRAGMA user_version')).user_version, 99);
  } finally {
    await db.closeAsync();
    await rm(directory, { recursive: true, force: true });
  }
});

test('A–H: migrated ledger, transactions, transfers, historical balances and restart', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'neylo-ledger-'));
  const path = join(directory, 'neylo.db');
  let modules;
  try {
    modules = await loadModules(path);
    const r = modules.savings;
    const old = await r.createSavingsAccount({ name: 'Legacy fixture', initialBalance: 50000 });
    assert.equal(old.amount, 50000);
    const db = adapter(path);
    assert.equal((await db.getFirstAsync('PRAGMA user_version')).user_version, 4);
    assert.equal((await db.getFirstAsync('SELECT count(*) AS n FROM savings_history')).n, 0);
    await db.closeAsync();
    await r.addSavingsTransaction(old.id, { amount: old.amount, type: 'withdrawal' });
    await r.archiveSavingsAccount(old.id);
    const home = await r.createSavingsAccount({ name: 'Home', initialBalance: 70000, date: '2025-01-01' });
    const emergency = await r.createSavingsAccount({ name: 'Emergency Fund', initialBalance: 50000, date: '2025-02-01' });
    assert.equal(await r.getTotalSavings(), 120000);
    await r.addSavingsTransaction(home.id, { amount: 9000, type: 'deposit', date: '2025-03-01' });
    assert.equal(await r.getSavingsAccountBalance(home.id), 79000);
    assert.equal(await r.getTotalSavings(), 129000);
    await r.addSavingsTransaction(emergency.id, { amount: 5000, type: 'withdrawal', date: '2025-04-01' });
    assert.equal(await r.getSavingsAccountBalance(emergency.id), 45000);
    assert.equal(await r.getTotalSavings(), 124000);
    await r.transferBetweenSavingsAccounts(emergency.id, home.id, { amount: 10000, date: '2025-05-01' });
    assert.equal(await r.getSavingsAccountBalance(emergency.id), 35000);
    assert.equal(await r.getSavingsAccountBalance(home.id), 89000);
    assert.equal(await r.getTotalSavings(), 124000);
    assert.deepEqual((await r.getSavingsHistory(2025)).slice(0, 5), [70000, 120000, 129000, 124000, 124000]);
    assert.deepEqual((await r.getSavingsAccountHistory(home.id, 2025)).slice(0, 5), [70000, 70000, 79000, 79000, 89000]);
    assert.equal((await r.getSavingsAccountHistory(emergency.id, 2025))[0], null);
    await assert.rejects(r.transferBetweenSavingsAccounts(emergency.id, home.id, { amount: 40000 }));
    await assert.rejects(r.transferBetweenSavingsAccounts(home.id, '99999', { amount: 1 }));
    await assert.rejects(r.transferBetweenSavingsAccounts(home.id, home.id, { amount: 1 }));
    await assert.rejects(r.addSavingsTransaction(home.id, { amount: 80000, type: 'withdrawal', date: '2025-02-01' }));
    for (const date of ['2024-12-31', '2025-02-30', '9999-01-01']) {
      await assert.rejects(r.addSavingsTransaction(home.id, { amount: 1, type: 'deposit', date }));
    }
    await assert.rejects(r.archiveSavingsAccount(home.id));
    assert.equal(await r.getTotalSavings(), 124000);
    assert.equal((await r.getSavingsTransactions(home.id)).length, 2);
    await r.updateSavingsAccount(home.id, { name: "O'Brien'); DROP TABLE income; --" });
    await r.addSavingsTransaction(home.id, { amount: 0.29, type: 'deposit' });
    const first = (await r.getSavingsTransactions(home.id)).find(t => t.transfer_id);
    const second = (await r.getSavingsTransactions(emergency.id)).find(t => t.transfer_id);
    assert.equal(first.transfer_id, second.transfer_id);
    assert.equal(first.amount_minor + second.amount_minor, 0);
    for (const key of ['income', 'expense', 'investment']) {
      const repo = modules[key].default;
      const row = await repo.add({ name: 'Regression', amount: 0.29, ...(key === 'expense' ? { category_id: (await modules.expenseCategory.getExpenseCategories())[0].id } : {}) });
      assert.equal(row.amount, 0.29);
      await repo.update(row.id, { amount: 1.23 });
      await repo.remove(row.id);
    }
    await modules.close();
    modules = await loadModules(path);
    assert.equal(await modules.savings.getTotalSavings(), 124000.29);
    assert.equal((await modules.savings.getSavingsTransactions(home.id)).length, 3);
    const snapshot = await modules.savings.getSavingsSnapshot();
    assert.equal(snapshot.accounts.length, 2);
    assert.equal(snapshot.archived.length, 1);
    assert.equal(snapshot.history[new Date().getMonth()], 124000.29);
    assert.ok(snapshot.history.slice(new Date().getMonth() + 1).every(v => v === null));
    const data = { savings: snapshot.accounts, income: await modules.income.default.get(), expenses: await modules.expense.default.get(), investments: await modules.investment.default.get() };
    assert.equal(modules.finance.calculateTotals(data).cashFlow, 0);
    assert.deepEqual(modules.finance.expenseBreakdown(data.expenses), []);
  } finally {
    await modules?.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test('version 1 upgrade preserves named balances, investments and legacy snapshots exactly once', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'neylo-upgrade-'));
  const modules = await loadModules(join(directory, 'unused.db'));
  const db = adapter(':memory:');
  try {
    await modules.migrations.migrateDatabase(db);
    // Reconstruct the shipped v1 schema with customized existing user data.
    await restoreLegacyExpenses(db);
    await db.execAsync('DROP TABLE user_profile; DROP TABLE asset_transactions; DROP TABLE asset_accounts; PRAGMA user_version = 1;');
    await db.execAsync("INSERT INTO savings (name, type, amount, month, year) VALUES ('My savings', 'savings', 7654321, 1, 2025), ('Investment fixture', 'investments', 12345, 1, 2025); INSERT INTO savings_history (amount, month, year) VALUES (7666666, 1, 2025);");
    const before = await db.getAllAsync('SELECT * FROM savings');
    const snapshots = await db.getAllAsync('SELECT * FROM savings_history');
    await modules.migrations.migrateDatabase(db);
    await modules.migrations.migrateDatabase(db);
    const rows = await db.getAllAsync('SELECT * FROM asset_accounts');
    assert.equal(rows.length, 1);
    assert.equal(rows[0].name, 'My savings');
    assert.equal(rows[0].initial_balance_minor, 7654321);
    assert.deepEqual(await db.getAllAsync('SELECT * FROM savings'), before);
    assert.deepEqual(await db.getAllAsync('SELECT * FROM savings_history'), snapshots);
    assert.deepEqual(await db.getAllAsync('SELECT * FROM asset_transactions'), []);
  } finally {
    await db.closeAsync();
    await rm(directory, { recursive: true, force: true });
  }
});

test('simple forms use today automatically; archiving retains past graph balances', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'neylo-simple-'));
  let modules;
  try {
    const path = join(directory, 'neylo.db');
    modules = await loadModules(path);
    const r = modules.savings;
    for (const row of await r.getSavingsAccounts()) {
      await r.addSavingsTransaction(row.id, { amount: row.amount, type: 'withdrawal' });
      await r.archiveSavingsAccount(row.id);
    }
    const home = await r.createSavingsAccount({ name: 'Home', initialBalance: 70000 });
    assert.equal(home.created_at, r.today());
    assert.equal(await r.getTotalSavings(), 70000);
    const emergency = await r.createSavingsAccount({ name: 'Emergency Fund', initialBalance: 50000 });
    assert.equal(await r.getTotalSavings(), 120000);
    await r.addSavingsTransaction(home.id, { amount: 9000, type: 'deposit' });
    assert.equal(await r.getTotalSavings(), 129000);
    await r.addSavingsTransaction(emergency.id, { amount: 5000, type: 'withdrawal' });
    assert.equal(await r.getTotalSavings(), 124000);
    await r.transferBetweenSavingsAccounts(emergency.id, home.id, { amount: 10000 });
    assert.equal(await r.getSavingsAccountBalance(home.id), 89000);
    assert.equal(await r.getSavingsAccountBalance(emergency.id), 35000);
    assert.equal(await r.getTotalSavings(), 124000);
    assert.ok((await r.getSavingsTransactions(home.id)).every(row => row.date === r.today()));
    const past = await r.createSavingsAccount({ name: 'Past', initialBalance: 123, date: '2024-01-01' });
    await r.transferBetweenSavingsAccounts(past.id, home.id, { amount: 123 });
    const before = await r.getSavingsHistory(2024);
    assert.equal(before[0], 123);
    await r.archiveSavingsAccount(past.id);
    assert.deepEqual(await r.getSavingsHistory(2024), before);
    await modules.close();
    modules = await loadModules(path);
    assert.equal(await modules.savings.getTotalSavings(), 124123);
    const snapshot = await modules.savings.getSavingsSnapshot();
    assert.equal(snapshot.history[new Date().getMonth()], 124123);
    assert.equal(snapshot.histories[home.id][new Date().getMonth()], 89123);
  } finally {
    await modules?.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test('overview money actions: +5000 and -2000 update snapshots and survive reopening', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'neylo-overview-'));
  const path = join(directory, 'neylo.db');
  let modules;
  try {
    modules = await loadModules(path);
    const r = modules.savings;
    const home = await r.createSavingsAccount({ name: 'Home', initialBalance: 82000 });
    const emergency = await r.createSavingsAccount({ name: 'Emergency Fund', initialBalance: 50000 });
    const baseline = await r.getTotalSavings();
    const month = new Date().getMonth();
    await r.addSavingsTransaction(home.id, { type: 'deposit', amount: 5000, note: 'Extra savings' });
    let snapshot = await r.getSavingsSnapshot();
    assert.equal(snapshot.accounts.find(row => row.id === home.id).amount, 87000);
    assert.equal(await r.getTotalSavings(), baseline + 5000);
    assert.equal(snapshot.history[month], baseline + 5000);
    assert.equal(snapshot.histories[home.id][month], 87000);
    assert.equal(snapshot.activity[home.id][0].note, 'Extra savings');
    await r.addSavingsTransaction(emergency.id, { type: 'withdrawal', amount: 2000 });
    snapshot = await r.getSavingsSnapshot();
    assert.equal(snapshot.accounts.find(row => row.id === emergency.id).amount, 48000);
    assert.equal(snapshot.history[month], baseline + 3000);
    assert.equal(snapshot.histories[emergency.id][month], 48000);
    await modules.close();
    modules = await loadModules(path);
    assert.equal(await modules.savings.getTotalSavings(), baseline + 3000);
    assert.equal(await modules.savings.getSavingsAccountBalance(home.id), 87000);
    assert.equal(await modules.savings.getSavingsAccountBalance(emergency.id), 48000);
  } finally {
    await modules?.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test('clean installation and restart keep all financial data empty without reseeding', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'neylo-empty-'));
  const path = join(directory, 'neylo.db');
  let modules;
  try {
    for (let launch = 0; launch < 2; launch++) {
      modules = await loadModules(path);
      const snapshot = await modules.savings.getSavingsSnapshot();
      assert.deepEqual(snapshot.accounts, []);
      assert.deepEqual(snapshot.archived, []);
      assert.ok(snapshot.history.every(value => value === null || value === 0));
      const data = { savings: snapshot.accounts, income: await modules.income.default.get(), expenses: await modules.expense.default.get(), investments: await modules.investment.default.get() };
      assert.ok(Object.values(modules.finance.calculateTotals(data)).every(value => value === 0));
      assert.deepEqual(modules.finance.expenseBreakdown(data.expenses), []);
      const db = adapter(path);
      try {
        for (const table of ['income', 'expenses', 'savings', 'savings_history', 'asset_accounts', 'asset_transactions']) {
          assert.equal((await db.getFirstAsync(`SELECT count(*) AS n FROM ${table}`)).n, 0);
        }
        assert.equal((await db.getFirstAsync('PRAGMA user_version')).user_version, 4);
        assert.deepEqual(await db.getAllAsync('PRAGMA foreign_key_check'), []);
      } finally { await db.closeAsync(); }
      await modules.close();
      modules = undefined;
    }
  } finally {
    await modules?.close();
    await rm(directory, { recursive: true, force: true });
  }
});


test('profile writes remain ordered, survive reopening and preserve financial data', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'neylo-profile-'));
  const path = join(directory, 'neylo.db');
  let modules;
  try {
    modules = await loadModules(path);
    assert.equal(await modules.profile.getName(), '');
    const account = await modules.savings.createSavingsAccount({ name: 'Keep savings', initialBalance: 1234 });
    await modules.profile.saveName('Sune');
    await Promise.all(['M', 'Ma', 'Marc', 'Marco'].map(name => modules.profile.saveName(name)));
    await modules.close();
    modules = await loadModules(path);
    assert.equal(await modules.profile.getName(), 'Marco');
    assert.equal((await modules.savings.getSavingsSnapshot()).accounts[0].id, account.id);
    assert.equal(await modules.savings.getTotalSavings(), 1234);
    await modules.profile.saveName('');
    await modules.close();
    modules = await loadModules(path);
    assert.equal(await modules.profile.getName(), '');
  } finally {
    await modules?.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test('version 2 profile migration leaves existing financial tables unchanged', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'neylo-profile-upgrade-'));
  const modules = await loadModules(join(directory, 'unused.db'));
  const db = adapter(':memory:');
  try {
    await modules.migrations.migrateDatabase(db);
    await restoreLegacyExpenses(db);
    await db.execAsync("DROP TABLE user_profile; PRAGMA user_version = 2; INSERT INTO income (name, amount, month, year) VALUES ('Salary', 3000000, 9, 2026);");
    const tables = ['income', 'expenses', 'savings', 'savings_history', 'asset_accounts', 'asset_transactions'];
    const before = await Promise.all(tables.map(table => db.getAllAsync(`SELECT * FROM ${table}`)));
    await modules.migrations.migrateDatabase(db);
    await modules.migrations.migrateDatabase(db);
    assert.deepEqual(await Promise.all(tables.map(table => db.getAllAsync(`SELECT * FROM ${table}`))), before);
    assert.equal((await db.getFirstAsync('PRAGMA user_version')).user_version, 4);
    assert.deepEqual(await db.getAllAsync('SELECT * FROM user_profile'), []);
  } finally {
    await db.closeAsync();
    await modules.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test('category lifecycle A–F: persistence, rename, explicit reassignment, validation and empty list', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'neylo-categories-'));
  const path = join(directory, 'neylo.db');
  let modules;
  try {
    modules = await loadModules(path);
    let r = modules.expenseCategory;
    const restaurant = await r.createExpenseCategory('  Restaurant  ');
    await assert.rejects(r.createExpenseCategory('restaurant'), /allerede/);
    await assert.rejects(r.createExpenseCategory('   '), /navn/);
    const danish = await r.createExpenseCategory('Æbler');
    await assert.rejects(r.createExpenseCategory('æBLER'), /allerede/);
    await assert.rejects(r.renameExpenseCategory(danish, 'RESTAURANT'), /allerede/);
    await modules.close(); modules = await loadModules(path); r = modules.expenseCategory;
    assert.equal((await r.getExpenseCategories()).find(c => c.id === restaurant).name, 'Restaurant');
    const expense = await modules.expense.addExpense({ name: 'Dinner', amount: 500, category_id: restaurant, month: 2, year: 2025 });
    await r.renameExpenseCategory(restaurant, 'Eating Out');
    let rows = await modules.expense.getExpenses();
    assert.equal(rows[0].category, 'Eating Out');
    assert.equal(rows[0].id, expense.id);
    assert.equal(modules.finance.expenseBreakdown(rows)[0].name, 'Eating Out');
    assert.equal(modules.finance.expenseBreakdown(rows)[0].amount, 500);
    const unused = await r.createExpenseCategory('Test Category');
    await r.deleteExpenseCategory(unused);
    assert.deepEqual(await modules.expense.getExpenses(), rows);
    await assert.rejects(r.deleteExpenseCategory(restaurant), /anden kategori/);
    await assert.rejects(r.deleteExpenseCategory(restaurant, restaurant), /anden kategori/);
    await assert.rejects(r.deleteExpenseCategory(restaurant, '999999'), /anden kategori/);
    assert.deepEqual(await modules.expense.getExpenses(), rows);
    const other = (await r.getExpenseCategories()).find(c => c.name === 'Other');
    assert.equal((await r.getExpenseCategories()).find(c => c.id === restaurant).expense_count, 1);
    // A failure after reassignment must roll back both operations.
    const db = adapter(path);
    await db.execAsync("CREATE TRIGGER fail_category_delete BEFORE DELETE ON expense_categories BEGIN SELECT RAISE(ABORT, 'simulated failure'); END;");
    await assert.rejects(r.deleteExpenseCategory(restaurant, other.id), /simulated failure/);
    assert.deepEqual(await modules.expense.getExpenses(), rows);
    await db.execAsync('DROP TRIGGER fail_category_delete');
    await db.closeAsync();
    await r.deleteExpenseCategory(restaurant, other.id);
    rows = await modules.expense.getExpenses();
    assert.equal(rows[0].category, 'Other');
    for (const key of ['id', 'name', 'amount', 'month', 'year', 'created_at']) assert.equal(rows[0][key], expense[key]);
    assert.equal(modules.finance.expenseBreakdown(rows)[0].share, 1);
    await modules.close(); modules = await loadModules(path); r = modules.expenseCategory;
    assert.deepEqual(await modules.expense.getExpenses(), rows);
    assert.ok(!(await r.getExpenseCategories()).some(c => [restaurant, unused].includes(c.id)));
    await assert.rejects(modules.expense.addExpense({ name: 'Bad category', amount: 5, category_id: restaurant }), /kategori/);
    await modules.expense.deleteExpense(expense.id);
    for (const category of await r.getExpenseCategories()) await r.deleteExpenseCategory(category.id);
    await modules.close(); modules = await loadModules(path); r = modules.expenseCategory;
    assert.deepEqual(await r.getExpenseCategories(), []);
    const fresh = await r.createExpenseCategory('Fresh');
    assert.equal((await modules.expense.addExpense({ name: 'New', amount: 10, category_id: fresh })).category, 'Fresh');
  } finally { await modules?.close(); await rm(directory, { recursive: true, force: true }); }
});

test('v3 category migration preserves all expense fields and custom names, merges case, and rolls back safely', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'neylo-category-migration-'));
  const modules = await loadModules(join(directory, 'unused.db'));
  const db = adapter(':memory:');
  try {
    await db.execAsync('PRAGMA foreign_keys = ON');
    await modules.migrations.migrateDatabase(db);
    await restoreLegacyExpenses(db);
    await db.execAsync(`PRAGMA user_version = 3;
      INSERT INTO expenses (id, name, category, amount, month, year, created_at, updated_at) VALUES
      (8, 'Rent', 'Housing', 123456, 2, 2024, '2024-02-01', '2024-03-02'),
      (9, 'Food', 'mad', 50000, 3, 2025, '2025-03-01', '2025-03-03'),
      (10, 'Food again', ' MAD ', 25, 4, 2025, '2025-04-01', '2025-04-02'),
      (11, 'Unknown', NULL, 0, 5, 2025, '2025-05-01', '2025-05-02');`);
    await db.execAsync("INSERT INTO expenses (id, name, amount, month, year) VALUES (99, 'Deleted', 1, 1, 2025); DELETE FROM expenses WHERE id = 99;");
    const before = await db.getAllAsync('SELECT * FROM expenses ORDER BY id');
    const original = db.execAsync;
    db.execAsync = async sql => { await original(sql); if (sql.includes('DROP TABLE expenses;')) throw new Error('migration failure'); };
    await assert.rejects(modules.migrations.migrateDatabase(db), /migration failure/);
    assert.equal((await db.getFirstAsync('PRAGMA user_version')).user_version, 3);
    assert.deepEqual(await db.getAllAsync('SELECT * FROM expenses ORDER BY id'), before);
    db.execAsync = original;
    await modules.migrations.migrateDatabase(db);
    await modules.migrations.migrateDatabase(db);
    const after = await db.getAllAsync('SELECT e.*, c.name AS category FROM expenses e JOIN expense_categories c ON c.id = e.category_id ORDER BY e.id');
    assert.equal(after.length, before.length);
    assert.equal((await db.getFirstAsync("SELECT seq FROM sqlite_sequence WHERE name = 'expenses'")).seq, 99);
    for (let i = 0; i < before.length; i++) {
      for (const key of ['id', 'name', 'amount', 'month', 'year', 'created_at', 'updated_at']) assert.equal(after[i][key], before[i][key]);
    }
    assert.equal(after[1].category_id, after[2].category_id);
    assert.equal(after[3].category, 'Other');
    assert.equal((await db.getFirstAsync('SELECT count(*) AS n FROM expense_categories')).n, 8);
    assert.deepEqual(await db.getAllAsync('PRAGMA foreign_key_check'), []);
    await assert.rejects(db.runAsync('DELETE FROM expense_categories WHERE id = ?', [after[0].category_id]), /FOREIGN KEY/);
  } finally { await db.closeAsync(); await rm(directory, { recursive: true, force: true }); }
});
