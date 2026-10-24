// Denne fil opgraderer databasen i et par trin, så gammel data flyttes korrekt over i den nye struktur uden at miste vigtige oplysninger.
// Identifiers below are fixed application constants, never user input.
const migrations = [async db => {
  for (const table of ['income', 'expenses', 'savings']) {
    await db.execAsync(`CREATE TABLE ${table} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      ${table === 'savings' ? "type TEXT NOT NULL CHECK(type IN ('savings', 'investments'))," : ''}
      amount INTEGER NOT NULL CHECK(typeof(amount) = 'integer' AND amount BETWEEN 0 AND 99999999900),
      month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
      year INTEGER NOT NULL CHECK(year BETWEEN 1 AND 9999),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
    CREATE INDEX ${table}_period ON ${table}(year, month);`);
  }
  await db.execAsync(`CREATE TABLE savings_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount INTEGER NOT NULL CHECK(typeof(amount) = 'integer' AND amount BETWEEN 0 AND 99999999900),
    month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK(year BETWEEN 1 AND 9999),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE(year, month)
  );`);
}, async db => {
  await db.execAsync(`CREATE TABLE asset_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'savings',
    category TEXT,
    initial_balance_minor INTEGER NOT NULL CHECK(typeof(initial_balance_minor) = 'integer' AND initial_balance_minor BETWEEN 0 AND 99999999900),
    created_at TEXT NOT NULL,
    archived_at TEXT,
    legacy_savings_id INTEGER UNIQUE REFERENCES savings(id)
  );
  CREATE TABLE asset_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL REFERENCES asset_accounts(id) ON DELETE RESTRICT,
    amount_minor INTEGER NOT NULL CHECK(typeof(amount_minor) = 'integer' AND amount_minor != 0 AND abs(amount_minor) <= 99999999900),
    transaction_type TEXT NOT NULL CHECK(transaction_type IN ('deposit', 'withdrawal', 'transfer')),
    date TEXT NOT NULL,
    note TEXT,
    transfer_id TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    CHECK((transaction_type = 'deposit' AND amount_minor > 0 AND transfer_id IS NULL)
      OR (transaction_type = 'withdrawal' AND amount_minor < 0 AND transfer_id IS NULL)
      OR (transaction_type = 'transfer' AND transfer_id IS NOT NULL))
  );
  CREATE INDEX asset_transactions_account_date ON asset_transactions(account_id, date);
  CREATE INDEX asset_transactions_transfer ON asset_transactions(transfer_id);
  INSERT INTO asset_accounts (name, type, category, initial_balance_minor, created_at, legacy_savings_id)
    SELECT CASE WHEN trim(name) = '' THEN 'General Savings' ELSE name END,
      'savings', category, amount, date('now', 'localtime'), id FROM savings WHERE type = 'savings';`);
  // Legacy snapshots (which included investments) and source rows remain untouched.
}, async db => {
  await db.execAsync(`CREATE TABLE user_profile (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    name TEXT NOT NULL DEFAULT ''
  );`);
}, async db => {
  await db.execAsync(`CREATE TABLE expense_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL CHECK(length(trim(name)) > 0),
    name_key TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );`);
  // Seed once during migration, never during ordinary startup.
  const defaults = ['Housing', 'Food', 'Transport', 'Insurance', 'Subscriptions', 'Entertainment', 'Other'];
  const legacy = await db.getAllAsync('SELECT * FROM expenses ORDER BY id');
  const sequence = await db.getFirstAsync("SELECT seq FROM sqlite_sequence WHERE name = 'expenses'");
  const ids = new Map();
  for (const value of [...defaults, ...legacy.map(row => row.category?.trim() || 'Other')]) {
    // Preserve even unusually long legacy category names.
    const name = value.trim().normalize('NFC');
    const key = name.toLocaleLowerCase('da-DK');
    if (!ids.has(key)) {
      const result = await db.runAsync('INSERT INTO expense_categories (name, name_key) VALUES (?, ?)', [name, key]);
      ids.set(key, result.lastInsertRowId);
    }
  }
  await db.execAsync(`CREATE TABLE expenses_categorized (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_id INTEGER NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
    amount INTEGER NOT NULL CHECK(typeof(amount) = 'integer' AND amount BETWEEN 0 AND 99999999900),
    month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK(year BETWEEN 1 AND 9999),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );`);
  for (const row of legacy) {
    const key = (row.category?.trim() || 'Other').normalize('NFC').toLocaleLowerCase('da-DK');
    await db.runAsync('INSERT INTO expenses_categorized (id, name, category_id, amount, month, year, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [row.id, row.name, ids.get(key), row.amount, row.month, row.year, row.created_at, row.updated_at]);
  }
  await db.execAsync(`DROP TABLE expenses;
    ALTER TABLE expenses_categorized RENAME TO expenses;
    CREATE INDEX expenses_period ON expenses(year, month);
    CREATE INDEX expenses_category ON expenses(category_id);`);
  if (sequence) {
    await db.runAsync("INSERT INTO sqlite_sequence (name, seq) SELECT 'expenses', ? WHERE NOT EXISTS (SELECT 1 FROM sqlite_sequence WHERE name = 'expenses')", [sequence.seq]);
    await db.runAsync("UPDATE sqlite_sequence SET seq = max(seq, ?) WHERE name = 'expenses'", [sequence.seq]);
  }
}];

export async function migrateDatabase(db) {
  // Initialization owns the connection until this transaction completes.
  await db.withTransactionAsync(async () => {
    const { user_version: version } = await db.getFirstAsync('PRAGMA user_version');
    if (version > migrations.length) throw new Error('Database requires a newer version of Neylo');
    for (let index = version; index < migrations.length; index++) {
      await migrations[index](db);
      await db.execAsync(`PRAGMA user_version = ${index + 1}`);
    }
  });
}
