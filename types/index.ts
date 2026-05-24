export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
  createdAt: number;
}

export interface Note {
  id: number;
  rawText: string;
  displayTitle: string | null;
  categoryId: number | null;
  aiSummary: string | null;
  aiTags: string[] | null;
  isReminder: boolean;
  reminderAt: number | null;
  source: 'text' | 'voice';
  audioUri: string | null;
  aiStatus: 'pending' | 'done' | 'error';
  promptVersion: string | null;
  createdAt: number;
  updatedAt: number;
}
