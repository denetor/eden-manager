## Implementation Plan — v0.23: Creature Movement & Effects

### Conventions (extracted from codebase)
- Services extend `EventEmitter` and emit typed events; subscribers use `.on(event, handler)`
- `CreaturesService.update()` is called from `GameEngine.update()` each pulse
- Tile rendering uses `tile.addGraphic()` inside `setComposedGraphic()` in `game.scene.ts`
- Unit tests: Jest via `ts-jest`; use `jest.spyOn(Math, 'random')` to control probability
- Integration tests: Playwright against production build
- Constants live in `src/shared/constants.ts`
- File naming: `kebab-case`; actors end in `.actor.ts`
- One class per file; 4-space indent; strict TypeScript

---

### Stories

#### S1 — Shared constants

- Depends on: none
- Files: `src/shared/constants.ts`, `src/scenes/game.scene.ts`
- Acceptance:
  - `PULSE_INTERVAL = 1000` exported from `constants.ts`
  - `CREATURE_DESPAWN_PROBABILITY = 0.05` exported from `constants.ts`
  - `game.scene.ts` uses `PULSE_INTERVAL` instead of hardcoded `1000`
- Tests: none (no logic to test)
- Status: ✅

---

#### S2 — Creature movement and despawn

- Depends on: S1
- Files: `src/core/creatures/creatures.service.ts`, `src/core/creatures/creatures.model.ts`, `src/core/creatures/creatures.service.test.ts`
- Acceptance:
  - Each pulse each creature moves to a random orthogonal neighbor with 50% probability (stays in place otherwise)
  - Creature does not move outside the grid bounds (stays in place that pulse)
  - Creature does not move to a cell already occupied by another creature (picks a different neighbor; stays if none available)
  - Each pulse each creature has `CREATURE_DESPAWN_PROBABILITY` (5%) chance to be removed
  - `creatureMoved` event emitted: `{ id, type, fromX, fromY, toX, toY }`
  - `creatureDespawned` event emitted: `{ id, type, x, y }`
  - Movement and despawn logged to console
- Tests:
  - Creature moves to valid neighbor when random allows
  - Creature stays at boundary when all valid neighbors are out of bounds
  - Creature does not move to occupied cell
  - Creature removed on despawn probability; count decreases
  - `creatureMoved` event fires with correct payload
  - `creatureDespawned` event fires with correct payload
  - Despawn is independent per creature (not all at once)
- Status: ✅ (4 existing "second update" tests updated to use mockReturnValueOnce to prevent accidental despawn with forceSpawn mocks)

---

#### S3 — Creature passive effects

- Depends on: S2
- Files: `src/core/creatures/creatures.service.ts`, `src/core/creatures/creatures.service.test.ts`, `src/core/game-engine.service.ts`
- Acceptance:
  - StoneGiant on an Active Mountain cell: cell terrain becomes `Foothill` after `update()`
  - StoneGiant on a non-Active or non-Mountain cell: no terrain change
  - SeaSerpent: each orthogonal Active Meadow neighbor becomes `Fertile Plain` after `update()`
  - SeaSerpent on a cell with no Active Meadow neighbors: no terrain change
  - LuminousSwarm on an Active cell: `update()` returns or emits a `manaBonus` of 1 per pulse
  - LuminousSwarm on a non-Active cell: no mana bonus
  - `GameEngine.update()` adds the total `manaBonus` from creature effects to `ManaService`
  - Effects logged to console
- Tests:
  - StoneGiant transforms Active Mountain; skips Dormant Mountain
  - SeaSerpent transforms all orthogonal Active Meadow neighbors; ignores non-Meadow or non-Active
  - LuminousSwarm returns manaBonus=1 on Active cell; 0 otherwise
  - Multiple creatures contribute cumulative mana bonus
- Status: ✅

---

#### S4 — Creature visual actors with tween movement

- Depends on: S2, S3
- Files: `src/ui/creatures/creature.actor.ts` (new), `src/scenes/game.scene.ts`
- Acceptance:
  - `CreatureActor` is an Excalibur `Actor` positioned at the isometric tile center of its creature's cell
  - On `creatureSpawned`: a `CreatureActor` is created, placed at the spawn tile, and added to the scene
  - On `creatureMoved`: the `CreatureActor` tweens from old tile center to new tile center over `PULSE_INTERVAL` ms
  - On `creatureDespawned`: the `CreatureActor` is removed from the scene
  - `setComposedGraphic` no longer adds creature sprites to tiles (rendering responsibility transferred to actors)
  - Creature actors are layered above terrain and buildings visually
- Tests:
  - Playwright: creature sprite visible after spawn
  - Playwright: after a pulse with movement, creature appears at new cell position
- Status: ✅ (CreatureSpawnedPayload gained `id` field; creature tile sprites removed from setComposedGraphic; persistence-loaded creatures get actors at init)
