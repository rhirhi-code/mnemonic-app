import { SQLiteDatabase } from 'expo-sqlite';
import { Category } from '@/types';

type CategoryRow = {
  id: number;
  name: string;
  color: string;
  icon: string;
  created_at: number;
};

function rowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    createdAt: row.created_at,
  };
}

export async function listCategories(db: SQLiteDatabase): Promise<Category[]> {
  const rows = await db.getAllAsync<CategoryRow>('SELECT * FROM categories ORDER BY name ASC');
  return rows.map(rowToCategory);
}

export async function getCategoryById(db: SQLiteDatabase, id: number): Promise<Category | null> {
  const row = await db.getFirstAsync<CategoryRow>('SELECT * FROM categories WHERE id = ?', id);
  return row ? rowToCategory(row) : null;
}

export async function getCategoryByName(db: SQLiteDatabase, name: string): Promise<Category | null> {
  const row = await db.getFirstAsync<CategoryRow>('SELECT * FROM categories WHERE name = ?', name);
  return row ? rowToCategory(row) : null;
}

export async function insertCategory(
  db: SQLiteDatabase,
  params: Pick<Category, 'name' | 'color' | 'icon'>
): Promise<Category> {
  const now = Date.now();
  const result = await db.runAsync(
    'INSERT INTO categories (name, color, icon, created_at) VALUES (?, ?, ?, ?)',
    params.name,
    params.color,
    params.icon,
    now
  );
  const row = await db.getFirstAsync<CategoryRow>('SELECT * FROM categories WHERE id = ?', result.lastInsertRowId);
  return rowToCategory(row!);
}
