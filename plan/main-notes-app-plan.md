# Plan: AI-Powered Notes App (iOS MVP)

## Context

Building a mobile notes app that solves the "I wrote it down somewhere" problem. Users add notes by typing or speaking; AI automatically categorizes them and makes them queryable in plain English. The goal is a working MVP that proves the core loop — add → categorize → ask — before adding complexity like accounts or cloud sync.

This is a greenfield app. The user is new to mobile development, so decisions favor low ceremony and fast feedback over production-scale architecture.

---

## Up-Front Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | **Expo (managed workflow)** | No Xcode config files to wrangle; Expo handles native modules. Best starting point for mobile beginners. |
| Language | **TypeScript** | Strict mode on. Catches AI response shape errors at compile time. |
| Navigation | **Expo Router** | File-based routing (like Next.js). Zero manual route registration. |
| State | **React Context + useReducer** | SQLite is the source of truth. In-memory state is ephemeral UI only. No Redux needed at this scale. |
| Local storage | **expo-sqlite** | Relational, queryable, survives app restarts. AsyncStorage ruled out (no SQL, worse for structured notes). |
| Cloud sync | **Deferred** — local-only for MVP | Avoids needing a backend, auth, or user accounts in v1. Architecture leaves room to add it. |
| AI provider | **Abstracted behind an interface** | Provider (Claude or OpenAI) selected via env var. Business logic never imports an SDK directly. Swap without touching app code. |
| API key safety | **Keys in `.env` for MVP** | Acceptable for a personal app. Known limitation: not safe for a public App Store release. Proxy server is post-MVP. |
| Styling | **React Native StyleSheet only** | No third-party UI kit. Avoids learning two frameworks at once. |
| Voice input | **Phase 7 (nice-to-have)** | Doesn't block the core loop. Architected in from day one but not required to ship. Includes iOS Home Screen quick action for one-tap recording. |

---

## Dependency List

| Package | Purpose |
|---|---|
| `expo` | Managed runtime + build tooling |
| `expo-router` | File-based navigation |
| `expo-sqlite` | Local database |
| `expo-audio` | Audio recording (Phase 7) — replaces deprecated `expo-av` |
| `expo-speech-recognition` | Live on-device speech-to-text transcription (Phase 7) |
| `expo-quick-actions` | iOS Home Screen long-press quick action (Phase 7) |
| `expo-constants` | Read env vars at runtime |
| `@expo/vector-icons` | Icons (bundled with Expo) |
| `zod` | Runtime validation of AI API responses |
| `date-fns` | Date formatting ("last week") |
| `@anthropic-ai/sdk` | Claude provider implementation |
| `openai` | OpenAI provider implementation |
| `jest` + `@testing-library/react-native` | Unit and component tests |

---

## Folder Structure

```
app/                          # Expo Router pages
  _layout.tsx                 # Root layout, providers
  (tabs)/
    _layout.tsx               # Tab bar (Notes / Ask / Recap)
    notes.tsx                 # Notes list grouped by category
    ask.tsx                   # Natural language Q&A
    recap.tsx                 # AI-generated recaps
  note/
    new.tsx                   # Add note (modal)
    voice.tsx                 # Voice recording screen (Phase 7)
    [id].tsx                  # View / edit / delete note

components/
  NoteCard.tsx
  CategoryGroup.tsx
  AIStatusBanner.tsx          # "Categorizing..." feedback
  VoiceRecordButton.tsx       # Phase 7

db/
  schema.ts                   # SQL + migration definitions
  notes.ts                    # CRUD for notes
  categories.ts               # CRUD for categories
  index.ts                    # Opens DB, runs migrations

ai/
  types.ts                    # AIProvider interface
  providers/
    claude.ts
    openai.ts
    mock.ts                   # Deterministic fake for tests
  index.ts                    # Reads env var, exports active provider

hooks/
  useNotes.ts
  useCategories.ts
  useAI.ts
  useVoiceRecorder.ts         # Phase 7 — recording + transcription state machine

constants/
  categories.ts               # Default category seed data
  prompts.ts                  # ALL prompt templates in one place

types/
  index.ts                    # Note, Category, shared domain types

utils/
  dateHelpers.ts
  textHelpers.ts              # Context window truncation helper

.env                          # EXPO_PUBLIC_AI_PROVIDER + API keys (not committed)
.env.example
```

---

## SQLite Schema

```sql
CREATE TABLE IF NOT EXISTS categories (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL UNIQUE,
  color      TEXT    NOT NULL DEFAULT '#888888',
  icon       TEXT    NOT NULL DEFAULT 'folder',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS notes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  raw_text      TEXT    NOT NULL,
  display_title TEXT,
  category_id   INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  ai_summary    TEXT,
  ai_tags       TEXT,              -- JSON array: '["vocab","spanish"]'
  is_reminder   INTEGER NOT NULL DEFAULT 0,
  reminder_at   INTEGER,           -- Unix ms timestamp, nullable
  source        TEXT    NOT NULL DEFAULT 'text',    -- 'text' | 'voice'
  audio_uri     TEXT,                               -- path to .m4a file, null for text notes
  ai_status     TEXT    NOT NULL DEFAULT 'pending', -- 'pending'|'done'|'error'
  prompt_version TEXT,             -- tracks which prompt generated metadata
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);

-- Default categories seeded on first run
INSERT OR IGNORE INTO categories (name, color, icon, created_at) VALUES
  ('Words',     '#4A90D9', 'book',      unixepoch() * 1000),
  ('Ideas',     '#F5A623', 'lightbulb', unixepoch() * 1000),
  ('People',    '#7ED321', 'person',    unixepoch() * 1000),
  ('Reminders', '#D0021B', 'alarm',     unixepoch() * 1000),
  ('Misc',      '#9B9B9B', 'folder',    unixepoch() * 1000);
```

Migration strategy: `PRAGMA user_version` tracks schema version. `db/index.ts` runs numbered migration scripts in order on startup.

---

## AI Provider Interface (`/ai/types.ts`)

All application code imports from `ai/index.ts` only — never from a concrete provider file.

```typescript
export interface CategorizeResult {
  categoryName: string;      // must match a seeded category name, or "Misc"
  displayTitle: string;
  summary: string;
  tags: string[];
  isReminder: boolean;
  reminderAt: string | null; // ISO 8601 or null
}

export interface AskResult {
  answer: string;
  relevantNoteIds: number[];
}

export interface RecapResult {
  summary: string;
  highlights: string[];      // 3-5 bullet points
}

export interface AIProvider {
  categorizeNote(rawText: string, availableCategories: string[]): Promise<CategorizeResult>;
  askQuestion(question: string, notesContext: string): Promise<AskResult>;
  generateRecap(notesContext: string, periodLabel: string): Promise<RecapResult>;
}
```

Zod schemas validate every AI response before it touches the database. On parse error, fall back to `categoryName: "Misc"` and `ai_status: "error"` — never crash.

All prompt templates live in `/constants/prompts.ts`. Both provider implementations use the same templates; the only difference is the SDK call pattern.

---

## Screens

| Screen | Route | What it does |
|---|---|---|
| Notes List | `/(tabs)/notes` | Default tab. Notes grouped by category, collapsible. FAB opens Add Note. |
| Add Note | `/note/new` | Multi-line text input. Save inserts note, triggers background AI categorization. Mic icon navigates to Voice screen. |
| Voice Recording | `/note/voice` | Records audio + live transcription. Auto-starts when opened via quick action (`?autoRecord=true`). |
| Note Detail | `/note/[id]` | View category, tags, summary. Edit (re-triggers AI). Delete. |
| Ask | `/(tabs)/ask` | Type a question; AI answers using your notes as context. Cites note IDs. |
| Recap | `/(tabs)/recap` | "Today / This Week / This Month" buttons. AI generates a summary + bullet highlights. |

No auth, settings, or onboarding in MVP.

---

## Build Order

### Phase 0 — Bootstrap
Initialize Expo + TypeScript + Expo Router. Set up folder structure, path aliases (`@/`), `.env` + `.gitignore`. Configure Jest.

**Gate:** `npx expo start` launches on iOS simulator with no errors; `npx jest` passes.

### Phase 1 — Data Layer
Implement `db/index.ts` (open DB, run migrations). Build migration 1 (schema above). Implement `db/notes.ts` and `db/categories.ts` with full CRUD. Write unit tests using an in-memory SQLite instance.

**Gate:** All DB unit tests pass; note round-trip (write → read) works in tests.

### Phase 2 — AI Abstraction + Mock Provider
Define `types/index.ts` and `ai/types.ts`. Implement `ai/providers/mock.ts` with deterministic hardcoded responses. Wire `ai/index.ts` to read env var. Implement `hooks/useAI.ts`. Write unit tests that call each method on the mock and validate response shapes with Zod.

**Gate:** AI unit tests pass; mock satisfies the full interface contract.

### Phase 3 — Navigation Shell + Notes List
Build tab layout, Notes tab (fetches from SQLite, renders `CategoryGroup` + `NoteCard`), Note detail screen. Placeholder screens for Ask and Recap tabs. FAB navigates to `/note/new` (placeholder for now).

**Gate:** Notes tab renders seeded categories; tapping opens detail; delete removes the row.

### Phase 4 — Add Note + Real AI Categorization
Build `app/note/new.tsx`. On save: insert note with `ai_status: 'pending'`, navigate back, call AI categorization in background, update row on response. Show `AIStatusBanner` while pending. Implement Claude and OpenAI concrete providers. Validate AI responses with Zod before writing to DB.

**Gate:** Type "serendipity — a happy accident", save, note appears under Words within seconds. Switching `EXPO_PUBLIC_AI_PROVIDER` between `claude` and `openai` both work.

### Phase 5 — Q&A Screen
Build `/(tabs)/ask.tsx`. On submit: fetch all notes, format as context string (cap at ~6000 tokens via `utils/textHelpers.ts`), call `aiProvider.askQuestion()`. Render answer; show referenced note IDs as tappable chips.

**Gate:** "What words did I learn this week?" returns an answer citing real note IDs; tapping a chip navigates to the correct note.

### Phase 6 — Recap Screen
Build `/(tabs)/recap.tsx`. Period buttons call `getNotesSince()` then `aiProvider.generateRecap()`. Render `RecapCard` with summary + bullets. Graceful empty state when no notes exist.

**Gate:** "This Week" produces a coherent recap; "Today" on a fresh install shows an empty-state message (not a crash).

### Phase 7 — Voice Input + iOS Quick Action (nice-to-have)

Install `expo-audio`, `expo-speech-recognition`, `expo-quick-actions`. Do **not** use `expo-av` — it is deprecated after SDK 53.

> **Build note:** All three packages include native code and require config plugins. Expo Go will not work. After the `app.json` changes below, run `npx expo run:ios` once to compile the native dev build. You stay in managed workflow — no ejecting required.

**`app.json` — add to the `"plugins"` array:**
```json
["expo-audio", { "microphonePermission": "Allow $(PRODUCT_NAME) to access your microphone to record voice notes." }],
["expo-speech-recognition", {
  "microphonePermission": "Allow $(PRODUCT_NAME) to access your microphone to record voice notes.",
  "speechRecognitionPermission": "Allow $(PRODUCT_NAME) to transcribe your voice notes."
}],
["expo-quick-actions", {
  "iosActions": [{
    "id": "record-note",
    "title": "Record Note",
    "subtitle": "Start a new voice note",
    "icon": "symbol:mic.fill",
    "params": { "href": "/note/voice?autoRecord=true" }
  }]
}]
```

**`app/_layout.tsx`:** Add `useQuickActionRouting()` from `expo-quick-actions/router`. This single hook handles both cold-launch and foreground-activation scenarios — no manual listener wiring needed.

**`hooks/useVoiceRecorder.ts`:** State machine (`idle → recording → stopping → done | error`) coordinating `expo-audio` (captures `.m4a` file) and `expo-speech-recognition` (live iOS Speech framework transcription running in parallel). Requests permissions inside `startRecording()` — not on mount. Use `continuous: true` in the recognition start call to prevent iOS from cutting off mid-sentence.

**`app/note/voice.tsx`:** Dedicated recording screen. Reads `?autoRecord=true` param and auto-starts on mount when present. On save: calls `saveVoiceNote({ content: transcript, audioUri, source: 'voice' })` and navigates back. Voice notes flow through the existing AI categorization pipeline unchanged.

**`components/VoiceRecordButton.tsx`:** Full recording UI — idle (tap to record), recording (pulsing animation + live transcript + timer), stopping (spinner), done (editable transcript + Save/Discard), error (message + Open Settings link).

**`app/note/new.tsx`:** Add a mic icon button that navigates to `/note/voice` without `autoRecord` — user taps to start manually.

**After stopping recording:** Call `setAudioModeAsync({ allowsRecording: false })` to release the audio session so playback elsewhere in the app works.

**Gate:** Long-press app icon → "Record Note" appears → tap → app opens and recording auto-starts → speak a 10-second note → transcript shown → save → note appears under correct category within seconds.

---

## Cross-Cutting Concerns

- **Error boundaries:** Wrap each tab. AI failures degrade gracefully (show raw note text + "Categorization failed" badge) — never crash.
- **Context window budget:** Cap `notesContext` at ~6000 tokens in `utils/textHelpers.ts`. For MVP, pass the 200 most recent notes; add keyword filtering in a later pass.
- **Prompt versioning:** `prompt_version` column on notes. Changing a prompt in `constants/prompts.ts` does not retroactively re-process old notes.
- **Secrets:** `.env` is in `.gitignore` on day one. `.env.example` ships with placeholder values. API keys never committed.

---

## Critical Files

- `/ai/types.ts` — the AIProvider interface; everything depends on this contract being stable before Phase 4
- `/db/index.ts` — single entry point for all SQLite access; migration runner lives here
- `/constants/prompts.ts` — all prompt templates; quality of categorization/Q&A lives here
- `/app/(tabs)/notes.tsx` — primary screen; integration test for DB + AI + navigation
- `/app/note/new.tsx` — core MVP interaction; most complex user flow
- `/app/note/voice.tsx` — voice recording screen; entry point for the iOS quick action
- `/hooks/useVoiceRecorder.ts` — central logic for recording + transcription; all voice UI depends on this
- `app.json` — plugin config for Phase 7 packages; must be correct before any native build
