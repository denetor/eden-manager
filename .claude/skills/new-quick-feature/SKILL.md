---
name: quick-feature
description: Use for single, contained features (under ~150 lines of code, touching 1-3 files). Runs decision questions, implementation, and verification in one session without intermediate documents. Do NOT use for multi-story features or new projects — use grill-me + make-plan + implement-story instead.
---

# Quick Feature

A compressed workflow for small features. Three phases, one session, no scratch files.

## Phase 1 — Decide (only what's needed)

1. Read the user's feature request.
2. Quickly scan the project to anchor your suggestions:
   - `package.json` (scripts, key libraries)
   - The 1-2 files most likely to be touched
   - Stop. Don't read more.
3. Identify decisions that are NOT obvious from the request OR from existing code patterns. Ignore decisions whose answer is clearly dictated by convention in the codebase (e.g. "which test framework" when there's already one in use).
4. Ask AT MOST 10 questions, in one batch, multiple-choice with a recommended default marked `(default)`. If you have zero real questions, skip this phase entirely and say "No decisions needed, proceeding."
5. Wait for answers. If the user replies "go" or "default", use the defaults.

## Phase 2 — Implement

1. Implement directly. No plan document.
2. Rules:
   - Match existing conventions over personal preferences.
   - Explicit names. Small functions.
   - No new libraries without asking.
   - No refactoring outside the feature scope (note it instead).
   - Errors: follow the pattern already in the codebase.
   - Tests: write them only for logic with branches, edge cases, or external boundaries. Skip for pure plumbing/wiring.
3. Touch the minimum number of files. If the feature seems to need more than 3 files, stop and ask the user whether to split it into a real plan (`make-plan` skill).

## Phase 3 — Verify

1. Run, in order: `tsc --noEmit`, test command, lint command (use scripts from `package.json`).
2. If something fails, fix and re-run. Maximum 2 iterations. If still failing, stop and report what's broken.
3. Final report to user, max 5 bullets:
   - Files changed
   - Tests added (if any)
   - Anything skipped or noted for later
   - Any deviation from the user's stated request

## Anti-patterns

- Do NOT write a `decisions.md`, `plan.md`, or any scratch file. Decisions live in chat.
- Do NOT explain the implementation in prose after writing it. The code + the 5-bullet report is enough.
- Do NOT ask questions whose answer is in the codebase. Look first.
- Do NOT use this skill if the feature spans multiple modules or has more than ~5 acceptance criteria. Tell the user to use the multi-story workflow instead.

## Token discipline

- Read files in full only when you'll edit them. Otherwise sample (head, grep).
- Don't restate the user's request back to them.
- Don't add a "summary of changes" beyond the 5-bullet final report.