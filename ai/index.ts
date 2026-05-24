import type { AIProvider } from './types';
import { mockProvider } from './providers/mock';

export function getAIProvider(): AIProvider {
  return mockProvider;
}
