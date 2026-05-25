import * as SQLite from 'expo-sqlite';
import { CREATE_CATEGORIES, CREATE_NOTES, SCHEMA_VERSION, SEED_CATEGORIES } from './schema';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('mnemonic.db');
  await migrate(_db);
  return _db;
}

export async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const { user_version: currentVersion } = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  ) ?? { user_version: 0 };

  if (currentVersion < 1) {
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.execAsync(CREATE_CATEGORIES);
      await txn.execAsync(CREATE_NOTES);
      await txn.execAsync(SEED_CATEGORIES);
      await txn.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
    });
  }
}
