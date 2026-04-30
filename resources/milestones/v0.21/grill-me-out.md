# Grill-Me Out — v0.21 Human Auto-Building

Date: 2026-04-30

---

## Decisions

### 1. Where does building state live?
**Decision:** On the `Cell` model, as an optional field `building?: BuildingType`.

Building state belongs to the cell, not to the human group. Simplifies rendering (each cell knows its own sprite), mana calculation (already iterates cells on pulse), and serialization.

---

### 2. One structure per cell
**Decision:** Maximum one building per cell.

If multiple building conditions are satisfied simultaneously, a fixed priority order resolves the conflict (defined in `BuildingSynergyService` rule order). No stacking of structures on the same cell.

---

### 3. Building types for v0.21
**Decision:** Farm, Mill, Shrine, Tower.

| Building | Trigger Terrain | Condition | Mana/Pulse |
|----------|-----------------|-----------|------------|
| Farm     | Fertile Plain   | Human present + Water within 3 cells (Chebyshev) | 2 |
| Mill     | Meadow or Fertile Plain | Human present + Farm on orthogonally adjacent cell + Water within 3 cells | 3 |
| Shrine   | Sacred Grove    | Human present | 3 |
| Tower    | Foothill        | Human present | 1 |

"Plain" in design notes = `Meadow` terrain type in code. No new `TerrainType` needed.

"Adjacent Farm" = one of the 4 orthogonal directions only (no diagonals).

---

### 4. Building check scope
**Decision:** The building is always placed on the cell occupied by the human group.

No pathfinding, no target selection on neighboring cells. The human "is" on the cell and transforms it.

---

### 5. Mill is a separate building, not an upgrade of Farm
**Decision:** Mill is placed on a *different* cell than Farm.

A Mill cell (Meadow or Fertile Plain) must have a Farm on an orthogonally adjacent cell. The Farm cell itself is never converted to Mill. This creates spatial progression: Farm first, then Mill next to it.

---

### 6. Structures are permanent
**Decision:** Once built, a structure is never demolished or degraded.

If the conditions that triggered its construction are later removed (e.g., water cell goes Dormant), the structure remains on the cell. It simply stops generating mana if the human becomes Dormant.

---

### 7. Mana generation condition
**Decision:** A structure generates mana only when the human group on its cell is Active.

If the human is Dormant (needs unmet), the structure is silent. Consistent with GDD: "Dormancy — they stop building and stop generating mana."

---

### 8. Building logic location
**Decision:** New `BuildingSynergyService` in `src/core/synergy/`.

Building rules are structurally identical to terrain synergies (pattern → transformation). Keeping them in the same module is coherent. `HumansService` is not bloated with building logic.

---

### 9. Dependency injection
**Decision:** `BuildingSynergyService` receives `Grid` and `HumansService` in the constructor.

Follows the same pattern as `HumansService(grid)` and `SynergyEngine(grid)`. The `GameEngine` calls `buildingSynergy.apply()` in `divinePulse()`.

---

### 10. How the cell is updated
**Decision:** `BuildingSynergyService` calls `grid.setBuilding(x, y, building)` — a new method to add to `Grid`.

Analogous to `grid.reshape()` for terrain changes.

---

### 11. Mana from buildings in GameEngine
**Decision:** New `collectBuildingsMana()` method in `GameEngine`, called after `collectTerrainMana()` in `divinePulse()`.

Iterates all Active cells that have a `building` and an Active human on the same cell. Adds the building's mana yield to `ManaService`.

---

### 12. Visual rendering — sprite substitution
**Decision:** When `cell.building` is set, the building sprite **replaces** the terrain sprite entirely.

No multi-layer compositing needed. Building sprites (e.g., `floor-farm-01.png`) represent the structure integrated into the terrain. The human sprite continues to render as a separate layer above the cell.

---

### 13. Canonical building name: Shrine (not Temple)
**Decision:** `BuildingType` uses `'Shrine'`. The sprite keys in `resources.ts` have been renamed from `temple`/`templeDormant` to `shrine`/`shrineDormant`.

The PNG files (`floor-temle-01.png`, `floor-temple-01-dormant.png`) are not renamed — only the TypeScript keys.

---

### 14. Dormant sprite convention
**Decision:** Building sprites always show their **active** variant, regardless of the human's status.

Dormant sprites (grayed-out) are reserved exclusively for cells in Veiled or Dormant state (not yet awakened by the player). When a human is Dormant, the human sprite switches to `humanDormant`, but the building tile remains visually active.

---

### 15. Serialization
**Decision:** `building` is serialized as part of the `Cell` in `grid.toJSON()` / `grid.fromJSON()`.

Since `building` is a field on the `Cell` object, it is included automatically when the cell is serialized. No special handling needed.

---

## Files to Create / Modify

| Action | File | Change |
|--------|------|--------|
| Create | `src/core/synergy/building-synergy.service.ts` | New `BuildingSynergyService` with Farm, Mill, Shrine, Tower rules |
| Create | `src/core/synergy/building-synergy.model.ts` | `BuildingType` union type and `BUILDING_MANA_YIELD` table |
| Modify | `src/core/grid/grid.model.ts` | Add `building?: BuildingType` to `Cell` interface |
| Modify | `src/core/grid/grid.service.ts` | Add `setBuilding(x, y, building)` method |
| Modify | `src/core/game-engine.service.ts` | Add `BuildingSynergyService` dependency; add `collectBuildingsMana()`; call both in `divinePulse()` |
| Modified | `src/resources.ts` | Renamed `temple`/`templeDormant` → `shrine`/`shrineDormant` |
| Modified | `resources/gdd.md` | Updated synergy table, building rules table, mana generation section |
