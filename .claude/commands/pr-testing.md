Test the current branch before submitting a PR. Runs type-check and unit tests and reports a clear pass/fail result.

Use this skill:
- Before opening any PR (invoked automatically by the `log-bug` and session-handoff flows)
- Any time you want to verify the branch is in a shippable state

## Steps

1. **Merge conflict check** — run `git fetch origin main` then `git merge-tree $(git merge-base HEAD origin/main) HEAD origin/main` (or attempt a dry-run merge) to detect conflicts before pushing.
   - Simpler alternative: `git diff --name-only --diff-filter=U` after a `git merge origin/main --no-commit --no-ff`; abort with `git merge --abort` immediately after.
   - If any conflicting files are found, list them and mark as Fail.

2. **Type-check** — run `npx tsc --noEmit` from the project root.
   - If it exits non-zero, collect the errors and report them.

3. **Unit tests** — run `npx jest --no-coverage` from the project root.
   - If it exits non-zero, collect the failure output and report it.

4. **Report results** using this format:

```
## PR Test Results

| Check            | Result |
|------------------|--------|
| Merge conflicts  | ✅ None / ❌ Conflicts in <files> |
| Type-check       | ✅ Pass / ❌ Fail |
| Unit tests       | ✅ Pass / ❌ Fail |

<If any failures, paste the relevant error output here.>

**Overall: PASS / FAIL**
```

5. If overall **PASS**: print "Tests passed — safe to submit PR." and return.
   If overall **FAIL**: print "Tests failed — do not submit PR until issues are resolved." and list what needs fixing.
