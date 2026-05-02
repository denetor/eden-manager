# PRD — v0.22: Creature Spawning

**Date:** 2026-05-02  
**Status:** Ready for implementation

---

## Problem Statement

The world of Eden Manager currently has no legendary creatures. Players can awaken terrain, build human settlements, and trigger synergies, but the living world feels incomplete without the autonomous entities described in the GDD. Creatures are meant to act as "catalysts of beauty" — emergent, environmental presences that reward thoughtful terrain construction. Without them, one of the core emotional pillars of the game (discovery, wonder, ecosystem dynamics) is missing.

---

## Solution

Implement creature spawning logic for the three v1.0 creatures: **Stone Giant**, **Sea Serpent**, and **Luminous Swarm**. Each creature type spawns automatically when its habitat conditions are met, appears as a sprite overlaid on its cell, and persists across page reloads. At most one creature of each type may exist on the map at any time. Spawning is probabilistic (5% per pulse) to preserve the sense of rare, emergent discovery.

---

## User Stories

1. As a player, I want the Stone Giant to appear on a mountain landscape I have carefully built, so that I feel rewarded for creating a dense mountain region.
2. As a player, I want the Sea Serpent to emerge from water terrain I have unveiled and awakened, so that I discover a natural consequence of building a river system.
3. As a player, I want the Luminous Swarm to appear in a Sacred Grove I created through Forest synergies, so that the grove feels like a truly magical place.
4. As a player, I want creatures to appear rarely and unpredictably (not immediately when conditions are met), so that each sighting feels like a genuine discovery.
5. As a player, I want each creature type to be unique on the map (only one of each), so that encounters feel special rather than routine.
6. As a player, I want to see the creature's sprite directly on its cell in the isometric view, so that I can locate it at a glance without consulting any HUD.
7. As a player, I want the creature sprite to be visible above all other cell graphics (terrain, buildings, humans), so that creatures are never obscured.
8. As a player, I want creatures to still be present after I reload the page, so that a creature I discovered in a previous session is not lost.
9. As a player, I want the Stone Giant to only spawn on mountain terrain surrounded by other mountains, so that it feels organically tied to a dense mountain biome.
10. As a player, I want the Sea Serpent to only spawn on active water cells, so that it feels like a natural inhabitant of water terrain.
11. As a player, I want the Luminous Swarm to only spawn on active Sacred Grove cells, so that it reinforces the spiritual significance of Sacred Groves.
12. As a player, I want a creature's spawn to only be possible on active (fully awakened) cells, so that dormant terrain does not attract legendary entities.
13. As a player, I want creature spawning to be checked automatically on every Divine Pulse, so that I don't need to trigger it manually.

---

## Implementation Decisions

### Creature model
The `Creature` interface is redesigned to remove placeholder fields (`health`, `maxHealth`) that have no meaning in a combat-free game. The new model contains only: `id` (unique string), `type` (`CreatureType` enum: `StoneGiant | SeaSerpent | LuminousSwarm`), `x` (grid column), `y` (grid row).

### Spawn conditions
All three spawn conditions share universal prerequisites:
- The candidate cell must be in **Active** state.
- No other creature of the same type may already exist anywhere on the map.

Per-creature habitat requirements:

| Creature       | Cell terrain | Additional requirement                              |
|----------------|--------------|-----------------------------------------------------|
| Stone Giant    | Mountain     | At least 2 orthogonal neighbors are Mountain terrain |
| Sea Serpent    | Water        | None                                                |
| Luminous Swarm | Sacred Grove | None                                                |

Orthogonal means 4-directional (N, S, E, W) only.

### Spawn probability and cell selection
Each Divine Pulse, for each creature type whose conditions are unmet (or already present), nothing happens. For a creature type that is absent and has one or more qualifying cells: a single random check at **5% probability** determines whether a spawn occurs. If it succeeds, one qualifying cell is chosen **at random** as the spawn location.

### CreaturesService responsibilities
`CreaturesService` handles all creature state and spawning logic. It extends `EventEmitter` (same base class as `HumansService`) and gains:
- `checkAndSpawn(grid)` — evaluates all three creature types each pulse and spawns as appropriate. Called by the game engine inside `divinePulse()`.
- `creatureSpawned` event emitted with `{ x, y, type }` payload when a creature appears.
- `toJSON()` and `fromJSON(data, grid)` for persistence.

The existing `update()` method on `CreaturesService` is the hook called by the game engine. It will internally call `checkAndSpawn`.

### Game engine integration
`GameEngine.divinePulse()` already calls `creatures.update()`. No change to the engine's public interface is needed; the spawn logic runs inside that call.

### Rendering
Creature sprites are added in the scene's entity overlay method, **after** human sprites, so creatures render above terrain, buildings, and humans. The scene subscribes to `creatureSpawned` and refreshes the affected tile, following the same pattern used for `humanStatusChanged`.

Sprite mapping:
- Stone Giant → `Sprites.creatureStoneGiant`
- Sea Serpent → `Sprites.creatureSeaSerpent`
- Luminous Swarm → `Sprites.creatureLuminousSwarm`

Sprites already exist in `resources.ts`; no new assets are needed.

### Persistence
`PersistenceService` gains `saveCreatures(creatures)` and `loadCreatures(grid)` methods, using a new localStorage key `edenManagerCreaturesState`. `CreaturesService` gains `toJSON()` / `fromJSON(data, grid)` following the identical pattern established by `HumansService`. The scene saves creatures after each pulse alongside the grid and humans.

---

## Testing Decisions

**What makes a good test:** Tests assert observable behavior through the public interface only — method return values and emitted events. They do not inspect private state or implementation details. Probability is controlled by mocking `Math.random`.

**Module under test:** `CreaturesService`

**Test cases:**
- Stone Giant does not spawn when the cell is not Mountain terrain.
- Stone Giant does not spawn when the Mountain cell has fewer than 2 orthogonal Mountain neighbors.
- Stone Giant does not spawn when the cell is Mountain with 2+ Mountain neighbors but is Dormant (not Active).
- Stone Giant spawns when all conditions are met and `Math.random` returns a value below 0.05.
- Stone Giant does not spawn when all conditions are met but `Math.random` returns a value at or above 0.05.
- A second Stone Giant does not spawn when one already exists, even if conditions are met and `Math.random` returns 0.01.
- Sea Serpent spawns on an Active Water cell (same probability tests).
- Luminous Swarm spawns on an Active Sacred Grove cell (same probability tests).
- `creatureSpawned` event is emitted with the correct `{ x, y, type }` payload on spawn.
- `toJSON()` serializes all current creatures; `fromJSON()` reconstructs the same set.

**Prior art:** `src/core/humans/humans.service.test.ts` — same test structure, same grid setup pattern.

---

## Out of Scope

- **Creature movement** — creatures remain stationary after spawning (implemented in v0.23).
- **Creature effects** — no terrain transformations or mana bonuses triggered by creatures (implemented in v0.23).
- **Sky Whale and Verdant Deer Herd** — deferred to post-v1.0.
- **Creature removal** — no mechanism to despawn or relocate a creature in v0.22.
- **Creature UI details** — no tooltip, info panel, or HUD entry for creatures; the sprite on the tile is the only feedback.
- **Console notifications** — no special milestone notification on first creature sighting (can be added in a polish pass).

---

## Further Notes

- The milestone description uses "Stone Colossus" and "Water Serpent" as placeholder names. The canonical names (matching sprite assets) are **Stone Giant** and **Sea Serpent**.
- The 5% spawn probability was chosen to keep creatures feeling rare. If playtesting shows they are too rare or too common, this constant should be easy to tune since it will be a named constant in the service.
- Creature positions overlap with human positions intentionally — a human and a creature can share a cell; the creature sprite renders above.
