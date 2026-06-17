import Anthropic from '@anthropic-ai/sdk';

import { CATEGORIZE_SYSTEM, ASK_SYSTEM, ASK_USER, RECAP_SYSTEM, RECAP_USER } from '../../constants/prompts';
import { parseCategorizeResult, parseAskResult, parseRecapResult } from '../validation';
import type { AIProvider, CategorizeResult, AskResult, RecapResult } from '../types';

const MODEL = 'claude-opus-4-8';

function getClient(): Anthropic {
  return new Anthropic({
    apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '',
    dangerouslyAllowBrowser: true,
  });
}

function extractText(response: Anthropic.Message): string {
  for (const block of response.content) {
    if (block.type === 'text') return block.text;
  }
  return '';
}

function safeJSON(text: string): unknown {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export const claudeProvider: AIProvider = {
  async categorizeNote(rawText: string, availableCategories: string[]): Promise<CategorizeResult> {
    const client = getClient();
    const system = CATEGORIZE_SYSTEM.replace('{{categories}}', availableCategories.join(', '));
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      thinking: { type: 'adaptive' },
      system,
      messages: [{ role: 'user', content: `Note text:\n${rawText}` }],
    });
    return parseCategorizeResult(safeJSON(extractText(response)));
  },

  async askQuestion(question: string, notesContext: string): Promise<AskResult> {
    const client = getClient();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      thinking: { type: 'adaptive' },
      system: ASK_SYSTEM,
      messages: [{ role: 'user', content: ASK_USER(question, notesContext) }],
    });
    return parseAskResult(safeJSON(extractText(response)));
  },

  async generateRecap(notesContext: string, periodLabel: string): Promise<RecapResult> {
    const client = getClient();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      thinking: { type: 'adaptive' },
      system: RECAP_SYSTEM,
      messages: [{ role: 'user', content: RECAP_USER(notesContext, periodLabel) }],
    });
    return parseRecapResult(safeJSON(extractText(response)));
  },
};
