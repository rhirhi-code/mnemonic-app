import type { AIProvider } from '../types';

export const openaiProvider: AIProvider = {
  async categorizeNote() {
    throw new Error('OpenAI provider not implemented yet');
  },
  async askQuestion() {
    throw new Error('OpenAI provider not implemented yet');
  },
  async generateRecap() {
    throw new Error('OpenAI provider not implemented yet');
  },
};
