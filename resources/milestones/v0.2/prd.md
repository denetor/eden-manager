# v0.2 PRD — Isometric Coordinate System & IsometricMap Integration

**Version:** 1.0  
**Date:** 2026-04-16  
**Milestone:** v0.2  
**Status:** Ready for Implementation

---

## Problem Statement

The Eden Manager game currently renders the world in orthogonal (top-down) perspective using Excalibur's `TileMap` component. While functional for prototyping, this lacks visual depth and strategic clarity. The game design calls for **isometric perspective** (35° angle, 2:1 height-to-width ratio) to:

1. **Provide visual depth and appeal** — isometric perspective naturally conveys elevation, slope, and spatial relationships better than top-down
2. **Enable world exploration** — an isometric world at 800×600px viewport requires camera pan/zoom to explore a 16×16 grid, creating player engagement through navigation
3. **Future-proof perspective swaps** — the game should support both isometric and top-down views as post-launch features (v1.1+), requiring coordinate system abstraction
4. **Leverage Excalibur's IsometricMap** — Excalibur.js provides native `IsometricMap` with built-in coordinate transforms; custom math should be avoided

The current implementation lacks:
- **CoordinateSystem abstraction** — raw screen-to-grid math ties rendering to gameplay logic
- **Camera control system** — no pan/zoom capabilities
- **Isometric-aware graphics** — tile graphics are axis-aligned squares, not isometric diamonds
- **Input handling for isometric space** — click detection doesn't account for isometric geometry

---

## Solution

Implement **isometric rendering with coordinate abstraction and camera controls** using Excalibur's `IsometricMap` API:

1. **Replace `TileMap` with `IsometricMap`**
   - Use Excalibur's native isometric tile grid (32×64 px per tile)
   - Tiles automatically render as isometric diamonds with correct projection
   - Delegate all coordinate transforms to IsometricMap's `worldToTile()` and `tileToWorld()` methods

2. **Create CoordinateSystem abstraction**
   - Thin wrapper interface over IsometricMap's transform methods
   - Enables future perspective swaps (top-down in v1.1) without refactoring game logic
   - Only implementation in v0.2: `IsometricCoordinateSystem`

3. **Implement CameraController service**
   - Manages pan (Arrow/WASD keys) and zoom (mouse wheel/+- keys)
   - Enforces bounds validation (camera center stays within map bounds)
   - Hardcoded speed constants (v0.2 simplicity; configurable in v1.0+)

4. **Update input handling**
   - Use IsometricMap's `pointer` component with `getTileByPoint()` for click detection
   - Excalibur handles camera transforms automatically; input coordinates already in world space
   - Update `GameScene.screenToGridCoordinates()` to delegate to `CoordinateSystem.worldToTile()`

5. **Support cell state visualization**
   - GameEngine/Grid tracks cell colors based on state (Veiled/Dormant/Active)
   - Recreate tile graphics on state change (`clearGraphics()` → `addGraphic()`)
   - Guarantees visual correctness even with dynamic state updates

---

## User Stories

1. As a **player**, I want to see the game world in isometric perspective, so that it has visual depth and better conveys spatial relationships

2. As a **player**, I want to pan the camera using Arrow keys, so that I can explore areas beyond the viewport without keyboard rebinding

3. As a **player**, I want to pan the camera using WASD keys, so that I can explore areas using my preferred movement scheme

4. As a **player**, I want to zoom in/out using the mouse wheel, so that I can focus on specific areas or see the entire map

5. As a **player**, I want to zoom in/out using +/- keyboard keys, so that I can zoom without relying on a mouse

6. As a **player**, I want the zoom range to be between 1.0x (full map visible at edges) and 2.0x (2× magnification), so that exploration remains navigable

7. As a **player**, I want the camera to smoothly pan when I hold movement keys, so that navigation feels responsive and fluid

8. As a **player**, I want the camera to stay within map bounds (showing black bars at edges if needed), so that I never see void or out-of-world areas

9. As a **player**, I want to click on cells in the isometric view, so that cell selection works correctly despite the 35° perspective

10. As a **player**, I want the selected cell highlight to follow my click in isometric space, so that visual feedback matches my input

11. As a **player**, I want cell state changes (Veiled → Dormant → Active) to be reflected visually, so that I see terrain transitions dynamically

12. As a **player**, I want terrain colors to match the game design (Forest green, Water blue, Mountain gray), so that the world is visually coherent

13. As a **player**, I want veiled cells to appear desaturated/gray with reduced opacity, so that I can distinguish unknown terrain

14. As a **developer**, I want a `CoordinateSystem` interface that abstracts coordinate transforms, so that we can swap perspectives (top-down in v1.1) without refactoring gameplay code

15. As a **developer**, I want coordinate transforms to use Vector objects (Excalibur-native), so that I leverage standard library types and avoid custom math

16. As a **developer**, I want `CoordinateSystem` to be thin and delegate to IsometricMap's native methods, so that I avoid reimplementing isometric math

17. As a **developer**, I want a `CameraController` service that encapsulates all pan/zoom logic, so that camera control is reusable and testable

18. As a **developer**, I want bounds validation to happen inside `CameraController`, so that GameScene doesn't need to know about map constraints

19. As a **developer**, I want tile dimensions (32×64) to be shared constants, so that they can be reused across coordinate transforms, camera logic, and UI actors

20. As a **developer**, I want IsometricMap's pointer component to handle click detection natively, so that I leverage Excalibur's built-in API instead of custom raycasting

21. As a **developer**, I want HUD elements (CellInfo, ManaDisplay) to stay in fixed screen space (not pan with camera), so that they remain readable during exploration

22. As a **developer**, I want tile graphics lifecycle to be managed by GameScene, so that I can update visuals when cell state changes (no intermediate renderer service)

23. As a **developer**, I want the viewport to stay at 800×600 logical pixels, so that the game benefits from responsive camera controls and forced exploration

24. As a **developer**, I want to verify isometric rendering with manual console logging and visual inspection, so that foundational rendering is proven before adding automated tests

---

## Implementation Decisions

### Module Architecture

**New Modules to Create:**

1. **`CoordinateSystem` interface**
   - Methods: `worldToTile(worldPos: Vector): Vector`, `tileToWorld(tilePos: Vector): Vector`
   - Purpose: Abstract coordinate transformation; enables perspective swaps
   - Dependency: None (pure interface)

2. **`IsometricCoordinateSystem` implementation**
   - Wraps IsometricMap's native `worldToTile()` and `tileToWorld()` methods
   - Handles camera offset internally (adjusts world position for camera transforms)
   - Tile coordinate rounding via `Math.floor()` (standard grid behavior)
   - Dependency: CoordinateSystem interface, IsometricMap instance

3. **`CameraController` service**
   - Manages pan (Arrow/WASD) and zoom (mouse wheel/+- keys)
   - Validates camera bounds: `camera.center` never leaves map bounds
   - Hardcoded speeds (pan pixels/frame, zoom rate)
   - Bounds formula: `(camera.center.x, camera.center.y)` must stay within `[tileWidth/2, mapWidth - tileWidth/2]` × `[tileHeight/2, mapHeight - tileHeight/2]`
   - Dependency: Engine.camera, tile dimensions

4. **Shared constants module**
   - `TILE_WIDTH = 32`
   - `TILE_HEIGHT = 64`
   - Purpose: Reusable across CoordinateSystem, CameraController, HighlightedCell, graphics calculations
   - Dependency: None

**Modules to Modify:**

1. **`GameScene`**
   - Replace `TileMap` with `IsometricMap(rows: 16, columns: 16, tileWidth: 32, tileHeight: 64)`
   - Initialize `CoordinateSystem` and `CameraController` during scene setup
   - Update `screenToGridCoordinates()` to call `coordinateSystem.worldToTile()` internally
   - Hook IsometricMap's pointer component: `isometricMap.pointer.on('down', ...)` with `getTileByPoint()` for click detection
   - Update tile graphics on cell state change: `clearGraphics()` → `addGraphic()`
   - Integrate CameraController input listeners (Arrow/WASD/mouse wheel/+-)

2. **`HighlightedCell` actor**
   - Accept `CoordinateSystem` reference in constructor
   - Update `updateSelection(x: number, y: number, coordinateSystem: CoordinateSystem)` method signature
   - Use `coordinateSystem.tileToWorld()` to position the highlight actor
   - Dependency: CoordinateSystem interface

3. **Tile dimension constants**
   - Create or update shared constants file with TILE_WIDTH and TILE_HEIGHT
   - Update any hardcoded tile sizes throughout codebase

### Technical Clarifications

**Coordinate System Behavior:**
- Input event coordinates are **already in world space** — Excalibur's camera transforms are applied automatically to pointer events
- No manual camera offset adjustment needed in GameScene input handler
- `CoordinateSystem.worldToTile()` receives world-space position, returns grid coordinates (0-15, 0-15)
- Tile coordinates are floored to integers for grid cell lookup

**Camera Bounds Validation:**
- Camera center (not corners) is the reference point
- Black bars at map edges are acceptable and expected
- Prevents panning beyond map to show void
- Formula prevents zoom from making entire map smaller than viewport

**Cell State to Color Mapping:**
- **Veiled:** Gray (128, 128, 128) with 0.3 opacity
- **Dormant:** Desaturated terrain color (e.g., darkened Forest green)
- **Active:** Full-saturation terrain color (e.g., Forest green at full brightness)
- GameEngine/Grid is authoritative for colors; GameScene reads colors and applies graphics

**IsometricMap Native API Usage:**
- `isometricMap.getTile(x, y)` — retrieve IsometricTile at grid position
- `isometricMap.getTileByPoint(worldPos)` — get tile at world position (for click detection)
- `isometricMap.getTiles()` — iterate all tiles (if needed for bulk updates)
- `isometricTile.addGraphic(graphic)` / `clearGraphics()` — manage tile rendering
- `isometricTile.solid` — collision property (not used in v0.2)

### Camera Control Input Mapping

| Action          | Primary Key(s)      | Secondary Key(s)  | Behavior                           |
|-----------------|---------------------|-------------------|-----------------------------------|
| Pan Up          | Arrow Up            | W                 | Move camera center up by N pixels |
| Pan Down        | Arrow Down          | S                 | Move camera center down by N pixels |
| Pan Left        | Arrow Left          | A                 | Move camera center left by N pixels |
| Pan Right       | Arrow Right         | D                 | Move camera center right by N pixels |
| Zoom In         | Plus/Equals         | Mouse Wheel Up    | Increase zoom to max 2.0x |
| Zoom Out        | Minus/Hyphen        | Mouse Wheel Down  | Decrease zoom to min 1.0x |

**Speed Constants (Hardcoded in v0.2):**
- Pan speed: 5-10 pixels/frame (at 60 FPS → 300-600 pixels/sec)
- Zoom speed: 0.1 per key press (accumulates; mouse wheel may be finer-grained)

---

## Implementation Decisions (Continued)

### File Creation & Dependency Order

**Dependency graph (acyclic):**

1. `src/shared/constants.ts` — TILE_WIDTH, TILE_HEIGHT
   - No dependencies

2. `src/graphics/coordinate-system.ts` — CoordinateSystem interface
   - Depends on: Excalibur Vector
   - No app dependencies

3. `src/graphics/isometric-coordinate-system.ts` — IsometricCoordinateSystem implementation
   - Depends on: coordinate-system.ts, Excalibur IsometricMap, shared constants

4. `src/input/camera-controller.ts` — CameraController service
   - Depends on: shared constants, Excalibur Engine/Camera

5. `src/scenes/game.scene.ts` — Updated GameScene
   - Depends on: coordinate-system, isometric-coordinate-system, camera-controller, all prior modules

This order prevents circular dependencies and allows testing each module in isolation.

### Tile Rendering Lifecycle

When a cell state changes (e.g., `Veiled` → `Dormant`):

1. GameEngine computes new color based on state and terrainType
2. GameScene receives notification (listener pattern)
3. GameScene calls `isometricMap.getTile(x, y)` to get IsometricTile
4. GameScene calls `isometricTile.clearGraphics()`
5. GameScene creates new Rectangle with updated color
6. GameScene calls `isometricTile.addGraphic(newRectangle)`
7. Next frame: IsometricMap renders updated graphics

This ensures visual correctness even with frequent state changes.

### Viewport & Camera Behavior

**Logical Viewport:** 800×600 pixels  
**Map Dimensions:** 16×16 isometric grid = 512×1024 pixels at 1.0x zoom  
**Why 800×600 logical:**
- Allows camera to pan/zoom for exploration (incentivizes navigation)
- Better than fullscreen map view (discourages discovery)
- Standard retro game size (accessible on old hardware)

**Camera Zoom Range:** 1.0x to 2.0x
- 1.0x: Entire map fits with some panning required
- 2.0x: 400×300 viewport onto map (focus on half the grid)

---

## Testing Decisions

### Testing Philosophy

A **good test for v0.2** is one that:
- Tests **external behavior**, not implementation details
- Verifies **coordinate transforms** work correctly (worldToTile, tileToWorld)
- Ensures **camera bounds validation** prevents invalid states
- Confirms **input → grid action mapping** works (click → select cell)
- Does **not** mock IsometricMap or Excalibur components (use real instances for foundational code)

### Verification Strategy for v0.2

v0.2 is foundational; IsometricMap rendering itself is the primary proof. **Manual verification** is preferred over automated tests:

**Launch game and verify:**
- [ ] IsometricMap renders 16×16 grid in isometric projection (35° angle, tiles are diamonds)
- [ ] Click on visible cells; HighlightedCell selection moves to correct grid position
- [ ] Pan with Arrow keys; camera moves smoothly and stays within bounds
- [ ] Pan with WASD; same behavior as Arrow keys
- [ ] Zoom with mouse wheel; zoom range 1.0x to 2.0x functional
- [ ] Zoom with +/- keys; same zoom behavior as mouse wheel
- [ ] Camera bounds: center never leaves map (black bars acceptable at edges)
- [ ] Console: `coordinateSystem.worldToTile()` produces correct grid coords for various world positions
- [ ] Console: `coordinateSystem.tileToWorld()` produces correct world coords for all grid cells (0-15, 0-15)
- [ ] Cell state changes (Veiled → Dormant → Active) reflect visually with correct colors/opacity
- [ ] HighlightedCell positioned correctly in isometric space (follows selection)

### Module Testing Plan

**Modules with isolated unit tests (v0.3+):**
- `IsometricCoordinateSystem` — transform methods return correct Vector values
  - Prior art: Coordinate/math utility tests in codebase
  - Test cases: corner cells (0,0), (15,15); center cell (7,7); edge cases (negative zoom applied)

- `CameraController` — bounds validation, pan/zoom clamping
  - Prior art: Service tests for existing ManaService, GridService
  - Test cases: pan beyond bounds (should clamp), zoom to limits (should clamp), smooth increments

**Modules deferred (v0.3+):**
- GameScene click-to-select (requires full Excalibur engine, better as integration test)
- Graphics rendering (visual verification sufficient for v0.2)

**Playwright Integration Tests (v0.3+):**
- Click a cell; verify HighlightedCell appears at correct position
- Pan; verify viewport content shifts
- Zoom; verify tile size increases/decreases
- State change; verify colors update

---

## Out of Scope

### Explicitly Deferred to v0.8 (Cell State Visualization):
- **GridBackground actor** — subtle background grid lines for visual clarity
  - Reason: Scope control; IsometricMap coordinate system is the v0.2 focus
  - Implementation: Can be added as overlay actor once IsometricMap is stable

### Explicitly Deferred to v1.0+:
- **Configurable camera speeds** — pan/zoom rates will be hardcoded in v0.2
  - Reason: Complexity; requires settings UI or config system
  - Implementation: Extract to CameraController config object in v1.0

- **Animated camera transitions** — smooth pan/zoom animations
  - Reason: Polish feature; foundation (IsometricMap + CameraController) must be proven first
  - Implementation: Use Excalibur Actions for camera easing in v1.0+

- **Top-down perspective swap** — alternative rendering mode
  - Reason: Requires refactoring coordinate system; IsometricMap must be proven first
  - Implementation: Create `TopDownCoordinateSystem` in v1.1; swap via scene reload

- **Advanced camera features** — follow actor, parallax layers, minimap
  - Reason: Post-v1.0 polish features
  - Implementation: Layer IsometricMap with multiple depth-sorted actors

### Explicitly Removed:
- **TileMapRenderer service** — intermediate tile update service
  - Reason: IsometricMap is self-contained; GameScene updates tiles directly via `getTile(x, y)`
  - Impact: Simpler codebase, fewer abstractions

---

## Further Notes

### Why Excalibur's IsometricMap (Not Custom)?

Excalibur's `IsometricMap` provides:
- Native coordinate transforms (`worldToTile()`, `tileToWorld()`) — no custom math needed
- Built-in pointer component for click detection
- IsometricTile graphics management (`addGraphic()`, `clearGraphics()`)
- Standard Excalibur Actor lifecycle (fits existing patterns)

Custom solutions would:
- Reinvent coordinate math (error-prone, hard to debug)
- Duplicate Excalibur's built-in features
- Create maintenance burden

**Decision:** Delegate all isometric logic to IsometricMap; implement only game-specific abstractions (CoordinateSystem, CameraController).

### File Organization Rationale

**Separate coordinates into:**
- `coordinate-system.ts` (interface, no deps)
- `isometric-coordinate-system.ts` (implementation, IsometricMap-specific)

**Separate camera into:**
- `camera-controller.ts` (reusable service, no UI)

**Shared constants in:**
- `src/shared/constants.ts` (referenced everywhere)

This avoids circular dependencies and makes modules testable in isolation.

### Verification Checklist for Implementation

Use this checklist during implementation to verify v0.2 is complete:

**Rendering:**
- [ ] IsometricMap initialized with 16×16 grid, 32×64 tiles
- [ ] All tiles have Rectangle graphics (colored by terrain)
- [ ] Veiled cells appear gray/desaturated
- [ ] Colors match design spec (Forest, Water, Mountain)

**Input & Camera:**
- [ ] Arrow keys pan camera smoothly
- [ ] WASD keys pan camera smoothly
- [ ] Mouse wheel zooms 1.0x to 2.0x
- [ ] +/- keys zoom 1.0x to 2.0x
- [ ] Camera never leaves map bounds (black bars at edges)
- [ ] Zoom out: entire map fits with panning required
- [ ] Zoom in: focus on quadrant of grid

**Selection & Interaction:**
- [ ] Click cell in isometric view; selection highlights move to correct grid position
- [ ] Selection highlight stays centered on cell
- [ ] HighlightedCell uses CoordinateSystem (decoupled from IsometricMap)

**State Changes:**
- [ ] Unveil cell; color updates correctly
- [ ] Reshape cell; color updates correctly
- [ ] Divine Pulse; colors update correctly

**Console Verification:**
- [ ] `console.log(coordinateSystem.worldToTile(vec))` returns correct grid coords
- [ ] `console.log(coordinateSystem.tileToWorld(vec))` returns correct world coords for all cells

---

## Complexity Estimate

**Effort:** 3–4 days (for experienced developer familiar with Excalibur)

**Risk Factors:**
- IsometricMap API learning curve (mitigated by Excalibur docs + prior grill-me research)
- Coordinate transform edge cases (mitigated by console verification)
- Camera bounds math (straightforward clamping; mitigated by CameraController encapsulation)

**Success Criteria:**
- [ ] IsometricMap renders 16×16 grid correctly
- [ ] All input (pan/zoom/click) works in isometric space
- [ ] Camera bounds prevent void exploration
- [ ] Manual verification checklist passes

---

**Document:** prd.md  
**Milestone:** v0.2  
**Status:** ✅ Ready for Implementation Planning  
**Next Step:** Create implementation plans (`resources/milestones/v0.2/plans/*.md`) for each story in PRD
