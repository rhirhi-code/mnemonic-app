# mnemonic

A personal notes app for iOS that captures thoughts by text or voice and uses Claude AI to automatically categorize and surface them.

## What it does

- **Capture** — type a note or record your voice; voice notes are transcribed on-device
- **Categorize** — Claude reads each note and assigns it to a category (Words, Ideas, People, Reminders, Misc) with a short summary
- **Ask** — query your notes in natural language; Claude answers using your note history
- **Recap** — get an AI-generated summary of what you captured today, this week, or this month

Notes are stored locally in SQLite. AI categorization runs asynchronously after a note is saved; the Notes tab polls for updates and shows a spinner while categorization is in flight.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 56 / React Native 0.85 |
| Routing | Expo Router (file-based) |
| Storage | expo-sqlite (SQLite, local) |
| Voice recording | expo-audio (.m4a) |
| Speech-to-text | expo-speech-recognition (SFSpeechRecognizer) |
| AI | Anthropic Claude API via raw `fetch` |
| Language | TypeScript |

## Requirements

- macOS with Xcode installed
- Node.js 18+
- An Anthropic API key (get one at console.anthropic.com)

## Setup

```bash
git clone <repo-url>
cd mnemonic
npm install
```

Create a `.env` file in the project root:

```
EXPO_PUBLIC_AI_PROVIDER=claude
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
```

If you omit the `.env` file, the app falls back to a mock AI provider that returns placeholder categories.

## Running

The app uses native modules (`expo-audio`, `expo-speech-recognition`) so it cannot run in Expo Go. A compiled dev build is required:

```bash
npx expo run:ios
```

This compiles the native project, installs it on the simulator, and starts Metro. Re-run this command whenever you add or remove a native package. For day-to-day development after the initial build, Metro hot-reloads changes automatically — you do not need to recompile.

> **Note:** Speech recognition (live voice transcript) does not work in the iOS simulator. It works on a physical device. Audio recording and note saving work in the simulator.

## Project structure

```
app/
  (tabs)/
    notes.tsx       # Notes list, grouped by category
    ask.tsx         # Natural language Q&A over notes
    recap.tsx       # AI-generated daily/weekly/monthly recap
  note/
    new.tsx         # Text note entry
    voice.tsx       # Voice recording + transcription
    [id].tsx        # Note detail / edit

ai/
  index.ts          # Provider selector (reads EXPO_PUBLIC_AI_PROVIDER)
  providers/
    claude.ts       # Anthropic API via fetch
    openai.ts       # OpenAI API via fetch
    mock.ts         # Deterministic mock for development
  types.ts
  validation.ts     # Zod schemas for AI responses

db/
  index.ts          # SQLite connection + migration runner
  schema.ts         # CREATE TABLE statements, seed categories
  notes.ts          # Note CRUD
  categories.ts     # Category queries

hooks/
  useNotes.ts
  useCategories.ts
  useAI.ts
  useVoiceRecorder.ts

components/
  NoteCard.tsx
  CategoryGroup.tsx
  AIStatusBanner.tsx
  VoiceRecordButton.tsx

constants/
  prompts.ts        # System prompts for categorize / ask / recap
```

## Environment variables

| Variable | Values | Default |
|---|---|---|
| `EXPO_PUBLIC_AI_PROVIDER` | `claude`, `openai`, `mock` | `mock` |
| `EXPO_PUBLIC_ANTHROPIC_API_KEY` | `sk-ant-...` | _(empty — required for claude)_ |

## Running tests

```bash
npx jest --no-coverage   # unit tests
npx tsc --noEmit         # type check
```

## Known limitations

- **Speech recognition in simulator** — `SFSpeechRecognizer` requires a physical device. Voice recording still works; the transcript will be empty.
- **iOS only** — Android support is stubbed in `app.json` but untested. Web output is static-only.
- **No sync** — notes live in on-device SQLite; there is no cloud backup or multi-device sync.
