import type { Note } from '@/types';

// ~6000 tokens at 4 chars/token
const MAX_CONTEXT_CHARS = 24_000;

export function buildNotesContext(notes: Note[]): string {
  const lines: string[] = [];
  let total = 0;

  for (const note of notes) {
    const title = note.displayTitle ?? note.rawText.slice(0, 120);
    const line = `[${note.id}] ${title}`;
    if (total + line.length + 1 > MAX_CONTEXT_CHARS) break;
    lines.push(line);
    total += line.length + 1;
  }

  return lines.join('\n');
}
