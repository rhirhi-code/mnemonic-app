import { z } from 'zod';
import type { CategorizeResult, AskResult, RecapResult } from './types';

export const CategorizeResultSchema = z.object({
  categoryName: z.string().min(1),
  displayTitle: z.string().min(1),
  summary: z.string(),
  tags: z.array(z.string()),
  isReminder: z.boolean(),
  reminderAt: z.string().nullable(),
});

export const AskResultSchema = z.object({
  answer: z.string().min(1),
  relevantNoteIds: z.array(z.number().int()),
});

export const RecapResultSchema = z.object({
  summary: z.string().min(1),
  highlights: z.array(z.string()),
});

export function parseCategorizeResult(raw: unknown): CategorizeResult {
  const result = CategorizeResultSchema.safeParse(raw);
  if (result.success) return result.data;
  return {
    categoryName: 'Misc',
    displayTitle: 'Untitled',
    summary: '',
    tags: [],
    isReminder: false,
    reminderAt: null,
  };
}

export function parseAskResult(raw: unknown): AskResult {
  const result = AskResultSchema.safeParse(raw);
  if (result.success) return result.data;
  return { answer: 'Could not parse AI response.', relevantNoteIds: [] };
}

export function parseRecapResult(raw: unknown): RecapResult {
  const result = RecapResultSchema.safeParse(raw);
  if (result.success) return result.data;
  return { summary: 'Could not parse AI response.', highlights: [] };
}
