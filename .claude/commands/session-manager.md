Handle a session handoff. The argument is `start` or `end`, with optional additional parameters.

## Argument formats

- `/session-handoff start` — asks for a session name, then shows orientation
- `/session-handoff start <name>` — uses the provided name, then shows orientation
- `/session-handoff start <name> /model <model>` — also reminds you to switch model at init
- `/session-handoff end` — writes the handoff file using the session ID
- `/session-handoff end <name>` — writes the handoff file with the session name in the header

## If the argument starts with "start"

**Step 0 — Parse args:**
- Look at the text after `start`:
  - If it contains `/model <model>`, extract the model name and remove that portion from the remaining text.
  - The remaining text (trimmed) is the session name.
- If no session name was found, use `AskUserQuestion` to ask: "What is the name for this session?" with header "Session name" and options like "Phase 2 AI", "Phase 3 UI", "Bug fixes", "Other". Wait for the answer before continuing.

**Step 1 — Check repo state:**
- Read `.gitignore` so you know which paths are excluded from version control — do not flag changes in those paths as uncommitted work.
- Run `git status --short` to detect uncommitted changes in tracked files.
- Run `gh pr list --state open` to detect any open PRs.
- If there are **no uncommitted changes** and **no open PRs**: run `git pull origin main` and report that you did so.
- If there are uncommitted changes: list them and skip the pull.
- If there are open PRs: list each one (number, title, branch) and skip the pull, noting the user should merge or close them first.

**Step 2 — Read last session and print orientation:**
- Find the most recent file in `plan/sessions/` (sort by filename to get the latest).
- Read it and print a concise orientation under the heading **Session: \<name\>**:
  - What was completed last session
  - What the next steps are (from the "Next Steps" section of that file)
  - Any open bugs from `plan/bugs.md` (status BACKLOG or IN PROGRESS only — skip RESOLVED)

**Step 3 — Model switch reminder (if `/model` was specified):**
- If a model was parsed from the args, end the output with a clearly visible line:
  > **To switch models:** type `/model <model>` now.
- Do not write any files. Just print the summary.

## If the argument starts with "end"

1. Parse the remaining args after `end`: if any text is present, use it as `<session-name>`; otherwise leave it blank.

2. Determine the session ID: extract the directory name from the `$CLAUDE_JOB_DIR` environment variable (e.g. if `$CLAUDE_JOB_DIR` is `/Users/rhiannon/.claude/jobs/abc123`, the session ID is `abc123`). If unavailable, use today's date in YYYY-MM-DD format.

3. Find the most recent prior session file in `plan/sessions/` and read its "Next Steps" section.

4. Review the current conversation to identify:
   - Everything completed this session
   - Which of the prior session's next steps were addressed (completed or partially done)
   - Which were not touched

5. Write a new file at `plan/sessions/<session-id>.md` using this structure:

```
# Session Handoff — <session-id><if session-name is present: " — <session-name>">

## Completed This Session

- <bullet per meaningful thing accomplished>

## Prior Next Steps — Status

| Task | Status |
|------|--------|
| <task from prior handoff> | ✅ Done / ⚠️ Partial / ❌ Not started |

## Next Steps

> Run these yourself to continue:

1. <concrete action the user should take — be specific, include commands if relevant>
2. ...

## Open Bugs

<copy bugs from plan/bugs.md where Status is BACKLOG or IN PROGRESS — omit RESOLVED bugs. Write "None" if no open bugs exist>
```

6. Print a confirmation with the file path so the user knows where it was written.
