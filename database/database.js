// Denne fil opretter og cacher appens SQLite-forbindelse, aktiverer sikkerhedsindstillinger og kører migrationer før første brug.
import { openDatabaseAsync } from 'expo-sqlite';
import { migrateDatabase } from './migrations.js';

let databasePromise;
export function getDatabase() {
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = await openDatabaseAsync('neylo.db');
      try {
        await db.execAsync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
        await migrateDatabase(db);
        return db;
      } catch (error) {
        await db.closeAsync().catch(() => {});
        throw error;
      }
    })().catch(error => {
      databasePromise = undefined;
      throw error;
    });
  }
  return databasePromise;
}

// Serialize repository operations, including read-after-write, on this connection.
let queue = Promise.resolve();
export function withDatabase(operation) {
  const result = queue.then(async () => operation(await getDatabase()));
  queue = result.catch(() => {});
  return result;
}
