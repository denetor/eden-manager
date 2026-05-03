---
name: new-grill-me
description: Use when the user has a project description or feature idea and needs to make implementation decisions before writing code. Reads the input document and asks targeted questions to surface unstated assumptions, then produces decisions.md.
---

# Grill Me

## Process

1. Read the project/feature document the user provides.
2. Identify decisions that are NOT explicit in the document. Focus on:
   - Data model choices (what's an entity, what's a value object, relationships)
   - State management approach (where state lives, sync vs async)
   - Error handling strategy (throw vs Result type, where errors are caught)
   - External boundaries (APIs, persistence, file I/O — what's mocked in tests)
   - Validation strategy (where input is validated, what library if any)
   - Concurrency / async patterns if relevant
3. Ask questions until every doubt is cleared, ONE BATCH, numbered. Prefer multiple-choice with a "default" recommendation when there's a sensible one. Don't ask about things the document already answers.
4. After the user answers, write `decisions.md` with this structure:

```
## Decisions
### Context
<1 to 3 sentences summarizing what we're building>

## Decisions

#### <Decision name>
- Choice: <what was decided>
- Rationale: <one sentence>
```

5. Keep `decisions.md` under 100 lines. This is a reference, not prose.

## Anti-patterns
- Don't ask about coding style or formatting (handled by linter).
- Don't ask questions whose answer is obvious from context.
- Don't write the PRD here. Decisions only.

