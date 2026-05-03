---
name: review-story
description: Use after implement-story to review the diff for issues that typecheck/tests don't catch.
---

# Review Story

## Process

1. Run `git diff` (or `git diff <base>` if user specifies).
2. Check for:
   - Logic that's correct but unclear (suggest renames or comments)
   - Missing edge cases not covered by tests
   - Convention drift from the rest of the codebase
   - Dead code, unused exports
   - Public APIs without types
3. Report findings as a numbered list. Don't fix automatically — propose, let the user decide.
4. Keep it under 10 items. If there's more, the story was too big.