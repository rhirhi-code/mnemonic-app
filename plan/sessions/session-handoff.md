# Session Handoff

## Session: Phase 0 — Bootstrap (completed)

- Initialized Expo SDK 56 app, replaced template tabs with Notes/Ask/Recap
- Installed deps: `expo-sqlite`, `zod`, `date-fns`, `@expo/vector-icons`, Jest 29 stack
- Created folder skeleton and stubs; wrote domain types, AIProvider interface, mock provider, schema SQL
- Created `.env.example`, added `.env` to `.gitignore`

---

## Session: Phase 1 — Data Layer

### What was done

- Implemented `db/index.ts` — opens SQLite DB with `openDatabaseAsync`, runs migrations using `PRAGMA user_version`; migration 1 creates both tables and seeds 5 categories in a single exclusive transaction
- Implemented `db/notes.ts` — full CRUD: `insertNote`, `getNoteById`, `listNotes` (with optional `categoryId`/`limit`/`offset` filters), `updateNote` (partial patch), `deleteNote`; `ai_tags` stored as JSON string, `is_reminder` as 0/1 integer; ordered by `created_at DESC, id DESC`
- Implemented `db/categories.ts` — `listCategories`, `getCategoryById`, `getCategoryByName`, `insertCategory`; seed categories inserted via `db/index.ts` migration on first run
- Added `__mocks__/expo-sqlite.ts` — jest mock backed by Node.js 22 built-in `node:sqlite`, provides real in-memory SQL execution for tests with no native module dependency
- Added `__tests__/db.test.ts` — 15 unit tests covering note and category CRUD; all pass with real SQL execution
- Added `babel.config.js` — required for jest-expo to apply TypeScript transform correctly
- Updated `tsconfig.json` — added `"types": ["jest", "node"]` so test globals and `node:sqlite` types resolve

### Gates met

- `npx tsc --noEmit` — clean
- `npx jest` — 16 tests passing (smoke + 15 db tests)

### Known issues

See `plan/bugs.md`.

### Next steps

**Phase 2 — AI Integration**

1. Implement `ai/providers/claude.ts` — call Anthropic API to implement `AIProvider` interface (categorize, ask, recap)
2. Implement `ai/index.ts` — factory that picks provider from env (`EXPO_PUBLIC_AI_PROVIDER`: `claude` | `openai` | `mock`)
3. Implement `hooks/useNotes.ts` — wraps db/notes CRUD, triggers AI categorization on insert
4. Implement `hooks/useCategories.ts` — wraps db/categories CRUD, returns live list
5. Implement `hooks/useAI.ts` — ask/recap hook that calls provider

Gate: mock provider passes end-to-end note insert → categorize → read back with AI fields populated.
