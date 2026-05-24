import { mockProvider } from '@/ai/providers/mock';
import {
  CategorizeResultSchema,
  AskResultSchema,
  RecapResultSchema,
  parseCategorizeResult,
  parseAskResult,
  parseRecapResult,
} from '@/ai/validation';
import { buildNotesContext } from '@/utils/textHelpers';
import type { Note } from '@/types';

// ---------------------------------------------------------------------------
// Mock provider — interface contract
// ---------------------------------------------------------------------------

describe('mockProvider', () => {
  it('categorizeNote returns a valid CategorizeResult', async () => {
    const result = await mockProvider.categorizeNote('test note', ['Words', 'Ideas', 'Misc']);
    const parsed = CategorizeResultSchema.safeParse(result);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(typeof parsed.data.categoryName).toBe('string');
    expect(typeof parsed.data.displayTitle).toBe('string');
    expect(typeof parsed.data.summary).toBe('string');
    expect(Array.isArray(parsed.data.tags)).toBe(true);
    expect(typeof parsed.data.isReminder).toBe('boolean');
    expect(parsed.data.reminderAt === null || typeof parsed.data.reminderAt === 'string').toBe(true);
  });

  it('askQuestion returns a valid AskResult', async () => {
    const result = await mockProvider.askQuestion('what did I write?', 'context');
    const parsed = AskResultSchema.safeParse(result);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(typeof parsed.data.answer).toBe('string');
    expect(Array.isArray(parsed.data.relevantNoteIds)).toBe(true);
  });

  it('generateRecap returns a valid RecapResult', async () => {
    const result = await mockProvider.generateRecap('context', 'This Week');
    const parsed = RecapResultSchema.safeParse(result);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(typeof parsed.data.summary).toBe('string');
    expect(Array.isArray(parsed.data.highlights)).toBe(true);
  });

  it('categorizeNote passes any rawText and categories without throwing', async () => {
    await expect(
      mockProvider.categorizeNote('serendipity — a happy accident', ['Words', 'Misc'])
    ).resolves.toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Zod validation — parse helpers
// ---------------------------------------------------------------------------

describe('parseCategorizeResult', () => {
  it('returns parsed data for a valid object', () => {
    const valid = {
      categoryName: 'Words',
      displayTitle: 'Serendipity',
      summary: 'A happy accident',
      tags: ['vocabulary'],
      isReminder: false,
      reminderAt: null,
    };
    const result = parseCategorizeResult(valid);
    expect(result.categoryName).toBe('Words');
    expect(result.displayTitle).toBe('Serendipity');
  });

  it('falls back to Misc defaults on invalid input', () => {
    const result = parseCategorizeResult({ categoryName: 123, tags: 'not-an-array' });
    expect(result.categoryName).toBe('Misc');
    expect(result.displayTitle).toBe('Untitled');
    expect(result.tags).toEqual([]);
    expect(result.isReminder).toBe(false);
    expect(result.reminderAt).toBeNull();
  });

  it('falls back on null input', () => {
    const result = parseCategorizeResult(null);
    expect(result.categoryName).toBe('Misc');
  });

  it('falls back on undefined input', () => {
    const result = parseCategorizeResult(undefined);
    expect(result.categoryName).toBe('Misc');
  });
});

describe('parseAskResult', () => {
  it('returns parsed data for a valid object', () => {
    const valid = { answer: 'You wrote about serendipity.', relevantNoteIds: [1, 2] };
    const result = parseAskResult(valid);
    expect(result.answer).toBe('You wrote about serendipity.');
    expect(result.relevantNoteIds).toEqual([1, 2]);
  });

  it('falls back on invalid input', () => {
    const result = parseAskResult({ answer: 42, relevantNoteIds: 'bad' });
    expect(result.answer).toBe('Could not parse AI response.');
    expect(result.relevantNoteIds).toEqual([]);
  });
});

describe('parseRecapResult', () => {
  it('returns parsed data for a valid object', () => {
    const valid = { summary: 'A great week.', highlights: ['Learned serendipity'] };
    const result = parseRecapResult(valid);
    expect(result.summary).toBe('A great week.');
    expect(result.highlights).toEqual(['Learned serendipity']);
  });

  it('falls back on invalid input', () => {
    const result = parseRecapResult(null);
    expect(result.summary).toBe('Could not parse AI response.');
    expect(result.highlights).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// buildNotesContext
// ---------------------------------------------------------------------------

const makeNote = (id: number, rawText: string, displayTitle: string | null = null): Note => ({
  id,
  rawText,
  displayTitle,
  categoryId: null,
  aiSummary: null,
  aiTags: null,
  isReminder: false,
  reminderAt: null,
  source: 'text',
  audioUri: null,
  aiStatus: 'done',
  promptVersion: null,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

describe('buildNotesContext', () => {
  it('formats notes as [id] title lines', () => {
    const notes = [makeNote(1, 'raw one', 'Title One'), makeNote(2, 'raw two', null)];
    const ctx = buildNotesContext(notes);
    expect(ctx).toContain('[1] Title One');
    expect(ctx).toContain('[2] raw two');
  });

  it('falls back to rawText when displayTitle is null', () => {
    const notes = [makeNote(5, 'this is the raw text')];
    const ctx = buildNotesContext(notes);
    expect(ctx).toContain('[5] this is the raw text');
  });

  it('returns empty string for empty notes array', () => {
    expect(buildNotesContext([])).toBe('');
  });

  it('truncates rawText to 120 chars when used as title', () => {
    const longText = 'a'.repeat(200);
    const notes = [makeNote(1, longText, null)];
    const ctx = buildNotesContext(notes);
    expect(ctx).toContain('[1] ' + 'a'.repeat(120));
    expect(ctx).not.toContain('a'.repeat(121));
  });

  it('stops adding notes when context limit is reached', () => {
    const bigNotes = Array.from({ length: 1000 }, (_, i) =>
      makeNote(i + 1, 'x'.repeat(100), 'x'.repeat(100))
    );
    const ctx = buildNotesContext(bigNotes);
    expect(ctx.length).toBeLessThanOrEqual(24_000);
  });
});
