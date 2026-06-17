import { CATEGORIZE_SYSTEM, ASK_SYSTEM, ASK_USER, RECAP_SYSTEM, RECAP_USER } from '../../constants/prompts';
import { parseCategorizeResult, parseAskResult, parseRecapResult } from '../validation';
import type { AIProvider, CategorizeResult, AskResult, RecapResult } from '../types';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-opus-4-8';

type ContentBlock = { type: 'text'; text: string } | { type: 'thinking'; thinking: string } | { type: string };

async function callClaude(system: string, userMessage: string): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      thinking: { type: 'adaptive' },
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => response.statusText);
    throw new Error(`Anthropic API ${response.status}: ${err}`);
  }

  const data: { content: ContentBlock[] } = await response.json();
  for (const block of data.content) {
    if (block.type === 'text') return (block as { type: 'text'; text: string }).text;
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
    const system = CATEGORIZE_SYSTEM.replace('{{categories}}', availableCategories.join(', '));
    const text = await callClaude(system, `Note text:\n${rawText}`);
    return parseCategorizeResult(safeJSON(text));
  },

  async askQuestion(question: string, notesContext: string): Promise<AskResult> {
    const text = await callClaude(ASK_SYSTEM, ASK_USER(question, notesContext));
    return parseAskResult(safeJSON(text));
  },

  async generateRecap(notesContext: string, periodLabel: string): Promise<RecapResult> {
    const text = await callClaude(RECAP_SYSTEM, RECAP_USER(notesContext, periodLabel));
    return parseRecapResult(safeJSON(text));
  },
};
