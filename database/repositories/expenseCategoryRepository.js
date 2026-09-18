import { withDatabase } from '../database.js';
import { categoryName } from '../categoryNames.js';

const list = async db => (await db.getAllAsync(`SELECT c.*, count(e.id) AS expense_count
  FROM expense_categories c LEFT JOIN expenses e ON e.category_id = c.id GROUP BY c.id ORDER BY c.id`))
  .map(row => ({ ...row, id: String(row.id) }));
export const getExpenseCategories = () => withDatabase(list);

async function validateName(db, value, id = null) {
  const result = categoryName(value);
  const duplicate = await db.getFirstAsync('SELECT id FROM expense_categories WHERE name_key = ? AND (? IS NULL OR id != ?)', [result.key, id, id]);
  if (duplicate) throw new Error('Der findes allerede en kategori med dette navn.');
  return result;
}
export const createExpenseCategory = value => withDatabase(async db => {
  const { name, key } = await validateName(db, value);
  const result = await db.runAsync('INSERT INTO expense_categories (name, name_key) VALUES (?, ?)', [name, key]);
  return String(result.lastInsertRowId);
});
export const renameExpenseCategory = (id, value) => withDatabase(async db => {
  const { name, key } = await validateName(db, value, id);
  const result = await db.runAsync("UPDATE expense_categories SET name = ?, name_key = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?", [name, key, id]);
  if (!result.changes) throw new Error('Kategorien findes ikke længere.');
});
export const deleteExpenseCategory = (id, replacementId = null) => withDatabase(async db => {
  await db.withTransactionAsync(async () => {
    if (!await db.getFirstAsync('SELECT id FROM expense_categories WHERE id = ?', [id])) throw new Error('Kategorien findes ikke længere.');
    const { count } = await db.getFirstAsync('SELECT count(*) AS count FROM expenses WHERE category_id = ?', [id]);
    if (count > 0) {
      if (!replacementId || String(replacementId) === String(id) || !await db.getFirstAsync('SELECT id FROM expense_categories WHERE id = ?', [replacementId])) {
        throw new Error('Vælg en anden kategori til posterne.');
      }
      await db.runAsync("UPDATE expenses SET category_id = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE category_id = ?", [replacementId, id]);
    }
    await db.runAsync('DELETE FROM expense_categories WHERE id = ?', [id]);
  });
});
