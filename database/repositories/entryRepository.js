// Denne repository håndterer de almindelige CRUD-operationer for indtægter, udgifter og opsparingsposter i den relevante tabel.
import { withDatabase } from '../database.js';
import { toMinorUnits, validatePeriod } from '../money.js';

const mapRow = row => ({ ...row, id: String(row.id), amount: row.amount / 100 });

// Only repository modules supply these identifiers; caller values are always bound.
export function createEntryRepository(table, type) {
  if (!['income', 'expenses', 'savings'].includes(table) ||
      (table === 'savings' && !['savings', 'investments'].includes(type))) throw new Error('Invalid repository');
  const scope = type ? ' AND type = ?' : '';
  const scopeParams = type ? [type] : [];
  function valuesFor(values) {
    const now = new Date();
    const month = values.month ?? now.getMonth() + 1;
    const year = values.year ?? now.getFullYear();
    validatePeriod(month, year);
    if (typeof values.name !== 'string' || !values.name.trim()) throw new Error('Name is required');
    if (values.category != null && typeof values.category !== 'string') throw new Error('Invalid category');
    return [values.name.trim(), values.category ?? null, toMinorUnits(values.amount), month, year];
  }
  return {
    get: () => withDatabase(async db => (await db.getAllAsync(`SELECT * FROM ${table} WHERE 1 = 1${scope} ORDER BY id`, scopeParams)).map(mapRow)),
    add: values => withDatabase(async db => {
      const result = await db.runAsync(`INSERT INTO ${table} (name, category, amount, month, year${type ? ', type' : ''}) VALUES (?, ?, ?, ?, ?${type ? ', ?' : ''})`, [...valuesFor(values), ...scopeParams]);
      return mapRow(await db.getFirstAsync(`SELECT * FROM ${table} WHERE id = ?`, [result.lastInsertRowId]));
    }),
    update: (id, values) => withDatabase(async db => {
      const current = await db.getFirstAsync(`SELECT * FROM ${table} WHERE id = ?${scope}`, [id, ...scopeParams]);
      if (!current) throw new Error('Entry no longer exists');
      await db.runAsync(`UPDATE ${table} SET name = ?, category = ?, amount = ?, month = ?, year = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?${scope}`,
        [...valuesFor({ ...mapRow(current), ...values }), id, ...scopeParams]);
      return mapRow(await db.getFirstAsync(`SELECT * FROM ${table} WHERE id = ?${scope}`, [id, ...scopeParams]));
    }),
    remove: id => withDatabase(db => db.runAsync(`DELETE FROM ${table} WHERE id = ?${scope}`, [id, ...scopeParams])),
  };
}
