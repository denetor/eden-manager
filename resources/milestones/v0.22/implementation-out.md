# Implementation Output — v0.22: Creature Spawning

**Date:** 2026-05-02  
**Status:** Complete

---

## Summary

All three phases from the plan were implemented. The build compiles cleanly and all 24 new unit tests pass.

---

## Phase 1 — Stone Giant end-to-end tracer bullet ✅

### Changes

**`src/core/creatures/creatures.model.ts`** — Full rewrite  
Replaced the placeholder model (which had `name`, `health`, `maxHealth`) with the clean model agreed in the grill-me:
- `CreatureType` union type: `'StoneGiant' | 'SeaSerpent' | 'LuminousSwarm'`
- `Creature` interface: `id`, `type`, `x`, `y` only
- `CreaturesState` retained for `getState()` compatibility

**`src/core/creatures/creatures.service.ts`** — Full rewrite  
- Extends `EventEmitter` (same base as `HumansService`)
- `update()` delegates to `checkAndSpawn()` — called by game engine on every pulse, no change to engine interface
- `trySpawn(type, qualifiesFn)` private method: enforces one-per-type rule, filters qualifying Active cells, rolls 5% probability (`SPAWN_CHANCE = 0.05` named constant), picks random candidate, emits `creatureSpawned`
- `orthogonalNeighbors(x, y)` private helper: filters `grid.getAdjacentCells()` to 4-directional only using Manhattan distance === 1
- Exports `CreatureSpawnedPayload` interface: `{ x, y, type }`

**`src/scenes/game.scene.ts`** — Four targeted edits  
- Imports `CreatureSpawnedPayload` alongside existing `CreaturesService` import
- `subscribeToCreaturesEvents()` new private method: subscribes to `creatureSpawned` and refreshes the affected tile via `setComposedGraphic` — identical pattern to `subscribeToHumansEvents`
- `addEntityOverlays()` extended: looks up creature at cell coordinates, adds sprite above human sprite
- `getCreatureSprite(type)` new private method: maps `CreatureType` to the corresponding `Sprites.*` entry

---

## Phase 2 — Sea Serpent & Luminous Swarm + full test suite ✅

Sea Serpent and Luminous Swarm spawn conditions are implemented in the same `checkAndSpawn()` call as Stone Giant — all three creature types are handled in a single `creatures.service.ts` rewrite (no separate phase needed in practice).

**`src/core/creatures/creatures.service.test.ts`** — New file, 24 tests  

| Group | Tests |
|---|---|
| StoneGiant spawn conditions | 7 tests: wrong terrain, < 2 neighbors, diagonal-only neighbors, Dormant cell, success, blocked by probability, one-per-type |
| SeaSerpent spawn conditions | 5 tests: wrong terrain, Dormant cell, success, blocked by probability, one-per-type |
| LuminousSwarm spawn conditions | 5 tests: wrong terrain, Dormant cell, success, blocked by probability, one-per-type |
| One-per-type independence | 1 test: all three can coexist |
| `creatureSpawned` event | 3 tests: correct payload, no emit when blocked by probability, no emit when blocked by one-per-type |
| `toJSON` / `fromJSON` | 3 tests: round-trip, null for invalid data, empty service for valid empty data |

**Result: 24/24 tests pass.**

**`src/core/game-engine.service.test.ts`** — Updated  
The old "Creatures System Integration" block used the removed `spawnCreature(id, name, x, y, health)` API and the removed `name` field. Replaced with 4 tests that use the current API (`getCount`, `getCreatures`, `update`, `getState`).

---

## Phase 3 — Persistence ✅

**`src/persistence/persistence.service.ts`** — Extended  
- New `CREATURES_STORAGE_KEY = 'edenManagerCreaturesState'`
- `saveCreatures(creatures: CreaturesService): boolean` — serializes via `creatures.toJSON()`
- `loadCreatures(grid: Grid): CreaturesService | null` — deserializes via `CreaturesService.fromJSON()`, returns null on missing or corrupt data (with console error, no crash)

**`src/core/creatures/creatures.service.ts`** — Extended  
- `toJSON(): { creatures: Creature[] }` — shallow copies all creatures
- `static fromJSON(data, grid): CreaturesService | null` — validates array shape, returns null for invalid data

**`src/scenes/game.scene.ts`** — Extended  
- Startup: `loadCreatures(grid) ?? new CreaturesService(grid)` replaces the previous hardcoded `new CreaturesService(grid)`
- `triggerDivinePulse()`: calls `saveCreatures()` alongside existing `saveGrid()` and `saveHumans()`

---

## Acceptance criteria checklist

### Phase 1
- [x] `Creature` interface contains only `id`, `type`, `x`, `y`
- [x] `CreatureType` includes `'StoneGiant'`
- [x] Stone Giant spawns eventually on qualifying Mountain cluster (5% per pulse)
- [x] Does not spawn on Dormant or Veiled cells
- [x] Only one Stone Giant on map at a time
- [x] Creature sprite renders above terrain, building, and human sprites
- [x] Scene reacts to `creatureSpawned` and updates the tile without full re-render

### Phase 2
- [x] `CreatureType` includes `'SeaSerpent'` and `'LuminousSwarm'`
- [x] Sea Serpent spawns on Active Water cells
- [x] Luminous Swarm spawns on Active Sacred Grove cells
- [x] One-per-type rule holds for all three types independently
- [x] All 24 unit tests pass

### Phase 3
- [x] Creature position survives page reload
- [x] All three types serialized and restored correctly
- [x] Missing localStorage data → empty creature list, no error
- [x] Corrupt localStorage data → empty creature list, console error, no crash
- [x] New key `edenManagerCreaturesState` does not conflict with existing keys

---

## Files changed

| File | Change |
|---|---|
| `src/core/creatures/creatures.model.ts` | Full rewrite |
| `src/core/creatures/creatures.service.ts` | Full rewrite |
| `src/core/creatures/creatures.service.test.ts` | New file (24 tests) |
| `src/persistence/persistence.service.ts` | Added `saveCreatures` / `loadCreatures` |
| `src/scenes/game.scene.ts` | Added event subscription, creature rendering, creature persistence |
| `src/core/game-engine.service.test.ts` | Updated stale creature tests to new API |
