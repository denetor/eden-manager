# Plan: Isometric Rendering & Coordinate System (v0.2)

> Source PRD: resources/milestones/v0.2/prd.md

## Architectural Decisions

Durable decisions that apply across all phases:

- **Viewport:** 800×600 logical pixels (FitScreenAndFill display mode, pixelArt enabled)
- **Tile dimensions:** 32×64 pixels (isometric proportions, 35° angle)
- **Grid size:** 16×16 cells
- **Map dimensions:** 512×1024 pixels at 1.0x zoom
- **Tile rendering:** IsometricMap's native `addGraphic()` API with Rectangle shapes
- **Coordinate system:** Thin wrapper interface delegating to IsometricMap's `worldToTile()` and `tileToWorld()` methods (Vector-based)
- **Camera bounds:** Center stays within map bounds; black bars acceptable at edges
- **Cell state colors:**
  - Veiled: Gray (128, 128, 128) with 0.3 opacity
  - Dormant: Desaturated terrain color
  - Active: Full-saturation terrain color (Forest green, Water blue, Mountain gray)
- **Input coordinates:** Already in world space (Excalibur handles camera transforms automatically)
- **Tile coordinate rounding:** `Math.floor()` for grid cell lookup
- **Dependency order:** Constants → CoordinateSystem → IsometricCoordinateSystem → CameraController → GameScene

---

## Phase 1: Foundational Isometric Rendering

**User stories:** 1, 12, 13, 14, 15, 16

### What to build

Replace the current orthogonal TileMap with Excalibur's IsometricMap, establishing the coordinate system abstraction that will enable future perspective swaps. This phase delivers:

1. **Shared constants module** — Define TILE_WIDTH and TILE_HEIGHT as module-level exports for reuse across coordinate system, camera, and UI actors
2. **CoordinateSystem interface** — Abstract method signatures for `worldToTile(worldPos)` and `tileToWorld(tilePos)` using Excalibur Vector objects
3. **IsometricCoordinateSystem implementation** — Thin wrapper around IsometricMap's native coordinate transform methods; handles camera offset internally
4. **IsometricMap initialization in GameScene** — Replace TileMap instantiation with IsometricMap(rows: 16, columns: 16, tileWidth: 64, tileHeight: 32)
5. **Tile graphics population** — Create Rectangle graphics for each tile, colored by terrain type and cell state (Veiled/Dormant/Active)
6. **Cell state color mapping** — Implement logic to assign colors based on cell state (gray for Veiled, desaturated for Dormant, full-color for Active)

By the end of this phase, the game world should render as an isometric grid with visual distinction for cell states.

### Acceptance criteria

- [ ] Constants module exports TILE_WIDTH=64 and TILE_HEIGHT=32
- [ ] CoordinateSystem interface defined with `worldToTile(Vector): Vector` and `tileToWorld(Vector): Vector` methods
- [ ] IsometricCoordinateSystem created and delegates to IsometricMap's native methods
- [ ] IsometricMap renders 16×16 grid in isometric projection (35° angle, tiles are diamonds)
- [ ] All tiles have colored Rectangle graphics based on terrain type
- [ ] Veiled cells appear gray (128, 128, 128) with reduced opacity (0.3)
- [ ] Dormant cells appear desaturated
- [ ] Active cells appear with full-saturation colors
- [ ] Console verification: `coordinateSystem.worldToTile()` and `coordinateSystem.tileToWorld()` produce correct Vector values

---

## Phase 2: Click Detection & Selection in Isometric Space

**User stories:** 9, 10, 20, 21

### What to build

Enable cell selection in the isometric view by leveraging IsometricMap's pointer component and integrating the CoordinateSystem abstraction with the HighlightedCell actor. This phase delivers:

1. **Update screenToGridCoordinates method** — Refactor GameScene's coordinate conversion to call `coordinateSystem.worldToTile()` instead of hardcoded division
2. **Wire IsometricMap pointer component** — Hook the `isometricMap.pointer.on('down', ...)` event with `getTileByPoint()` to detect which tile the player clicked
3. **Update HighlightedCell actor** — Modify constructor to accept CoordinateSystem reference; update `updateSelection(x, y, coordinateSystem)` to call `coordinateSystem.tileToWorld()` for positioning
4. **Integration in GameScene** — Connect pointer events to `selectCell()` logic; pass CoordinateSystem to HighlightedCell during updates

By the end of this phase, clicking any visible cell in isometric space should move the selection highlight to the correct grid position.

### Acceptance criteria

- [ ] Click detection works using IsometricMap's `getTileByPoint()` method
- [ ] screenToGridCoordinates delegates to `coordinateSystem.worldToTile()`
- [ ] HighlightedCell constructor accepts CoordinateSystem reference
- [ ] HighlightedCell positions itself using `coordinateSystem.tileToWorld()`
- [ ] Clicking cells updates selection highlight position correctly in isometric space
- [ ] Selection highlight stays centered on selected cell (no offset)
- [ ] Console verification: Input event coordinates transform correctly through CoordinateSystem

---

## Phase 3: Camera Panning

**User stories:** 2, 3, 7, 8, 18, 19, 23

### What to build

Implement a CameraController service that manages pan input (Arrow and WASD keys) with internal bounds validation. This phase delivers:

1. **CameraController service creation** — Encapsulate all pan logic with bounds validation built-in
2. **Pan input handling** — Listen for Arrow keys (↑↓←→) and WASD (W/A/S/D)
3. **Bounds validation logic** — Calculate map bounds as `[tileWidth/2, mapWidth - tileWidth/2] × [tileHeight/2, mapHeight - tileHeight/2]`; clamp camera center to stay within bounds
4. **Camera update mechanism** — Modify Engine.camera.pos each frame based on input, clamped to bounds
5. **Integration in GameScene** — Register CameraController during scene initialization; call it on input events

By the end of this phase, players can smoothly pan the camera in all four directions within a bounded region, with black bars appearing at map edges.

### Acceptance criteria

- [ ] CameraController service created with pan logic
- [ ] Arrow keys (↑↓←→) move camera up/down/left/right
- [ ] WASD keys (W/A/S/D) move camera with same behavior as Arrow keys
- [ ] Camera center never leaves map bounds (calculated from tile dimensions and map size)
- [ ] Panning is smooth and responsive (hardcoded speed constant)
- [ ] Black bars appear at edges when camera is at bounds
- [ ] Bounds validation prevents void exploration (camera center stays within valid range)
- [ ] Pan speed is consistent across all directions

---

## Phase 4: Camera Zooming

**User stories:** 4, 5, 6, 24

### What to build

Extend CameraController with zoom functionality, supporting mouse wheel and keyboard input with range enforcement. This phase delivers:

1. **Zoom logic in CameraController** — Implement zoom state management (1.0x to 2.0x range)
2. **Mouse wheel input** — Listen to mouse wheel events; adjust zoom incrementally
3. **Keyboard zoom** — Listen to +/= and -/_ keys; adjust zoom incrementally
4. **Zoom range enforcement** — Clamp zoom to [1.0, 2.0]
5. **Camera system integration** — Set Engine.camera.zoom based on CameraController state each frame

By the end of this phase, players can zoom in/out smoothly, and Excalibur's camera transforms automatically adjust input event coordinates (no additional manual transform needed).

### Acceptance criteria

- [ ] CameraController implements zoom state (1.0x to 2.0x)
- [ ] Mouse wheel scrolls up → zoom in; scrolls down → zoom out
- [ ] +/= key → zoom in; -/_ key → zoom out
- [ ] Zoom range strictly enforced (clamped to [1.0, 2.0])
- [ ] At 1.0x zoom: entire 16×16 grid visible (with edges at black bars); panning required to explore
- [ ] At 2.0x zoom: focus on quadrant of grid (400×300 logical pixels)
- [ ] Zoom changes smoothly (no jitter or jumps)
- [ ] Click detection works correctly with zoom active (Excalibur handles camera transform automatically)
- [ ] Console verification: Input coordinates transform correctly at various zoom levels

---

## Phase 5: Dynamic Cell State Visualization

**User stories:** 11, 22

### What to build

Implement tile graphics lifecycle management so cell state changes (Veiled → Dormant → Active) immediately reflect visually. This phase delivers:

1. **Tile graphics update mechanism** — When a cell state changes, call `clearGraphics()` on the IsometricTile, then recreate and `addGraphic()` a new Rectangle with updated color
2. **GameEngine listener integration** — Subscribe to GameEngine state change notifications (or implement a polling/listener pattern)
3. **Color calculation** — Map cell state + terrain type → color (reuse logic from Phase 1)
4. **Rendering lifecycle** — Ensure graphics updates happen before next frame render

By the end of this phase, gameplay actions (Unveil, Reshape, Divine Pulse) that change cell state immediately show visual feedback without lag.

### Acceptance criteria

- [ ] Tile graphics recreated when cell state changes
- [ ] Veiled → gray with 0.3 opacity
- [ ] Dormant → desaturated terrain color
- [ ] Active → full-saturation terrain color
- [ ] Color updates are immediate (visible in next frame)
- [ ] State changes triggered by Unveil, Reshape, and Divine Pulse all reflect visually
- [ ] No memory leaks from repeated graphics creation/destruction
- [ ] Console verification: Cell state changes logged; color values correct before graphics update

---

## Testing & Verification Strategy

**Manual verification for v0.2:**
After each phase completion, launch the game and verify the acceptance criteria visually and via console inspection. Automated tests (unit tests for CoordinateSystem, CameraController bounds validation; integration tests for click-to-select) deferred to v0.3+.

**Verification order:**
1. Phase 1: Launch game, inspect isometric grid rendering
2. Phase 2: Click cells, verify selection moves correctly
3. Phase 3: Pan with Arrow/WASD, verify bounds enforcement
4. Phase 4: Zoom with mouse wheel/+-, verify range and input transform
5. Phase 5: Change cell states (Unveil, etc.), verify colors update

---

## Notes

- **IsometricMap is self-contained** — No intermediate TileMapRenderer service needed; GameScene updates tiles directly via `getTile(x, y)`
- **Camera transforms are automatic** — Excalibur applies camera offset to input event coordinates; no manual adjustment needed in screenToGridCoordinates
- **Dependency flow is acyclic** — Each phase depends only on prior phases, enabling parallel team work if needed
- **Verification checklist** — Use the detailed checklist in the v0.2 PRD (lines 370–401) during implementation

---

**Plan:** v0.2 Isometric Rendering & Coordinate System  
**Status:** Ready for implementation  
**Next step:** Begin Phase 1 (Foundational Isometric Rendering)
