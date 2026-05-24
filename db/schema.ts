export const SCHEMA_VERSION = 1;

export const CREATE_CATEGORIES = `
  CREATE TABLE IF NOT EXISTS categories (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL UNIQUE,
    color      TEXT    NOT NULL DEFAULT '#888888',
    icon       TEXT    NOT NULL DEFAULT 'folder',
    created_at INTEGER NOT NULL
  )
`;

export const CREATE_NOTES = `
  CREATE TABLE IF NOT EXISTS notes (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    raw_text      TEXT    NOT NULL,
    display_title TEXT,
    category_id   INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    ai_summary    TEXT,
    ai_tags       TEXT,
    is_reminder   INTEGER NOT NULL DEFAULT 0,
    reminder_at   INTEGER,
    source        TEXT    NOT NULL DEFAULT 'text',
    audio_uri     TEXT,
    ai_status     TEXT    NOT NULL DEFAULT 'pending',
    prompt_version TEXT,
    created_at    INTEGER NOT NULL,
    updated_at    INTEGER NOT NULL
  )
`;

export const SEED_CATEGORIES = `
  INSERT OR IGNORE INTO categories (name, color, icon, created_at) VALUES
    ('Words',     '#4A90D9', 'book',      unixepoch() * 1000),
    ('Ideas',     '#F5A623', 'lightbulb', unixepoch() * 1000),
    ('People',    '#7ED321', 'person',    unixepoch() * 1000),
    ('Reminders', '#D0021B', 'alarm',     unixepoch() * 1000),
    ('Misc',      '#9B9B9B', 'folder',    unixepoch() * 1000)
`;
