import { withDatabase } from '../database.js';
import { toMinorUnits, validatePeriod } from '../money.js';

const query = 'SELECT e.*, c.name AS category FROM expenses e JOIN expense_categories c ON c.id = e.category_id';
const mapRow = row => ({ ...row, id: String(row.id), category_id: String(row.category_id), amount: row.amount / 100 });
async function valuesFor(db, values) {
  const now = new Date();
  const month = values.month ?? now.getMonth() + 1;
  const year = values.year ?? now.getFullYear();
  validatePeriod(month, year);
  if (typeof values.name !== 'string' || !values.name.trim()) throw new Error('Name is required');
  if (!values.category_id || !await db.getFirstAsync('SELECT id FROM expense_categories WHERE id = ?', [values.category_id])) throw new Error('Vælg en kategori.');
  return [values.name.trim(), values.category_id, toMinorUnits(values.amount), month, year];
}
export const getExpenses = () => withDatabase(async db => (await db.getAllAsync(`${query} ORDER BY e.id`)).map(mapRow));
export const addExpense = values => withDatabase(async db => {
  const result = await db.runAsync('INSERT INTO expenses (name, category_id, amount, month, year) VALUES (?, ?, ?, ?, ?)', await valuesFor(db, values));
  return mapRow(await db.getFirstAsync(`${query} WHERE e.id = ?`, [result.lastInsertRowId]));
});
export const updateExpense = (id, values) => withDatabase(async db => {
  const current = await db.getFirstAsync(`${query} WHERE e.id = ?`, [id]);
  if (!current) throw new Error('Entry no longer exists');
  await db.runAsync("UPDATE expenses SET name = ?, category_id = ?, amount = ?, month = ?, year = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?", [...await valuesFor(db, { ...mapRow(current), ...values }), id]);
  return mapRow(await db.getFirstAsync(`${query} WHERE e.id = ?`, [id]));
});
export const deleteExpense = id => withDatabase(db => db.runAsync('DELETE FROM expenses WHERE id = ?', [id]));
export default { get: getExpenses, add: addExpense, update: updateExpense, remove: deleteExpense };
