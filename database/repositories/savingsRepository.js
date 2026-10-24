// Denne repository håndterer opsparingskonti, transaktioner og historik, så saldoen, grafer og arkiv følger samme regnskabslogik.
import { withDatabase } from '../database.js';
import { toMinorUnits, validatePeriod } from '../money.js';

export function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function validDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date || date > today()) {
    throw new Error('Brug en gyldig dato (YYYY-MM-DD), senest i dag.');
  }
  return date;
}
function nameValue(name) {
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 60) throw new Error('Skriv et navn på højst 60 tegn.');
  return name.trim();
}
const accountQuery = `SELECT a.*, a.initial_balance_minor + COALESCE(SUM(t.amount_minor), 0) AS balance_minor
  FROM asset_accounts a LEFT JOIN asset_transactions t ON t.account_id = a.id`;
const mapAccount = row => row && ({ ...row, id: String(row.id), amount: row.balance_minor / 100 });
async function account(db, id, active = false) {
  const row = await db.getFirstAsync(`${accountQuery} WHERE a.id = ? AND a.type = 'savings' GROUP BY a.id`, [id]);
  if (!row || (active && row.archived_at)) throw new Error('Kontoen findes ikke eller er arkiveret.');
  return mapAccount(row);
}
async function accounts(db, includeArchived = false) {
  return (await db.getAllAsync(`${accountQuery} WHERE a.type = 'savings' ${includeArchived ? '' : 'AND a.archived_at IS NULL'} GROUP BY a.id ORDER BY a.id`)).map(mapAccount);
}
export const getSavingsAccounts = (includeArchived = false) => withDatabase(db => accounts(db, includeArchived));
export const getSavingsAccount = id => withDatabase(db => account(db, id));
export const getSavingsAccountBalance = id => withDatabase(async db => (await account(db, id)).amount);
export const getTotalSavings = () => withDatabase(async db => (await accounts(db)).reduce((sum, row) => sum + row.balance_minor, 0) / 100);
export const createSavingsAccount = ({ name, initialBalance = 0, date = today(), category = null }) => withDatabase(async db => {
  if (category !== null && (typeof category !== 'string' || category.length > 60)) throw new Error('Ugyldig kategori.');
  const result = await db.runAsync(`INSERT INTO asset_accounts (name, initial_balance_minor, created_at, category) VALUES (?, ?, ?, ?)`,
    [nameValue(name), toMinorUnits(initialBalance), validDate(date), category]);
  return account(db, result.lastInsertRowId);
});
export const updateSavingsAccount = (id, { name }) => withDatabase(async db => {
  await account(db, id, true);
  await db.runAsync('UPDATE asset_accounts SET name = ? WHERE id = ?', [nameValue(name), id]);
  return account(db, id);
});
export const archiveSavingsAccount = id => withDatabase(async db => {
  const row = await account(db, id, true);
  if (row.balance_minor !== 0) throw new Error('Overfør eller hæv saldoen før arkivering.');
  await db.runAsync('UPDATE asset_accounts SET archived_at = ? WHERE id = ?', [today(), id]);
});
export const getSavingsTransactions = id => withDatabase(async db => {
  await account(db, id);
  return (await db.getAllAsync('SELECT * FROM asset_transactions WHERE account_id = ? ORDER BY date DESC, id DESC', [id]))
    .map(row => ({ ...row, id: String(row.id), amount: row.amount_minor / 100 }));
});
// Check the entire dated ledger: backdated withdrawals must not overdraw an earlier day.
async function validateLedger(db, id) {
  const row = await account(db, id);
  let balance = row.initial_balance_minor;
  for (const day of await db.getAllAsync('SELECT date, SUM(amount_minor) AS amount FROM asset_transactions WHERE account_id = ? GROUP BY date ORDER BY date', [id])) {
    balance += day.amount;
    if (!Number.isSafeInteger(balance) || balance < 0) throw new Error('Ikke tilstrækkelig saldo på den valgte dato eller en senere dato.');
  }
}
async function insertTransaction(db, id, amount, type, date, note, transferId = null) {
  const row = await account(db, id, true);
  validDate(date);
  if (date < row.created_at.slice(0, 10)) throw new Error('Datoen ligger før kontoens oprettelse.');
  if (typeof note !== 'string' || note.length > 500) throw new Error('Noten må højst være 500 tegn.');
  return db.runAsync(`INSERT INTO asset_transactions (account_id, amount_minor, transaction_type, date, note, transfer_id) VALUES (?, ?, ?, ?, ?, ?)`, [id, amount, type, date, note.trim() || null, transferId]);
}
export const addSavingsTransaction = (id, { amount, type, date = today(), note = '' }) => withDatabase(async db => {
  const minor = toMinorUnits(amount);
  if (!minor || !['deposit', 'withdrawal'].includes(type)) throw new Error('Skriv et positivt beløb.');
  await db.withTransactionAsync(async () => {
    await insertTransaction(db, id, type === 'withdrawal' ? -minor : minor, type, date, note);
    await validateLedger(db, id);
  });
});
export const transferBetweenSavingsAccounts = (fromId, toId, { amount, date = today(), note = '' }) => withDatabase(async db => {
  const minor = toMinorUnits(amount);
  if (String(fromId) === String(toId) || !minor) throw new Error('Vælg en anden konto og et positivt beløb.');
  await db.withTransactionAsync(async () => {
    const { transfer_id: transferId } = await db.getFirstAsync('SELECT lower(hex(randomblob(16))) AS transfer_id');
    await insertTransaction(db, fromId, -minor, 'transfer', date, note, transferId);
    await insertTransaction(db, toId, minor, 'transfer', date, note, transferId);
    await validateLedger(db, fromId);
    await validateLedger(db, toId);
  });
});
// Financial history is retained; corrections use compensating transactions, not deletion.
export const deleteSavingsTransaction = () => Promise.reject(new Error('Historik kan ikke slettes. Opret en modpost i stedet.'));
async function history(db, year, accountId = null) {
  validatePeriod(1, year);
  // Zero-balance archived pots still contribute their real balances in past months.
  const rows = accountId === null ? await accounts(db, true) : [await account(db, accountId)];
  const transactions = await db.getAllAsync('SELECT account_id, date, amount_minor FROM asset_transactions ORDER BY date');
  const now = today();
  return Array.from({ length: 12 }, (_, index) => {
    const start = `${year}-${String(index + 1).padStart(2, '0')}-01`;
    if (start > now) return null;
    const end = `${year}-${String(index + 1).padStart(2, '0')}-${new Date(year, index + 1, 0).getDate()}`;
    const cutoff = end > now ? now : end;
    const eligible = rows.filter(row => row.created_at.slice(0, 10) <= cutoff);
    if (!eligible.length) return null;
    const ids = new Set(eligible.map(row => String(row.id)));
    return (eligible.reduce((sum, row) => sum + row.initial_balance_minor, 0) +
      transactions.filter(row => ids.has(String(row.account_id)) && row.date <= cutoff).reduce((sum, row) => sum + row.amount_minor, 0)) / 100;
  });
}
export const getSavingsHistory = (year, accountId = null) => withDatabase(db => history(db, year, accountId));
export const getSavingsAccountHistory = (id, year) => getSavingsHistory(year, id);
// One queued read makes account totals and all chart series a consistent UI snapshot.
export const getSavingsSnapshot = (year = new Date().getFullYear()) => withDatabase(async db => {
  const all = await accounts(db, true);
  const histories = {};
  const activity = {};
  for (const row of all) {
    histories[row.id] = await history(db, year, row.id);
    activity[row.id] = (await db.getAllAsync('SELECT * FROM asset_transactions WHERE account_id = ? ORDER BY date DESC, id DESC', [row.id]))
      .map(item => ({ ...item, id: String(item.id), amount: item.amount_minor / 100 }));
  }
  return { accounts: all.filter(row => !row.archived_at), archived: all.filter(row => row.archived_at), histories, activity, history: await history(db, year) };
});
