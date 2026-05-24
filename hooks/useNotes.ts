import { useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect, useCallback } from 'react';
import type { Note } from '@/types';
import {
  insertNote,
  listNotes,
  updateNote,
  deleteNote,
  type InsertNoteParams,
  type UpdateNoteParams,
} from '@/db/notes';

export function useNotes(opts: { categoryId?: number } = {}) {
  const db = useSQLiteContext();
  const { categoryId } = opts;
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await listNotes(db, { categoryId });
    setNotes(result);
    setLoading(false);
  }, [db, categoryId]);

  useEffect(() => { refresh(); }, [refresh]);

  const addNote = useCallback(async (params: InsertNoteParams): Promise<Note> => {
    const note = await insertNote(db, params);
    await refresh();
    return note;
  }, [db, refresh]);

  const editNote = useCallback(async (id: number, params: UpdateNoteParams): Promise<Note | null> => {
    const note = await updateNote(db, id, params);
    await refresh();
    return note;
  }, [db, refresh]);

  const removeNote = useCallback(async (id: number): Promise<void> => {
    await deleteNote(db, id);
    await refresh();
  }, [db, refresh]);

  return { notes, loading, refresh, addNote, editNote, removeNote };
}
