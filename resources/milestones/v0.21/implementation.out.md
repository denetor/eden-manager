# Implementation Output — v0.21 Human Auto-Building

## Files Created

### `src/core/synergy/building-synergy.model.ts`
Defines `BuildingType = 'Farm' | 'Mill' | 'Shrine' | 'Tower'` and `BUILDING_MANA_YIELD` record (Farm=2, Mill=3, Shrine=3, Tower=1).

### `src/core/synergy/building-synergy.service.ts`
New service following the same pattern as `SynergyEngine`. Constructor receives `Grid` and `HumansService`. Method `apply()` iterates all Active humans, calls `checkBuildingRules()` on each, and writes the result via `grid.setBuilding()`.

Building rules (priority order):
1. Fertile Plain + Active Water within radius 3 → Farm
2. Meadow or Fertile Plain + Active Water within radius 3 + Farm on orthogonal neighbor → Mill
3. Sacred Grove → Shrine
4. Foothill → Tower

Cells with an existing building are skipped (permanent structures).

### `src/core/synergy/building-synergy.service.test.ts`
20 tests covering all 4 building rules, dormant human behavior, priority ordering, and the "no overwrite" invariant.

## Files Modified

### `src/core/grid/grid.model.ts`
Added `building?: BuildingType` to the `Cell` interface. Added `import` for `BuildingType` from `building-synergy.model`.

### `src/core/grid/grid.service.ts`
- Added `import` for `BuildingType`.
- Added `setBuilding(x, y, building)` method: sets `cell.building`, marks cell dirty, emits `cellChanged` so the renderer auto-updates.
- Updated `fromJSON()` to restore `cell.building` from serialized data (undefined for legacy saves — correct default).

### `src/core/game-engine.service.ts`
- Added `BuildingSynergyService` import and field.
- Constructor now takes `BuildingSynergyService` as third parameter (after `SynergyEngine`).
- `divinePulse()` sequence updated: terrain synergy → **building synergy** → humans → creatures → terrain mana → **building mana** → regenerate → clear dirty.
- Added `collectBuildingsMana()`: iterates cells with `building` set, checks for Active human on same cell, sums `BUILDING_MANA_YIELD[cell.building]`.

### `src/core/game-engine.service.test.ts`
Updated `beforeEach` and one inline `GameEngine` instantiation to pass `BuildingSynergyService` as third constructor argument.

### `src/scenes/game.scene.ts`
- Added imports for `BuildingSynergyService` and `BuildingType`.
- `onInitialize()`: instantiates `BuildingSynergyService(grid, humans)` and passes it to `GameEngine`.
- `setComposedGraphic()`: when `cell.state === 'Active' && cell.building`, uses `getBuildingSprite(cell.building)` instead of terrain sprite.
- Added `getBuildingSprite(building: BuildingType)`: returns the correct `Sprites.*` entry for each building type.

### `src/resources.ts`
Renamed `temple`/`templeDormant` sprite keys to `shrine`/`shrineDormant` (canonical name). The underlying PNG files are unchanged. Updated the dormant tint assignment accordingly.

## Test Results

| Suite | Status | Notes |
|-------|--------|-------|
| `building-synergy.service.test.ts` | **20/20 PASS** | New suite |
| `grid.service.test.ts` | PASS | Unchanged |
| `humans.service.test.ts` | PASS | Unchanged |
| `game-engine.service.test.ts` | 74 pass / 4 fail | 4 pre-existing failures (cells not awakened before synergy check — unrelated to this milestone) |
| `tilemap-renderer.service.test.ts` | Pre-existing failure | `window is not defined` in test env |
| `game.scene.test.ts` | Pre-existing failure | `window is not defined` in test env |
| `persistence.service.test.ts` | Pre-existing failure | TypeScript type errors in test file |
| `synergy.service.test.ts` | Pre-existing failure | Tests check cells not set to Active state |

## Design Decisions Applied

- Building state lives on `Cell.building` (optional field).
- One building per cell; existing buildings are never overwritten.
- Buildings are permanent: no demolition logic.
- Mana generated only when human on cell is Active.
- Building sprite replaces terrain sprite on Active cells with a building (full substitution, no overlay).
- Human sprite renders above building sprite (unchanged layer order).
- Building sprites always show active variant (dormant sprites reserved for Veiled/Dormant cells).
- `building` field serialized automatically via existing `grid.toJSON()` / `grid.fromJSON()`.
