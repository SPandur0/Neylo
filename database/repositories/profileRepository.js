import { withDatabase } from '../database.js';

export function getName() {
  return withDatabase(async db => (await db.getFirstAsync('SELECT name FROM user_profile WHERE id = 1'))?.name ?? '');
}
export function saveName(name) {
  return withDatabase(db => db.runAsync(
    'INSERT INTO user_profile (id, name) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name', [name],
  ));
}
