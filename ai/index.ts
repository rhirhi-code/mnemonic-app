import type { AIProvider } from './types';
import { mockProvider } from './providers/mock';
import { claudeProvider } from './providers/claude';
import { openaiProvider } from './providers/openai';

export function getAIProvider(): AIProvider {
  const provider = process.env.EXPO_PUBLIC_AI_PROVIDER ?? 'mock';
  switch (provider) {
    case 'claude': return claudeProvider;
    case 'openai': return openaiProvider;
    default: return mockProvider;
  }
}
