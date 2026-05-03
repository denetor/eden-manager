---
name: implement-story
description: Use to implement a single story from plan.md. Reads only the relevant story, implements it, runs checks, and marks it done.
---

# Implement Story

## Process

1. Implement the first uncomplete story (not marked with `✅`)
2. Read ONLY:
   - The "Conventions" section of `plan.md`
   - The specific story block
   - The files the story will touch (if they exist)
   - `decisions.md` only if the story acceptance criteria reference a decision you need to recheck
3. Implement, following these rules:
   - Match existing conventions over personal preferences.
   - Explicit names. No 1-letter variables outside tight loops.
   - Small functions. If a function exceeds ~30 lines, ask whether to split.
   - No premature abstraction. Inline first, extract on second use.
   - Errors: follow the pattern in decisions.md. Don't invent a new one.
   - Write tests for non-trivial logic (anything with branches, edge cases, or external boundaries). Skip tests for pure plumbing.
4. Run, in order: `tsc --noEmit`, the test command, the lint command. Use scripts from `package.json`.
5. If anything fails, fix and re-run. Maximum 3 iterations — if still failing, stop and report.
6. Update `plan.md`: change `☐` to `✅` for the completed story. Add a one-line note if you deviated from the plan.

## Anti-patterns
- Don't implement multiple stories in one go. One at a time.
- Don't refactor code outside the story scope. Note it for later instead.
- Don't add libraries without asking.