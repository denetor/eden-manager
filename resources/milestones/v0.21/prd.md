# PRD — v0.21 Human Auto-Building

## Problem Statement

Human settlements are static. Once placed, they check their survival needs each pulse but never grow or change the landscape around them. The world feels passive: the player reshapes terrain, humans react with Active/Dormant status, but nothing builds up over time. There is no visible sign that humanity is flourishing beyond a colored dot on a cell.

## Solution

When an Active human group occupies a cell whose terrain and surroundings meet specific conditions, they autonomously construct a structure on that pulse. Structures are permanent markers on cells that replace the terrain sprite visually and generate passive mana each pulse — but only while the human on the cell remains Active. This creates a visible feedback loop: the player cultivates the right terrain, humans respond by building, and mana flows reward thoughtful placement.

Four structures are introduced: Farm, Mill, Shrine, and Tower, each with distinct terrain and adjacency requirements.

## User Stories

1. As a player, I want to see a Farm appear on a Fertile Plain cell when an Active human lives there near water, so that I can tell the settlement is thriving.
2. As a player, I want a Mill to appear on a Meadow or Fertile Plain cell adjacent to a Farm and near water, so that I can see the settlement expanding spatially.
3. As a player, I want a Shrine to appear on a Sacred Grove cell occupied by an Active human, so that I can see spiritual growth emerge from my forest arrangements.
4. As a player, I want a Tower to appear on a Foothill cell occupied by an Active human, so that I can see settlements take advantage of elevated terrain.
5. As a player, I want structures to persist on cells even if conditions later change, so that my world feels cumulative and my past decisions remain visible.
6. As a player, I want a structure to stop generating mana when the human on its cell becomes Dormant, so that I am motivated to keep human needs met.
7. As a player, I want a structure to resume generating mana when the human becomes Active again, so that recovering a struggling settlement is rewarding.
8. As a player, I want each cell to host at most one structure, so that the map remains readable and each cell has a clear identity.
9. As a player, I want structures to generate mana passively each Divine Pulse without any action from me, so that building up the world feels like a natural reward.
10. As a player, I want Farm to generate 2 mana per pulse, Mill 3, Shrine 3, and Tower 1, so that more complex or rarer arrangements yield more reward.
11. As a player, I want the tile of a cell with a structure to change its sprite to reflect the building type, so that I can read the state of the world at a glance.
12. As a player, I want the human sprite to remain visible above the structure sprite, so that I can always tell which cells are occupied.
13. As a player, I want building sprites to always appear in their active visual state, so that dormant sprites remain exclusively associated with cells not yet awakened.
14. As a player, I want the Mill to appear on a cell adjacent to the Farm (not on the Farm itself), so that settlements feel like they spread outward spatially.
15. As a player, I want structures to be saved when the game state is persisted, so that my built world survives a page reload.

## Implementation Decisions

### New module: Building Synergy Service
A new service, parallel in structure to the existing terrain synergy engine, is introduced in the synergy module. It is responsible for evaluating building conditions and writing the resulting building type onto the appropriate cell. It receives the Grid and HumansService as constructor dependencies. It exposes a single `apply()` method, called by the GameEngine during `divinePulse()` after the terrain synergy step.

### Building rules
The service evaluates all Active human groups each pulse. For each human, it checks the cell they occupy and applies the first matching rule:

| Rule | Cell terrain | Additional condition | Structure placed |
|------|-------------|----------------------|-----------------|
| Farm | Fertile Plain | Active Water terrain within Chebyshev radius 3 | Farm on human's cell |
| Mill | Meadow or Fertile Plain | Farm on an orthogonally adjacent cell (4 directions, no diagonal) + Active Water within radius 3 | Mill on human's cell |
| Shrine | Sacred Grove | — | Shrine on human's cell |
| Tower | Foothill | — | Tower on human's cell |

A cell is only modified if it does not already have a building. Structures are permanent: no rule removes or degrades a built structure.

### BuildingType
A new union type `BuildingType = 'Farm' | 'Mill' | 'Shrine' | 'Tower'` is defined in a dedicated model file in the synergy module. A companion `BUILDING_MANA_YIELD` record maps each type to its mana value.

### Cell model extension
The `Cell` interface gains an optional field `building?: BuildingType`. This field is `undefined` for cells with no structure. The Grid service gains a `setBuilding(x, y, building)` method that writes the field onto the cell.

### Mana collection
The GameEngine gains a `collectBuildingsMana()` method, called immediately after `collectTerrainMana()` in `divinePulse()`. It iterates all cells that have a `building` field, checks whether an Active human occupies that cell, and if so adds the building's mana yield to the ManaService.

### Serialization
Because `building` is a field on the `Cell` object, it is included automatically when the Grid serializes to JSON. No special handling is required. Legacy saves without the field will deserialize `building` as `undefined` (no structure), which is the correct default.

### Visual rendering
When a cell has a `building` field, the tile renderer substitutes the building sprite for the terrain sprite. Building sprites always use their active variant regardless of the human's status — dormant sprites are reserved for cells in Veiled or Dormant state. The human actor renders as a separate layer above the tile and is unaffected by this change.

### Sprite mapping
| BuildingType | Active sprite key | Dormant sprite key |
|---|---|---|
| Farm | `farm` | `farmDormant` |
| Mill | `mill` | `millDormant` |
| Shrine | `shrine` | `shrineDormant` |
| Tower | `tower` | `towerDormant` |

The sprite keys `shrine` and `shrineDormant` in `resources.ts` reference the existing PNG files previously named after "temple". No PNG files are renamed.

### GameEngine integration
The GameEngine receives the new Building Synergy Service as a constructor parameter. The `divinePulse()` sequence becomes:
1. Terrain synergy apply
2. Building synergy apply ← new
3. Human necessity update
4. Creature update
5. Terrain mana collection
6. Building mana collection ← new
7. Mana regeneration
8. Clear dirty flags

## Testing Decisions

**What makes a good test:** tests assert observable outputs (return values, state changes on public interfaces, emitted events) given controlled inputs. They do not inspect private methods or internal data structures. Each test sets up the minimum grid state needed to exercise one rule.

**Prior art:** `HumansService` tests in `src/core/humans/humans.service.test.ts` demonstrate the pattern: construct a real `Grid`, call service methods, assert on public getters. The same approach applies here.

### BuildingSynergyService tests
- Farm is placed when conditions are met (Fertile Plain + Active human + Water within radius 3)
- Farm is not placed when water is absent
- Farm is not placed when the human on the cell is Dormant
- Farm is not placed when cell terrain is not Fertile Plain
- Mill is placed when conditions are met (Meadow + Active human + Farm on orthogonal neighbor + Water within radius 3)
- Mill is placed on Fertile Plain (not only Meadow)
- Mill is not placed when no Farm is orthogonally adjacent
- Mill is not placed when Farm is diagonally adjacent (not orthogonal)
- Shrine is placed on Sacred Grove with Active human
- Tower is placed on Foothill with Active human
- A cell with an existing building is not overwritten
- A cell with no human is not modified

### GameEngine.collectBuildingsMana tests
- Mana is added for each cell with a building and an Active human
- No mana is added for a cell with a building but a Dormant human
- No mana is added for a cell with no building
- Correct mana yield is applied per building type (Farm=2, Mill=3, Shrine=3, Tower=1)

### Grid.setBuilding tests
- Setting a building on a cell stores the value retrievable via `getCell()`
- Setting `undefined` clears the building field
- Setting building on out-of-bounds coordinates has no effect

### Serialization tests (Grid toJSON/fromJSON)
- A cell with a building serializes and deserializes correctly
- A legacy serialized cell without a building field deserializes with `building: undefined`

## Out of Scope

- Grand Temple (Sacred Grove + Sacred Grove → Sanctuary) — future milestone
- Building degradation or demolition — structures are permanent in this version
- Buildings on cells not occupied by a human — all building rules require human presence
- Human movement or migration to build on a different cell — humans are stationary
- Desire icons or Memory Fragments triggered by building events — future milestones (v0.30–v0.31)
- Sound effects for building construction — future milestone (v0.35)
- Particle or animation effects on building placement — future milestone (v0.36)
- UI display of building mana breakdown in the HUD
- Multiple humans per cell

## Further Notes

- "Plain" in design language maps to `Meadow` terrain type in code. No new terrain type is introduced.
- "Shrine" is the canonical name in code and GDD. The underlying PNG asset retains its original filename; only the TypeScript sprite key was renamed from `temple` to `shrine`.
- The Mill rule explicitly requires orthogonal adjacency (4 directions) to the Farm, not diagonal. This is enforced in the building synergy service using the Grid's orthogonal neighbor lookup.
- Building mana generation and terrain mana generation are separate collection steps, both in GameEngine, to keep responsibilities clear and allow independent tuning.
