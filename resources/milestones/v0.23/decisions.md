## Context
Creatures (StoneGiant, SeaSerpent, LuminousSwarm) already spawn on the grid (v0.22).
v0.23 adds per-pulse movement and passive terrain effects for each creature type.

---

## Decisions

#### Movement algorithm
- Choice: Pure random walk (no harmony/directed movement)
- Rationale: Harmony is not yet a defined game concept; keep movement simple for now

#### Movement distance per pulse
- Choice: 0 or 1 cell per pulse (creature may stay in place)
- Rationale: Adds natural hesitation; avoids every creature always moving

#### Map edge behavior
- Choice: Creature stays in place when movement would leave the map boundary
- Rationale: Simplest valid fallback; no wrapping or bouncing

#### Multiple creatures on same cell
- Choice: Not allowed — moving creature must pick a different target cell
- Rationale: Avoids visual stacking and ambiguous effect interactions

#### Effect trigger timing
- Choice: Passive effect fires every pulse on the creature's current cell
- Rationale: Consistent with how synergies and mana generation already work

#### Water Serpent effect
- Choice: Each adjacent Meadow cell (Active) is transformed to Fertile Plain
- Rationale: Uses existing terrain types; creates meaningful terraforming without new types

#### Luminous Swarm effect trigger
- Choice: Mana generation bonus applies every pulse regardless of time on cell
- Rationale: No "rest timer" state needed; keeps the model simple

#### Stone Colossus effect target
- Choice: Only transforms Active Mountain cells to Foothill
- Rationale: Inactive cells should not be affected by creature passage

#### Visual movement
- Choice: Sprite interpolates smoothly from old cell to new cell over one pulse interval
- Rationale: Gives the world a living feel; duration matches `PULSE_INTERVAL` constant
- Implementation: Add `PULSE_INTERVAL` to `src/shared/constants.ts`; use it in both GameScene pulse timer and creature sprite tween duration

#### Creature despawn
- Choice: Each pulse, each creature has a 5% chance to despawn
- Rationale: Mirrors spawn probability; prevents permanent creature accumulation
- Implementation: Add `CREATURE_DESPAWN_PROBABILITY = 0.05` to `src/shared/constants.ts`
