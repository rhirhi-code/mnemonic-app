import type { AIProvider, CategorizeResult, AskResult, RecapResult } from '../types';

export const mockProvider: AIProvider = {
  async categorizeNote(): Promise<CategorizeResult> {
    return {
      categoryName: 'Misc',
      displayTitle: 'Mock Note',
      summary: 'Mock summary',
      tags: ['mock'],
      isReminder: false,
      reminderAt: null,
    };
  },
  async askQuestion(): Promise<AskResult> {
    return { answer: 'Mock answer', relevantNoteIds: [] };
  },
  async generateRecap(): Promise<RecapResult> {
    return { summary: 'Mock recap', highlights: ['Mock highlight'] };
  },
};
