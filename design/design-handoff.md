# Design Handoff: AI-Powered Notes App (iOS)

## What This App Does

A personal iOS notes app where users capture thoughts by typing or speaking. AI automatically categorizes each note and makes the entire collection queryable in plain English ("what words did I learn this week?"). The design should feel fast, calm, and frictionless — this is a daily-use capture tool, not a productivity suite.

---

## Constraints

- **Platform:** iOS only (iPhone, no iPad requirement for MVP)
- **Styling:** React Native `StyleSheet` — no third-party UI kit. All visual design must be achievable with standard RN primitives (`View`, `Text`, `TextInput`, `TouchableOpacity`, `FlatList`, `Animated`).
- **Icons:** `@expo/vector-icons` (Ionicons set). SF Symbols available for the quick action icon only (`mic.fill` is already specified in config).
- **No onboarding, no auth, no settings screen** in MVP.

---

## Color System

Five seeded categories with assigned colors. The design should use these as the primary accent palette — note cards, category headers, and badges all derive from the category color.

| Category | Color | Icon (Ionicons) |
|---|---|---|
| Words | `#4A90D9` (blue) | `book` |
| Ideas | `#F5A623` (amber) | `lightbulb` |
| People | `#7ED321` (green) | `person` |
| Reminders | `#D0021B` (red) | `alarm` |
| Misc | `#9B9B9B` (grey) | `folder` |

Notes that are still being categorized (`ai_status: 'pending'`) have no category yet — design a neutral/unstyled state for these.

---

## Screens

### 1. Notes List — `/(tabs)/notes` (default tab)

The home screen. Notes grouped by category, each group collapsible.

**Data available per note:**
- `display_title` — AI-generated short title (may be null if still pending)
- `raw_text` — the original input
- `ai_summary` — AI-generated one-liner (may be null)
- `ai_tags` — array of strings e.g. `["vocab", "spanish"]`
- `is_reminder` — boolean
- `reminder_at` — date string (if reminder)
- `source` — `'text'` or `'voice'`
- `ai_status` — `'pending'` | `'done'` | `'error'`
- `created_at` — timestamp

**Key UI elements:**
- Tab bar at bottom (Notes / Ask / Recap)
- Section headers per category (color-coded, collapsible)
- `NoteCard` component per note (see Components section)
- `AIStatusBanner` at top when any notes are pending categorization
- FAB (floating action button) — bottom right — opens Add Note modal
- Empty state when no notes exist

---

### 2. Add Note — `/note/new` (modal)

Opens as a bottom sheet modal over the Notes tab.

**Key UI elements:**
- Large multi-line `TextInput` — autofocused, fills most of the screen
- Save button (header right or prominent bottom button)
- Mic icon button — navigates to the Voice Recording screen (no auto-start)
- Dismiss / cancel (header left or swipe down)

**After save:** navigates back immediately. AI categorization runs in background — user sees the note appear in the list with a pending badge.

---

### 3. Voice Recording — `/note/voice`

Opened two ways:
- From Add Note (mic icon) — user must tap to start
- From iOS Home Screen quick action — auto-starts immediately

This screen should feel purposeful and focused — full-screen, minimal chrome, the microphone interaction is the entire point.

**States to design (all in `VoiceRecordButton.tsx`):**

| State | What to show |
|---|---|
| `idle` | Large centered mic button, "Tap to Record" label |
| `recording` | Pulsing red circle animation, live duration timer (00:00 format), live transcript text scrolling below the button, "Tap to Stop" label |
| `stopping` | Brief spinner / "Processing…" |
| `done` | Transcript text in an editable `TextInput`, "Save Note" (primary) + "Discard" (secondary) buttons |
| `error` | Error message, "Open Settings" link (for permission denial), retry option |

**Notes on the recording state:**
- The transcript updates live as the user speaks (partial results stream in)
- The transcript area should scroll if text gets long
- Timer counts up from 00:00
- The pulsing animation should use `Animated.loop` — no third-party animation library

---

### 4. Note Detail — `/note/[id]`

View a saved note. Tappable from NoteCard.

**Key UI elements:**
- Category badge (color + icon + name)
- `display_title` as heading
- `raw_text` (full original content)
- `ai_summary`
- `ai_tags` as chips/pills
- `reminder_at` if set
- Source indicator if `source === 'voice'` (e.g. a small mic icon)
- Edit button (re-opens editable view, re-triggers AI on save)
- Delete button (with confirmation)

---

### 5. Ask — `/(tabs)/ask`

Natural language Q&A over the user's notes.

**Key UI elements:**
- Text input at top or bottom (chat-style or search-style — designer's call)
- Submit button
- Answer rendered as formatted text below
- Referenced note IDs shown as tappable chips (tapping navigates to Note Detail)
- Loading state while AI is thinking
- Empty/prompt state before first question

---

### 6. Recap — `/(tabs)/recap`

AI-generated summaries for time periods.

**Key UI elements:**
- Three period buttons: "Today" / "This Week" / "This Month"
- Active period highlighted
- `RecapCard` showing:
  - Summary paragraph
  - 3–5 bullet point highlights
- Loading state while generating
- Empty state: "No notes yet for this period" (not a crash, not an error)

---

## Components

### `NoteCard`
Displays a single note in the list. Must handle:
- Pending state (`ai_status: 'pending'`): neutral styling, shimmer or spinner, no title yet
- Done state: title, summary preview, tags, category color accent
- Error state (`ai_status: 'error'`): raw text shown + "Categorization failed" badge
- Voice badge: small mic icon when `source === 'voice'`
- Reminder badge: alarm icon when `is_reminder === true`

### `CategoryGroup`
Section header + collapsible container for a set of NoteCards. Includes category name, icon, color, and note count. Tap header to collapse/expand.

### `AIStatusBanner`
Appears at the top of the Notes list when one or more notes have `ai_status: 'pending'`. Should be subtle — not alarming. Something like "Categorizing 2 notes…" with a small activity indicator. Disappears automatically when all notes are categorized.

### `VoiceRecordButton`
Full recording UI widget. All five states described in the Voice Recording screen section above. Receives state as props — the logic lives in `hooks/useVoiceRecorder.ts`, not in this component.

---

## Navigation Structure

```
Root Stack
├── (tabs)                    # persistent tab bar
│   ├── notes.tsx             # default tab
│   ├── ask.tsx
│   └── recap.tsx
└── note/                     # pushed modally or in stack
    ├── new.tsx               # modal
    ├── voice.tsx             # modal or full-screen push
    └── [id].tsx              # stack push
```

The tab bar should always be visible on the three tab screens. The note screens sit above the tab bar (modal or stack).

---

## Key User Flows

### Primary flow (text note)
Notes tab → FAB → Add Note modal → type → Save → back to Notes tab → note appears (pending) → note categorizes (done)

### Voice quick action flow
Home Screen long-press → "Record Note" → Voice Recording screen (auto-starts) → speak → tap stop → transcript shown → Save → Notes tab → note categorizes

### Voice from within app
Notes tab → FAB → Add Note modal → tap mic icon → Voice Recording screen (idle) → tap mic button → speak → tap stop → Save → Notes tab

### Q&A flow
Ask tab → type question → submit → answer appears with note ID chips → tap chip → Note Detail

---

## Tone and Feel

- Clean, minimal — iOS native aesthetic
- Category colors are the main visual accent; the rest of the UI should be neutral
- Interactions should feel immediate — optimistic updates (note appears in list before AI responds)
- The voice recording screen should feel calm and focused, not clinical
- No heavy gradients, shadows, or decorative elements that would slow perceived performance
