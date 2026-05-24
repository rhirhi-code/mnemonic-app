export interface CategorizeResult {
  categoryName: string;
  displayTitle: string;
  summary: string;
  tags: string[];
  isReminder: boolean;
  reminderAt: string | null;
}

export interface AskResult {
  answer: string;
  relevantNoteIds: number[];
}

export interface RecapResult {
  summary: string;
  highlights: string[];
}

export interface AIProvider {
  categorizeNote(rawText: string, availableCategories: string[]): Promise<CategorizeResult>;
  askQuestion(question: string, notesContext: string): Promise<AskResult>;
  generateRecap(notesContext: string, periodLabel: string): Promise<RecapResult>;
}
