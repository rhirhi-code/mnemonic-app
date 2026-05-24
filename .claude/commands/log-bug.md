Log a new bug to `plan/bugs.md` with status BACKLOG.

Use this skill any time:
- The user asks to create or log a bug
- You discover a bug during a session and want to track it

## Arguments

The argument is a short description of the bug (1 sentence). Everything else is derived from context.

## Steps

1. Read `plan/bugs.md` to determine the next bug ID (find the highest existing BUG-NNN number and increment by 1; start at BUG-001 if none exist).

2. Collect the following fields — infer from context if not explicitly provided:
   - **Title**: one-line summary (use the argument if given)
   - **Phase**: current development phase (e.g. "1 (Data Layer)", "2 (AI Integration)") — infer from recent work context
   - **What happened**: 1–3 sentences describing the symptom
   - **Likely cause**: best guess at root cause; write "Unknown" if unclear
   - **Error**: paste any relevant error message or stack trace, or omit the section if none

3. Append the following block to `plan/bugs.md`:

```
## BUG-<NNN> — <Title>

**Status:** BACKLOG
**Phase:** <phase>

<include if there is an error message>
**Error:**
```
<error output>
```
</include>

**What happened:** <symptom description>

**Likely cause:** <root cause or "Unknown">
```

4. Print a one-line confirmation: `Logged BUG-<NNN>: <Title>`
