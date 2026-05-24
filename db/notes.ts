import { SQLiteDatabase } from 'expo-sqlite';
import { Note } from '@/types';

type NoteRow = {
  id: number;
  raw_text: string;
  display_title: string | null;
  category_id: number | null;
  ai_summary: string | null;
  ai_tags: string | null;
  is_reminder: number;
  reminder_at: number | null;
  source: string;
  audio_uri: string | null;
  ai_status: string;
  prompt_version: string | null;
  created_at: number;
  updated_at: number;
};

function rowToNote(row: NoteRow): Note {
  return {
    id: row.id,
    rawText: row.raw_text,
    displayTitle: row.display_title,
    categoryId: row.category_id,
    aiSummary: row.ai_summary,
    aiTags: row.ai_tags ? (JSON.parse(row.ai_tags) as string[]) : null,
    isReminder: row.is_reminder === 1,
    reminderAt: row.reminder_at,
    source: row.source as Note['source'],
    audioUri: row.audio_uri,
    aiStatus: row.ai_status as Note['aiStatus'],
    promptVersion: row.prompt_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type InsertNoteParams = Pick<Note, 'rawText' | 'source'> &
  Partial<Pick<Note, 'categoryId' | 'displayTitle' | 'audioUri'>>;

export async function insertNote(db: SQLiteDatabase, params: InsertNoteParams): Promise<Note> {
  const now = Date.now();
  const result = await db.runAsync(
    `INSERT INTO notes
       (raw_text, display_title, category_id, source, audio_uri,
        ai_status, is_reminder, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'pending', 0, ?, ?)`,
    params.rawText,
    params.displayTitle ?? null,
    params.categoryId ?? null,
    params.source,
    params.audioUri ?? null,
    now,
    now
  );
  const row = await db.getFirstAsync<NoteRow>('SELECT * FROM notes WHERE id = ?', result.lastInsertRowId);
  return rowToNote(row!);
}

export async function getNoteById(db: SQLiteDatabase, id: number): Promise<Note | null> {
  const row = await db.getFirstAsync<NoteRow>('SELECT * FROM notes WHERE id = ?', id);
  return row ? rowToNote(row) : null;
}

export async function listNotes(
  db: SQLiteDatabase,
  opts: { categoryId?: number; limit?: number; offset?: number } = {}
): Promise<Note[]> {
  const conditions: string[] = [];
  const params: (number)[] = [];

  if (opts.categoryId !== undefined) {
    conditions.push('category_id = ?');
    params.push(opts.categoryId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = opts.limit !== undefined ? `LIMIT ${opts.limit}` : '';
  const offset = opts.offset !== undefined ? `OFFSET ${opts.offset}` : '';

  const rows = await db.getAllAsync<NoteRow>(
    `SELECT * FROM notes ${where} ORDER BY created_at DESC, id DESC ${limit} ${offset}`.trim(),
    params
  );
  return rows.map(rowToNote);
}

export type UpdateNoteParams = Partial<
  Pick<Note, 'displayTitle' | 'categoryId' | 'aiSummary' | 'aiTags' | 'aiStatus' | 'promptVersion' | 'isReminder' | 'reminderAt'>
>;

export async function updateNote(db: SQLiteDatabase, id: number, params: UpdateNoteParams): Promise<Note | null> {
  const now = Date.now();
  const sets: string[] = ['updated_at = ?'];
  const values: (string | number | null)[] = [now];

  if (params.displayTitle !== undefined) { sets.push('display_title = ?'); values.push(params.displayTitle); }
  if (params.categoryId !== undefined) { sets.push('category_id = ?'); values.push(params.categoryId); }
  if (params.aiSummary !== undefined) { sets.push('ai_summary = ?'); values.push(params.aiSummary); }
  if (params.aiTags !== undefined) { sets.push('ai_tags = ?'); values.push(params.aiTags ? JSON.stringify(params.aiTags) : null); }
  if (params.aiStatus !== undefined) { sets.push('ai_status = ?'); values.push(params.aiStatus); }
  if (params.promptVersion !== undefined) { sets.push('prompt_version = ?'); values.push(params.promptVersion); }
  if (params.isReminder !== undefined) { sets.push('is_reminder = ?'); values.push(params.isReminder ? 1 : 0); }
  if (params.reminderAt !== undefined) { sets.push('reminder_at = ?'); values.push(params.reminderAt); }

  values.push(id);
  await db.runAsync(`UPDATE notes SET ${sets.join(', ')} WHERE id = ?`, values);
  return getNoteById(db, id);
}

export async function deleteNote(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM notes WHERE id = ?', id);
}
