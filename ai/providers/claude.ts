import type { AIProvider } from '../types';

export const claudeProvider: AIProvider = {
  async categorizeNote() {
    throw new Error('Claude provider not implemented yet');
  },
  async askQuestion() {
    throw new Error('Claude provider not implemented yet');
  },
  async generateRecap() {
    throw new Error('Claude provider not implemented yet');
  },
};
