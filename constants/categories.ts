export const DEFAULT_CATEGORIES = [
  { name: 'Words',     color: '#4A90D9', icon: 'book' },
  { name: 'Ideas',     color: '#F5A623', icon: 'lightbulb' },
  { name: 'People',    color: '#7ED321', icon: 'person' },
  { name: 'Reminders', color: '#D0021B', icon: 'alarm' },
  { name: 'Misc',      color: '#9B9B9B', icon: 'folder' },
] as const;

export const CATEGORY_NAMES = DEFAULT_CATEGORIES.map((c) => c.name);
