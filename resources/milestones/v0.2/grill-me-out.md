# v0.2 Grill-Me Interview — Final Decisions

**Date:** 2026-04-16  
**Milestone:** v0.2 — Isometric Coordinate System & IsometricMap Integration  
**Goal:** Implement isometric rendering with coordinate abstraction and camera controls using Excalibur's IsometricMap API

---

## Decisions Summary

### 1. **CoordinateSystem Abstraction** ✅
- **Decision:** Thin wrapper around IsometricMap's coordinate methods
- **Why:** Minimal indirection, future-proof for perspective swaps (v1.1+)
- **Implementation:** CoordinateSystem interface delegates to IsometricMap's `worldToTile()` and `tileToWorld()`

### 2. **Camera Management** ✅
- **Decision:** CameraController service owns all pan/zoom logic
- **Why:** Clean separation, reusable across scenes, testable
- **Scope:** CameraController validates bounds internally; GameScene calls it on input events

### 3. **Camera Bounds** ✅
- **Decision:** Camera center stays within map bounds (black bars acceptable at edges)
- **Validation:** CameraController enforces internally
- **Why:** Simpler than forcing entire map visible; enables exploration via pan/zoom

### 4. **IsometricTile Graphics** ✅
- **Decision:** Use IsometricTile's native `addGraphic()` API with custom graphics
- **Why:** More isometric-native than generic approach
- **Method:** Add Rectangle graphic to each IsometricTile (same pattern as TileMap)

### 5. **Cell State Visualization** ✅
- **Cell states:** Veiled (gray, 0.3 opacity) → Dormant (desaturated) → Active (full color, 1.0)
- **Color tracking:** GameEngine/Grid tracks state-based colors
- **Graphics updates:** Recreate tile graphics when state changes (`clearGraphics()` → `addGraphic()`)
- **Why:** Guarantees visual correctness; GameEngine is authoritative source of cell state

### 6. **HighlightedCell Positioning** ✅
- **Decision:** HighlightedCell receives CoordinateSystem reference
- **Implementation:** `highlightedCell.updateSelection(x, y, coordinateSystem)`
- **Why:** HighlightedCell depends on abstraction, not concrete IsometricMap

### 7. **Input Handling — Click-to-Select** ✅
- **Decision:** Update `GameScene.screenToGridCoordinates()` to use CoordinateSystem
- **Method:** Call `coordinateSystem.worldToTile()` internally
- **Why:** Single responsibility; semantic meaning unchanged (screen → grid)

### 8. **Pointer Events** ✅
- **Decision:** Use IsometricMap's pointer component with `getTileByPoint()`
- **Implementation:**
  ```typescript
  isometricMap.pointer.on('down', (evt) => {
    const tile = isometricMap.getTileByPoint(evt.pos);
    if (tile) this.selectCell(tile.x, tile.y);
  })
  ```
- **Why:** Idiomatic Excalibur pattern; leverages built-in API

### 9. **Camera Input Controls** ✅
- **Pan:** Support both Arrow keys AND WASD
- **Zoom:** Support both mouse wheel AND +/- keys (1.0x to 2.0x range)
- **Speeds:** Hardcoded constants in CameraController
- **Why:** Accessibility (player preference); hardcoding keeps v0.2 simple

### 10. **Tile Dimensions** ✅
- **Width × Height:** 32px × 64px (isometric proportions)
- **Location:** Define as shared constants in `src/shared/constants.ts`
  ```typescript
  export const TILE_WIDTH = 32;
  export const TILE_HEIGHT = 64;
  ```
- **Why:** Reusable across CoordinateSystem, CameraController, HighlightedCell, etc.

### 11. **GridBackground** ✅
- **Decision:** Defer to v0.8 (Cell State Visualization)
- **Why:** Scope control; IsometricMap coordinate system is primary focus of v0.2

### 12. **CellInfo HUD Positioning** ✅
- **Decision:** Keep at fixed screen position (top-left corner)
- **Why:** CellInfo is HUD, not world-space; independent of camera pan/zoom

### 13. **TileMap Renderer Service** ✅
- **Decision:** Remove TileMapRenderer entirely
- **Why:** IsometricMap is self-contained actor; GameScene can update tiles directly via `isometricMap.getTile(x, y)`
- **Impact:** GameScene handles tile state updates after GameEngine changes

### 14. **Viewport Dimensions** ✅
- **Decision:** Keep 800×600 logical pixels
- **Math:** 16×16 isometric grid requires 512×1024px exactly; 800×600 allows camera pan/zoom for exploration
- **Why:** Game benefits from camera controls; forces player engagement with navigation

### 15. **CoordinateSystem Interface** ✅
- **Method signatures:** Use Vector objects (Excalibur-native)
  ```typescript
  interface CoordinateSystem {
    worldToTile(worldPos: Vector): Vector;
    tileToWorld(tilePos: Vector): Vector;
  }
  ```
- **Implementations in v0.2:** Only IsometricCoordinateSystem
- **TopDownCoordinateSystem:** Deferred to v1.1 when swapping perspectives

### 16. **File Creation Order** ✅
**Dependency graph (no circular references):**
1. `src/shared/constants.ts` — TILE_WIDTH, TILE_HEIGHT (no deps)
2. `src/graphics/coordinate-system.ts` — Interface only (no deps)
3. `src/graphics/isometric-coordinate-system.ts` — Depends on coordinate-system.ts + IsometricMap
4. `src/input/camera-controller.ts` — Depends on constants.ts, uses Engine.camera
5. `src/scenes/game.scene.ts` — Integrates all above (last)

### 17. **Testing & Verification** ✅
- **Decision:** Manual verification (console logging + visual inspection)
- **Why:** v0.2 is foundational; IsometricMap rendering itself is the proof
- **Playwright tests:** Defer to v0.3+ when gameplay mechanics added
- **Verification checklist:**
  - Launch game; see 16×16 isometric grid (35° angle)
  - Click cells; selection highlight appears correctly
  - Pan with Arrow/WASD; camera moves smoothly
  - Zoom with mouse wheel/+−; zoom range 1.0x to 2.0x works
  - Console: verify `coordinateSystem.worldToTile()` and `tileToWorld()` transforms

### 18. **Camera & Coordinate Transforms** ✅
- **Camera zoom + click detection:** Excalibur handles camera transforms automatically
  - Input event coordinates are already in world space
  - No manual adjustment needed in GameScene
- **Tile coordinate rounding:** Use `Math.floor()` (standard grid rounding)

---

## Files to Create

1. **`src/shared/constants.ts`**
   - `TILE_WIDTH = 32`
   - `TILE_HEIGHT = 64`

2. **`src/graphics/coordinate-system.ts`**
   - `CoordinateSystem` interface (Vector-based)
   - Two methods: `worldToTile()`, `tileToWorld()`

3. **`src/graphics/isometric-coordinate-system.ts`**
   - `IsometricCoordinateSystem` implements `CoordinateSystem`
   - Wraps IsometricMap's methods
   - Handles camera offset internally

4. **`src/input/camera-controller.ts`**
   - Pan with Arrow keys & WASD
   - Zoom with mouse wheel & +/- keys
   - Bounds validation (camera stays within map)
   - Hardcoded speeds (pan & zoom rate constants)

## Files to Update

1. **`src/scenes/game.scene.ts`**
   - Replace `TileMap` with `IsometricMap`
   - Initialize with TILE_WIDTH=32, TILE_HEIGHT=64
   - Update `screenToGridCoordinates()` to use CoordinateSystem
   - Use IsometricMap pointer events for click-to-select
   - Integrate CameraController for pan/zoom
   - Update tile graphics on cell state changes

2. **`src/ui/grid/highlighted-cell.ts`**
   - Accept CoordinateSystem reference in constructor
   - Update `updateSelection(x, y, coordinateSystem)` method
   - Use `coordinateSystem.tileToWorld()` for positioning

3. **`src/main.ts`**
   - No viewport changes (keep 800×600)
   - Verify pixel art mode and display settings remain

## Key Implementation Notes

- **IsometricMap replaces TileMap entirely** — no coexistence
- **CoordinateSystem is thin wrapper** — delegates to IsometricMap's native methods
- **GameEngine/Grid is state authority** — color calculations happen there
- **GameScene handles tile updates directly** — no intermediate renderer service
- **CameraController is self-contained** — validates bounds, manages pan/zoom speeds
- **Input coordinates are world-space** — Excalibur handles camera transform automatically
- **Tile coordinates rounded with Math.floor()** — standard grid behavior

---

## Verification Checklist

- [ ] IsometricMap renders 16×16 grid in isometric (35° angle)
- [ ] Click on cells in isometric view; HighlightedCell selection moves correctly
- [ ] Pan with Arrow keys; camera moves smoothly (WASD also works)
- [ ] Zoom with mouse wheel; zoom range 1.0x to 2.0x functional (+/- keys also work)
- [ ] Camera bounds: center never leaves map (black bars at edges acceptable)
- [ ] Console: `coordinateSystem.worldToTile()` and `tileToWorld()` transforms verified
- [ ] Cell state changes reflect visually (Veiled/Dormant/Active colors)
- [ ] HighlightedCell positioned correctly in isometric space

---

## Complexity Estimate

**High** — Requires:
- Understanding Excalibur's IsometricMap API deeply
- Isometric coordinate math (35° angle, 32×64 tiles)
- Camera system integration (pan, zoom, bounds validation)
- Input handling refactoring (screen → world → tile conversion)
- Tile graphics lifecycle management

**Estimated effort:** 3–4 days (for experienced developer)

---

**Document:** grill-me-out.md  
**Status:** ✅ Interview Complete — Ready for Implementation Planning  
**Next Step:** Create PRD (resources/milestones/v0.2/prd.md) with detailed requirements
