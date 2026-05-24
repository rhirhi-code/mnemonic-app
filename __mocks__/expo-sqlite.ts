// Jest mock for expo-sqlite using Node.js built-in SQLite (available in Node 22+)
// Provides real SQL execution for tests without requiring native modules.
import { DatabaseSync } from 'node:sqlite';
import type { SQLInputValue } from 'node:sqlite';

function toSQLInputValues(params: unknown[]): SQLInputValue[] {
  return params as SQLInputValue[];
}

class MockSQLiteDatabase {
  private _db: DatabaseSync;

  constructor() {
    this._db = new DatabaseSync(':memory:');
  }

  async execAsync(sql: string): Promise<void> {
    this._db.exec(sql);
  }

  async runAsync(sql: string, ...args: unknown[]): Promise<{ lastInsertRowId: number; changes: number }> {
    const params = args.length === 1 && Array.isArray(args[0]) ? (args[0] as unknown[]) : args;
    const result = this._db.prepare(sql).run(...toSQLInputValues(params));
    return { lastInsertRowId: Number(result.lastInsertRowid), changes: Number(result.changes) };
  }

  async getFirstAsync<T>(sql: string, ...args: unknown[]): Promise<T | null> {
    const params = args.length === 1 && Array.isArray(args[0]) ? (args[0] as unknown[]) : args;
    const row = this._db.prepare(sql).get(...toSQLInputValues(params));
    return (row ?? null) as T | null;
  }

  async getAllAsync<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    return this._db.prepare(sql).all(...toSQLInputValues(params)) as T[];
  }

  async withExclusiveTransactionAsync(cb: (txn: MockSQLiteDatabase) => Promise<void>): Promise<void> {
    await cb(this);
  }
}

export async function openDatabaseAsync(_name: string): Promise<MockSQLiteDatabase> {
  return new MockSQLiteDatabase();
}

export type SQLiteDatabase = MockSQLiteDatabase;
