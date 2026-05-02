# Grill-Me Output — v0.22 Creature Spawning

**Date:** 2026-05-02  
**Milestone:** v0.22 — Creature Spawning

---

## Decisions

### 1. Scope: which creatures
Implement exactly **3 creatures**: Stone Giant, Sea Serpent, Luminous Swarm.  
Verdant Deer Herd and Sky Whale are deferred (post-v1.0).

### 2. Canonical creature names
Use the **sprite asset names** as canonical names, not the milestone placeholder names:

| Milestone name   | Canonical name   | Sprite key              |
|------------------|------------------|-------------------------|
| Stone Colossus   | Stone Giant      | `Sprites.creatureStoneGiant`    |
| Water Serpent    | Sea Serpent      | `Sprites.creatureSeaSerpent`    |
| Luminous Swarm   | Luminous Swarm   | `Sprites.creatureLuminousSwarm` |

### 3. Spawn conditions

All creatures share two universal conditions:
- The candidate cell must be in **Active** state.
- **No other creature of the same type** may exist anywhere on the map (one-per-type rule).

Per-creature habitat conditions:

| Creature       | Spawn cell terrain | Additional condition                              |
|----------------|--------------------|---------------------------------------------------|
| Stone Giant    | Mountain           | 2+ orthogonal neighbors are also Mountain terrain |
| Luminous Swarm | Sacred Grove       | (none beyond universal conditions)                |
| Sea Serpent    | Water              | (none beyond universal conditions)                |

Orthogonal = 4-directional (N, S, E, W only). Filter from `grid.getAdjacentCells()` within the service.

### 4. Spawn probability
**5% per pulse per creature type** when all conditions are met.  
Uses `Math.random() < 0.05` check. If false, no spawn that pulse — conditions re-evaluated next pulse.

### 5. Spawn cell selection
When multiple cells qualify, pick **one at random** from the list of qualifying Active cells.

### 6. Creature model
Replace the existing placeholder model. New `Creature` interface:

```typescript
export type CreatureType = 'StoneGiant' | 'SeaSerpent' | 'LuminousSwarm';

export interface Creature {
    id: string;
    type: CreatureType;
    x: number;
    y: number;
}
```

`health` and `maxHealth` are removed — no combat in this game.

### 7. Spawn logic location
Inside `CreaturesService` as `checkAndSpawn(grid: Grid): void`.  
Called by the game engine on every Divine Pulse, same pattern as `humans.update()`.

### 8. Event on spawn
`CreaturesService` extends `EventEmitter` and emits `creatureSpawned` with payload `{ x: number, y: number, type: CreatureType }`.  
The game scene subscribes and refreshes the affected tile, same pattern as `humanStatusChanged`.

### 9. Rendering layer order
Tile graphics stack order: **terrain → building → human → creature**.  
Creature sprite is added last in `addEntitySprites()` — above everything.

### 10. Persistence
Follow the same pattern as humans:
- `CreaturesService.toJSON()` → serializes creatures array.
- `CreaturesService.fromJSON(data, grid)` → static method, reconstructs the service.
- `PersistenceService.saveCreatures(creatures)` and `loadCreatures(grid)` → new methods, new storage key `edenManagerCreaturesState`.

### 11. Tests
Unit tests in `creatures.service.test.ts` covering:
- Stone Giant spawn condition (Mountain cell + 2 Mountain orthogonal neighbors).
- Luminous Swarm spawn condition (Sacred Grove cell).
- Sea Serpent spawn condition (Water cell).
- One-per-type guard: second creature of same type never spawns.
- Probability gate: mock `Math.random` to 0.01 (forces spawn) and 0.99 (prevents spawn).

---

## Files to create
- `src/core/creatures/creatures.service.test.ts`

## Files to update
- `src/core/creatures/creatures.model.ts` — replace with clean model + `CreatureType`
- `src/core/creatures/creatures.service.ts` — add `checkAndSpawn()`, `toJSON()`, `fromJSON()`, event emission
- `src/core/game-engine.service.ts` — call `creatures.checkAndSpawn(grid)` on pulse
- `src/persistence/persistence.service.ts` — add `saveCreatures()` / `loadCreatures()`
- `src/scenes/game.scene.ts` — subscribe to `creatureSpawned`, render creature sprite in `addEntitySprites()`
