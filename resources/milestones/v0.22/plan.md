# Plan: v0.22 — Creature Spawning

> Source PRD: `resources/milestones/v0.22/prd.md`  
> Grill-me decisions: `resources/milestones/v0.22/grill-me-out.md`

## Architectural decisions

- **Creature model:** `Creature` interface holds `id: string`, `type: CreatureType`, `x: number`, `y: number`. No health, no combat fields.
- **CreatureType:** Union type / enum `'StoneGiant' | 'SeaSerpent' | 'LuminousSwarm'`.
- **One-per-type rule:** At most one creature of each type may exist on the map simultaneously. Enforced inside `CreaturesService` before every spawn attempt.
- **Spawn probability:** 5% per Divine Pulse per creature type when habitat conditions are met. Controlled by a named constant for easy tuning.
- **Spawn cell selection:** When multiple qualifying cells exist, one is chosen at random.
- **Qualifying cell prerequisite (all types):** Cell must be in Active state.
- **Spawn logic location:** `CreaturesService.update()` — called by the game engine inside `divinePulse()`, no change to the engine's public interface.
- **Event contract:** `CreaturesService` extends `EventEmitter` and emits `creatureSpawned` with payload `{ x: number, y: number, type: CreatureType }`.
- **Rendering layer:** Creature sprite is added last in the tile entity overlay — above terrain, building, and human sprites.
- **Persistence key:** `edenManagerCreaturesState` in localStorage.
- **Persistence pattern:** `CreaturesService.toJSON()` / `CreaturesService.fromJSON(data, grid)` — identical to `HumansService`.

---

## Phase 1: Stone Giant — end-to-end tracer bullet

**User stories:** 1, 4, 5, 6, 7, 9, 12, 13

### What to build

Replace the placeholder `Creature` model with the clean model (`id`, `type`, `x`, `y`) and introduce the `CreatureType` type. Implement Stone Giant spawn logic inside `CreaturesService`: on each Divine Pulse, find all Active Mountain cells that have at least 2 orthogonal Mountain neighbors; if no Stone Giant is already on the map, roll 5% probability and spawn on a random qualifying cell. Emit `creatureSpawned` on spawn. Wire the scene to subscribe to that event and refresh the affected tile, rendering the Stone Giant sprite above all other tile graphics.

### Acceptance criteria

- [ ] The `Creature` interface contains only `id`, `type`, `x`, `y` — no health or maxHealth fields.
- [ ] `CreatureType` type exists with `'StoneGiant'` as a valid value.
- [ ] Building a Mountain cluster with 2+ orthogonal Mountain neighbors and awakening the cells eventually causes the Stone Giant sprite to appear on one of those cells (within ~20 pulses on average).
- [ ] The Stone Giant never spawns on a Dormant or Veiled cell.
- [ ] Only one Stone Giant exists on the map at any time, even when multiple qualifying cells are present.
- [ ] The Stone Giant sprite renders above terrain, building, and human sprites on the same tile.
- [ ] The scene reacts to `creatureSpawned` and updates the tile without requiring a full re-render.

---

## Phase 2: Sea Serpent & Luminous Swarm + full test suite

**User stories:** 2, 3, 10, 11

### What to build

Add Sea Serpent (spawns on any Active Water cell) and Luminous Swarm (spawns on any Active Sacred Grove cell) following the same spawn path established in Phase 1. Then write the full unit test suite for `CreaturesService` covering all three creature types.

### Acceptance criteria

- [ ] `CreatureType` includes `'SeaSerpent'` and `'LuminousSwarm'`.
- [ ] The Sea Serpent sprite eventually appears on an Active Water cell after enough pulses.
- [ ] The Luminous Swarm sprite eventually appears on an Active Sacred Grove cell after enough pulses.
- [ ] One-per-type rule holds for Sea Serpent and Luminous Swarm independently.
- [ ] Unit tests pass for:
  - Stone Giant: does not spawn on non-Mountain terrain.
  - Stone Giant: does not spawn on Mountain cell with fewer than 2 orthogonal Mountain neighbors.
  - Stone Giant: does not spawn on a Dormant Mountain cell.
  - Stone Giant: spawns when conditions met and `Math.random` returns < 0.05.
  - Stone Giant: does not spawn when conditions met and `Math.random` returns ≥ 0.05.
  - Stone Giant: second instance blocked when one already exists, regardless of `Math.random`.
  - Sea Serpent: spawns on Active Water cell with correct probability (same probability tests as above).
  - Luminous Swarm: spawns on Active Sacred Grove cell with correct probability (same probability tests as above).
  - `creatureSpawned` event emitted with correct `{ x, y, type }` payload on every spawn.

---

## Phase 3: Persistence

**User stories:** 8

### What to build

Add serialization and deserialization to `CreaturesService` (`toJSON` / `fromJSON`) and two matching methods to `PersistenceService` (`saveCreatures` / `loadCreatures`). Wire the scene to load creatures on startup (before the first pulse) and save them after each pulse alongside the grid and humans.

### Acceptance criteria

- [ ] After a creature spawns, reloading the page shows the creature in the same position.
- [ ] All three creature types survive a page reload correctly.
- [ ] If localStorage contains no creature data, the game starts with an empty creature list without errors.
- [ ] If localStorage contains corrupt creature data, the game starts with an empty creature list and logs an error (no crash).
- [ ] The new localStorage key (`edenManagerCreaturesState`) does not conflict with existing grid or humans keys.
