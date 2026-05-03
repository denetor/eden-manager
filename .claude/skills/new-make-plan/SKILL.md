---
name: make-plan
description: Use after decisions.md exists to produce an implementation plan with stories ordered by dependency. Explores the existing codebase to extract conventions and integrate them into the plan.
---

# Make Plan

## Process

1. Read `decisions.md`.
2. If a codebase exists, scan it briefly:
   - `package.json` (libraries, scripts)
   - `tsconfig.json` (strict mode? path aliases?)
   - Top-level structure (`src/`, folders, naming)
   - 2-3 representative existing files to grasp style
   Do NOT read the whole codebase. Sample.
3. Produce `plan.md`:

```
## Implementation Plan
### Conventions (extracted from codebase)
<bullet list — naming, error style, test framework, etc. Skip if greenfield.>

### Stories
#### S1 — <name>

- Depends on: none | S<n>
- Files: <expected paths>
- Acceptance:
  - <observable behavior 1>
  - <observable behavior 2>
- Tests: <what to test, briefly>
- Status: ☐

#### S2 — ...
```

4. Order stories so each only depends on earlier ones.
5. Keep stories small: each should be implementable + testable in one focused session. If a story has more than ~5 acceptance criteria, split it.
6. NO prose explanations between stories. The plan is a checklist, not a document.

## Anti-patterns
- Don't write code here.
- Don't include "nice to have" stories. Only what's needed for the agreed scope.
- Don't restate decisions.md — reference it.