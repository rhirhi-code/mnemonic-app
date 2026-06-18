import { useSQLiteContext } from 'expo-sqlite';
import { useState, useCallback } from 'react';
import { getAIProvider } from '@/ai';
import type { AskResult, RecapResult } from '@/ai/types';
import { parseAskResult, parseRecapResult } from '@/ai/validation';
import { updateNote, listNotes } from '@/db/notes';
import { listCategories } from '@/db/categories';
import { buildNotesContext } from '@/utils/textHelpers';
import { CATEGORY_NAMES } from '@/constants/categories';
import { PROMPT_VERSION } from '@/constants/prompts';

const aiProvider = getAIProvider();

export function useAI() {
  const db = useSQLiteContext();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categorizeNote = useCallback(async (noteId: number, rawText: string): Promise<void> => {
    try {
      const result = await aiProvider.categorizeNote(rawText, CATEGORY_NAMES);

      const categories = await listCategories(db);
      const category =
        categories.find((c) => c.name === result.categoryName) ??
        categories.find((c) => c.name === 'Misc');

      await updateNote(db, noteId, {
        displayTitle: result.displayTitle,
        aiSummary: result.summary,
        aiTags: result.tags,
        isReminder: result.isReminder,
        reminderAt: result.reminderAt ? new Date(result.reminderAt).getTime() : null,
        categoryId: category?.id ?? null,
        aiStatus: 'done',
        promptVersion: PROMPT_VERSION,
      });
    } catch (e) {
      console.error('[useAI] categorizeNote error (note', noteId, '):', e instanceof Error ? e.message : e);
      await updateNote(db, noteId, { aiStatus: 'error' });
    }
  }, [db]);

  const askQuestion = useCallback(async (question: string): Promise<AskResult> => {
    setBusy(true);
    setError(null);
    try {
      const notes = await listNotes(db, { limit: 200 });
      const context = buildNotesContext(notes);
      const raw = await aiProvider.askQuestion(question, context);
      return parseAskResult(raw);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
      return { answer: 'Failed to get an answer. Please try again.', relevantNoteIds: [] };
    } finally {
      setBusy(false);
    }
  }, [db]);

  const generateRecap = useCallback(async (periodLabel: string, since: number): Promise<RecapResult> => {
    setBusy(true);
    setError(null);
    try {
      const notes = await listNotes(db, { limit: 200 });
      const filtered = notes.filter((n) => n.createdAt >= since);
      const context = buildNotesContext(filtered);
      const raw = await aiProvider.generateRecap(context, periodLabel);
      return parseRecapResult(raw);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
      return { summary: 'Failed to generate recap. Please try again.', highlights: [] };
    } finally {
      setBusy(false);
    }
  }, [db]);

  return { busy, error, categorizeNote, askQuestion, generateRecap };
}
