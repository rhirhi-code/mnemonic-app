import { openDatabaseAsync } from 'expo-sqlite';
import { CREATE_CATEGORIES, CREATE_NOTES, SEED_CATEGORIES } from '@/db/schema';
import {
  deleteNote,
  getNoteById,
  insertNote,
  listNotes,
  updateNote,
} from '@/db/notes';
import {
  getCategoryById,
  getCategoryByName,
  insertCategory,
  listCategories,
} from '@/db/categories';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildDb(): Promise<any> {
  const db = await openDatabaseAsync(':memory:');
  await db.execAsync(CREATE_CATEGORIES);
  await db.execAsync(CREATE_NOTES);
  await db.execAsync(SEED_CATEGORIES);
  return db;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

describe('categories', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;
  beforeEach(async () => { db = await buildDb(); });

  it('lists the 5 seeded categories', async () => {
    const cats = await listCategories(db);
    expect(cats).toHaveLength(5);
    expect(cats.map((c) => c.name).sort()).toEqual(
      ['Ideas', 'Misc', 'People', 'Reminders', 'Words']
    );
  });

  it('getCategoryById returns the category or null', async () => {
    const cats = await listCategories(db);
    const first = cats[0];
    const found = await getCategoryById(db, first.id);
    expect(found).toMatchObject({ id: first.id, name: first.name });

    const missing = await getCategoryById(db, 99999);
    expect(missing).toBeNull();
  });

  it('getCategoryByName returns the category or null', async () => {
    const found = await getCategoryByName(db, 'Ideas');
    expect(found).not.toBeNull();
    expect(found!.name).toBe('Ideas');

    const missing = await getCategoryByName(db, 'Nonexistent');
    expect(missing).toBeNull();
  });

  it('insertCategory persists and returns a new category with id', async () => {
    const cat = await insertCategory(db, { name: 'Custom', color: '#123456', icon: 'star' });
    expect(cat.id).toBeGreaterThan(0);
    expect(cat.name).toBe('Custom');
    expect(cat.color).toBe('#123456');
    expect(cat.icon).toBe('star');
    expect(cat.createdAt).toBeGreaterThan(0);

    const all = await listCategories(db);
    expect(all).toHaveLength(6);
  });
});

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

describe('notes', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;
  beforeEach(async () => { db = await buildDb(); });

  it('insertNote round-trips with minimal fields', async () => {
    const note = await insertNote(db, { rawText: 'hello', source: 'text' });
    expect(note.id).toBeGreaterThan(0);
    expect(note.rawText).toBe('hello');
    expect(note.source).toBe('text');
    expect(note.aiStatus).toBe('pending');
    expect(note.isReminder).toBe(false);
    expect(note.categoryId).toBeNull();
    expect(note.displayTitle).toBeNull();
    expect(note.createdAt).toBeGreaterThan(0);
    expect(note.updatedAt).toBeGreaterThan(0);
  });

  it('insertNote stores optional fields', async () => {
    const cats = await listCategories(db);
    const note = await insertNote(db, {
      rawText: 'world',
      source: 'voice',
      categoryId: cats[0].id,
      displayTitle: 'World Note',
      audioUri: 'file://audio.m4a',
    });
    expect(note.categoryId).toBe(cats[0].id);
    expect(note.displayTitle).toBe('World Note');
    expect(note.audioUri).toBe('file://audio.m4a');
  });

  it('getNoteById returns the note or null', async () => {
    const created = await insertNote(db, { rawText: 'test', source: 'text' });
    const found = await getNoteById(db, created.id);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);

    const missing = await getNoteById(db, 99999);
    expect(missing).toBeNull();
  });

  it('listNotes returns all notes ordered by created_at DESC', async () => {
    await insertNote(db, { rawText: 'first', source: 'text' });
    await insertNote(db, { rawText: 'second', source: 'text' });
    await insertNote(db, { rawText: 'third', source: 'text' });

    const notes = await listNotes(db);
    expect(notes).toHaveLength(3);
    // created_at DESC — latest insert is first
    expect(notes[0].rawText).toBe('third');
    expect(notes[2].rawText).toBe('first');
  });

  it('listNotes filters by categoryId', async () => {
    const cats = await listCategories(db);
    const [catA, catB] = cats;

    await insertNote(db, { rawText: 'in A', source: 'text', categoryId: catA.id });
    await insertNote(db, { rawText: 'in B', source: 'text', categoryId: catB.id });
    await insertNote(db, { rawText: 'uncategorized', source: 'text' });

    const inA = await listNotes(db, { categoryId: catA.id });
    expect(inA).toHaveLength(1);
    expect(inA[0].rawText).toBe('in A');
  });

  it('updateNote patches only provided fields', async () => {
    const note = await insertNote(db, { rawText: 'original', source: 'text' });
    const before = note.updatedAt;

    await new Promise((r) => setTimeout(r, 5)); // ensure clock advances
    const updated = await updateNote(db, note.id, {
      displayTitle: 'Updated Title',
      aiStatus: 'done',
      aiTags: ['tag1', 'tag2'],
      aiSummary: 'A summary',
    });

    expect(updated).not.toBeNull();
    expect(updated!.displayTitle).toBe('Updated Title');
    expect(updated!.aiStatus).toBe('done');
    expect(updated!.aiTags).toEqual(['tag1', 'tag2']);
    expect(updated!.aiSummary).toBe('A summary');
    expect(updated!.rawText).toBe('original'); // unchanged
    expect(updated!.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it('updateNote serializes and deserializes aiTags as JSON', async () => {
    const note = await insertNote(db, { rawText: 'tag test', source: 'text' });
    await updateNote(db, note.id, { aiTags: ['a', 'b', 'c'] });
    const fetched = await getNoteById(db, note.id);
    expect(fetched!.aiTags).toEqual(['a', 'b', 'c']);
  });

  it('updateNote with null aiTags stores null', async () => {
    const note = await insertNote(db, { rawText: 'null tags', source: 'text' });
    await updateNote(db, note.id, { aiTags: null });
    const fetched = await getNoteById(db, note.id);
    expect(fetched!.aiTags).toBeNull();
  });

  it('updateNote returns null for unknown id', async () => {
    const result = await updateNote(db, 99999, { displayTitle: 'ghost' });
    expect(result).toBeNull();
  });

  it('deleteNote removes the note', async () => {
    const note = await insertNote(db, { rawText: 'to delete', source: 'text' });
    await deleteNote(db, note.id);
    const gone = await getNoteById(db, note.id);
    expect(gone).toBeNull();
  });

  it('deleteNote on non-existent id does not throw', async () => {
    await expect(deleteNote(db, 99999)).resolves.toBeUndefined();
  });
});
