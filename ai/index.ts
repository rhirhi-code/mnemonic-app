import type { AIProvider } from './types';
import { mockProvider } from './providers/mock';
import { claudeProvider } from './providers/claude';
import { openaiProvider } from './providers/openai';

export function getAIProvider(): AIProvider {
  const provider = process.env.EXPO_PUBLIC_AI_PROVIDER;
  if (provider === 'claude') return claudeProvider;
  if (provider === 'openai') return openaiProvider;
  if (provider === 'mock') return mockProvider;
  // No explicit provider — auto-select based on available keys
  if (process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY) return claudeProvider;
  return mockProvider;
}
