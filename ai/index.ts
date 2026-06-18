import type { AIProvider } from './types';
import { mockProvider } from './providers/mock';
import { claudeProvider } from './providers/claude';
import { openaiProvider } from './providers/openai';

export function getAIProvider(): AIProvider {
  const provider = process.env.EXPO_PUBLIC_AI_PROVIDER;
  if (provider === 'claude') { console.log('[AI] provider: claude (env)'); return claudeProvider; }
  if (provider === 'openai') { console.log('[AI] provider: openai (env)'); return openaiProvider; }
  if (provider === 'mock') { console.log('[AI] provider: mock (env)'); return mockProvider; }
  // No explicit provider — auto-select based on available keys
  if (process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY) { console.log('[AI] provider: claude (auto)'); return claudeProvider; }
  console.log('[AI] provider: mock (no key)');
  return mockProvider;
}
