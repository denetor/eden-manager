# PRD: v0.1 — Grid Infrastructure & Game Engine Foundation

**Version**: 1.0  
**Date**: 2026-04-15  
**Milestone**: v0.1 (MVP Foundation)  
**Status**: In Development  

---

## Problem Statement

The game **Eden Manager** is designed around a mutable 2D grid where the player sculpts the land and watches humanity respond organically. To ship v0.1 (MVP), we need to build the **foundational data and orchestration systems** that:

1. **Represent the world accurately**: A 2D grid that stores cell state (Veiled, Dormant, Active), terrain type, and coordinates.
2. **Scale gracefully**: The architecture must support 16×16 maps in v0.1 but be ready for 32×32, 64×64, and 128×128 in future versions without major rewrites.
3. **Enable efficient simulation**: Track which cells changed each Divine Pulse and propagate synergy effects only to affected cells and neighbors.
4. **Support emergent gameplay**: Decouple the Grid (data authority) from systems that read and react to it (SynergyEngine, HumanSystem, CreatureSystem), preventing circular dependencies and enabling independent testing.
5. **Integrate rendering seamlessly**: Keep rendering logic separate from game logic; allow swapping between TileMap (v0.1) and IsometricMap (v1.2+) without touching Grid.
6. **Persist game state**: Save and load the grid to localStorage as JSON, enabling players to resume their world.

---

## Solution

We will implement a **Grid class** that is the single source of truth for all cell state. It will:

- Accept dynamic dimensions at construction (`new Grid(width, height)`) but start with hardcoded 16×16.
- Store cells as simple, extendable objects (`{ state, terrainType, x, y }`).
- Track "dirty" cells (those modified in the current pulse) for efficient synergy calculation.
- Emit events when cells change, allowing rendering and other systems to listen and react without direct coupling.
- Support batch operations for multi-cell changes (Divine Powers).
- Serialize to/from JSON for persistence.

Additionally, we will create:

1. **SynergyEngine**: A separate class that reads dirty cells and applies adjacency-based transformations.
2. **GameEngine**: An orchestrator that coordinates Grid, Mana, Synergy, Humans, and Creatures through a single `divinePulse()` method.
3. **TileMapRenderer**: Renders the Grid via an `ICellRenderer` interface, allowing future renderer swaps.
4. **PersistenceService**: Saves/loads Grid state via localStorage.

This design ensures:
- **No circular dependencies**: Systems import Grid (or GameEngine), not each other.
- **Testability**: Grid logic can be tested without rendering; SynergyEngine can be tested independently of Grid internals.
- **Future-proofing**: Adding IsometricMapRenderer, larger maps, or new systems requires minimal changes to Grid.

---

## User Stories

*Note: These user stories are written from a **developer/architect perspective**, as v0.1 is a foundational infrastructure milestone.*

1. As a developer, I want the Grid class to accept arbitrary width/height at construction time, so that scaling to 32×32 or 128×128 in future versions requires no rewrite of the Grid class itself.

2. As a developer, I want cells to be simple objects (not complex class instances), so that memory overhead is minimal and extending cell properties later (e.g., adding settlement or creature references) is straightforward.

3. As a developer, I want the Grid to emit events when cells change (e.g., `cellChanged`, `batchChanged`), so that rendering and other systems can listen and react without Grid knowing about them, preventing circular imports.

4. As a developer, I want dirty flagging to track which cells changed in the current pulse, so that SynergyEngine only checks modified cells and their neighbors (not all 256 cells), enabling efficient simulation for 128×128 maps later.

5. As a developer, I want a `reshapeBatch()` method that applies multiple cell transformations atomically and emits a single batch event, so that Divine Powers can modify 3×3 or 5×5 areas efficiently without cascading event spam.

6. As a developer, I want the Grid to be observable by a TileMapRenderer, so that any cell change automatically updates the visual representation, keeping the world view in sync with game state.

7. As a developer, I want to swap the rendering backend (TileMap → IsometricMap) by changing one line of code in GameEngine, so that future perspective improvements don't require refactoring Grid or game logic.

8. As a developer, I want cell state transitions to be instantaneous (no intermediate "reshaping" state), so that synergy checks and AI logic always see the current state, simplifying state machine logic.

9. As a developer, I want to implement a cooldown on repeated reshapes to the same cell, so that rapid input (e.g., user clicking) doesn't spam cell changes, causing render jank or unexpected cascades.

10. As a developer, I want the Grid to serialize to/from JSON, so that game state can be saved to localStorage and restored on page reload, enabling persistence without implementing complex binary formats.

11. As a developer, I want getAdjacentCells() to handle boundary cases correctly (no wrapping; corners return 3 neighbors, edges return 5), so that synergy rules work naturally at map edges without special-case logic.

12. As a developer, I want the GameEngine to orchestrate the Divine Pulse (Synergy → Humans → Creatures → Mana → clear dirty flags), so that the pulse logic is centralized and testable in one place.

13. As a developer, I want Grid and GameEngine to have clear APIs with no mutation surprise-behavior, so that code calling these systems understands what will happen without reading implementation details.

14. As a developer, I want the Grid's dirty flagging system to be optional (i.e., I can call `getDirtyCells()` even if nothing was marked dirty), so that the API is forgiving and doesn't require callers to micromanage state.

15. As a developer, I want a PersistenceService that wraps Grid's `toJSON()` and `fromJSON()`, so that the Grid class itself doesn't depend on localStorage, keeping it portable and testable.

---

## Implementation Decisions

### 1. Grid Constructor with Dynamic Dimensions

**Decision**: The Grid constructor accepts `(width: number, height: number)` and initializes a flat array of Cell objects with computed x, y coordinates.

**Rationale**:
- Allows 16×16 in v0.1, but scales to 32×32, 64×64, 128×128 without code changes.
- Flat array (1D) is faster than nested 2D arrays for large grids.
- Each Cell stores its own x, y to avoid index arithmetic bugs.

**Impact**:
- All adjacency queries use boundary checks to prevent wrapping.
- `getCell(x, y)` looks up `cells[x + y * width]`.
- v0.1 creates `new Grid(16, 16)`.

---

### 2. Simple Cell Objects (Not Classes)

**Decision**: Cells are plain objects: `{ state: CellState, terrainType: TerrainType, x: number, y: number }`. No class methods on Cell.

**Rationale**:
- Reduces memory overhead (~40 bytes per cell vs. 200+ for a class instance).
- Easy to extend later (add `humanSettlement?: Settlement` or `creatureId?: string` without refactoring).
- Serialization is trivial: JSON.stringify/parse work out of the box.

**Impact**:
- Grid methods read/mutate cell objects directly: `cell.terrainType = 'forest'`.
- Cells have no validation; Grid methods validate when mutating.
- TypeScript interfaces define the shape: `CellState` and `TerrainType` types.

---

### 3. Dirty Flagging with SynergyEngine

**Decision**: Grid maintains a private `dirty: Set<string>` (keys like "x,y"). SynergyEngine reads `getDirtyCells()` and applies transformations based on adjacency patterns.

**Rationale**:
- **Performance**: For 128×128, checking all 16,384 cells every pulse is expensive. Dirty flagging limits synergy checks to O(k + 8k) where k is the number of modified cells.
- **Separation of concerns**: Grid stores state; SynergyEngine interprets state. This prevents Grid from knowing about game rules.
- **Scales naturally**: Adding more synergy rules doesn't require changing Grid.

**Impact**:
- Every cell mutation calls `markDirty(x, y)`.
- SynergyEngine's `apply(grid)` loops through dirty cells and their neighbors, applying rules.
- At end of pulse, `grid.clearDirty()` resets the set.

---

### 4. Serialization via toJSON() / fromJSON()

**Decision**: Grid implements `toJSON(): GridSerialized` and a static `fromJSON(data): Grid` method. Format: `{ width, height, cells: [...] }`.

**Rationale**:
- Human-readable JSON (debug-friendly in DevTools).
- Compact for 16×16: ~5KB; LocalStorage has 5–10MB limit.
- No premature optimization to binary formats; only optimize if v2.0 profiling demands it.

**Impact**:
- `PersistenceService.saveGrid()` calls `JSON.stringify(grid.toJSON())` and stores in localStorage.
- `PersistenceService.loadGrid()` retrieves JSON, parses, and calls `Grid.fromJSON()`.

---

### 5. TileMap Rendering with ICellRenderer Interface

**Decision**: Rendering is abstracted behind an `ICellRenderer` interface. v0.1 uses `TileMapRenderer` (Excalibur TileMap). Future versions can implement `IsometricMapRenderer` without touching Grid.

**Rationale**:
- **Strategy Pattern**: Swap implementations cleanly.
- **Performance**: TileMap renders 256 sprites in one draw call (far better than 256 individual Actors).
- **Future-proof**: If isometric rendering is needed in v1.2, the only change is one line in GameEngine: `renderer = new IsometricMapRenderer(grid)`.

**Impact**:
- GameEngine holds a `renderer: ICellRenderer`.
- Grid emits `cellChanged` and `batchChanged` events; TileMapRenderer listens and calls `updateCell()`.
- Visual tile IDs map terrain + state to a spritesheet (e.g., meadow = 1, meadow veiled = 101, meadow dormant = 201).

---

### 6. Authority & Observation (Grid = Single Source of Truth)

**Decision**: Grid is the authority for all cell state. Rendering and other systems listen to Grid events; they never write to Grid directly.

**Rationale**:
- **No circular dependencies**: Renderer reads Grid; Grid doesn't import Renderer.
- **Testable**: Grid logic isolated from rendering code.
- **Single flow**: All state changes flow through Grid's methods (`reshape`, `unveil`, `awaken`, `reshapeBatch`).

**Impact**:
- Grid extends `EventEmitter` and calls `this.emit('cellChanged', { x, y, cell })` on every mutation.
- TileMapRenderer registers a listener: `grid.on('cellChanged', listener)`.
- Other systems (Humans, Creatures) read Grid state but never mutate cells directly.

---

### 7. GameEngine as Orchestrator

**Decision**: Create a separate `GameEngine` class that holds instances of Grid, Mana, Synergy, Humans, Creatures. GameEngine orchestrates the Divine Pulse and provides a high-level API (reshape, unveil, awaken, divinePulse).

**Rationale**:
- **No circular imports**: Each system imports GameEngine (or Grid alone), not each other.
- **Clear pulse flow**: `gameEngine.divinePulse()` reads naturally and sequences all steps.
- **Testable**: Mock GameEngine's dependencies.
- **Extensible**: Adding audio, particles, or other reactions to pulse is easy.

**Impact**:
- Grid stays simple: just data + queries + events.
- GameEngine provides high-level methods: `reshape(x, y, terrain, manaCost)`, `unveil(x, y, manaCost)`, `divinePulse()`.
- Scene (Excalibur level) holds GameEngine and calls `gameEngine.divinePulse()` each game tick.

---

### 8. Instantaneous State Transitions

**Decision**: Cell state changes are immediate. No intermediate "reshaping" state. Animations are purely visual (renderer's job), not game state.

**Rationale**:
- **Simplicity**: State machine in Grid has only 3 states, not 5.
- **Logical clarity**: Synergy checks always see current state; no "what if the shape finishes?" edge cases.
- **Visual Polish**: Renderer plays animation while Grid state is already new.

**Impact**:
- `reshape(x, y, terrain)` completes instantly; the cell is already the new terrain.
- TileMapRenderer updates the tilemap cell immediately.
- Animation (fade, grow, glow) happens over 0.5–1s in the renderer, independent of game state.

---

### 9. Cooldown on Repeated Reshapes

**Decision**: GameEngine tracks a `reshapeLastTime` Map and enforces a 200ms cooldown per cell to prevent rapid-fire input from spamming changes.

**Rationale**:
- **UX**: Prevents jank from too many events per frame.
- **Game feel**: Clicking a cell multiple times feels intentional, not accidental.
- **Simple**: Timestamp-based; no state machine needed.

**Impact**:
- `canReshape(x, y)` checks if enough time has passed since the last reshape on that cell.
- `reshape()` returns false if cooldown active (caller can show UI feedback: "too fast").
- Protects both the game loop and the rendering pipeline.

---

### 10. Batch Operations (reshapeBatch)

**Decision**: Grid's `reshapeBatch(changes: Array<{x, y, terrain}>)` applies all transformations, then emits a single `batchChanged` event.

**Rationale**:
- **Efficiency**: Divine Powers modify 3×3 or 5×5 areas. Without batching, that's 9–25 separate `cellChanged` events and 9–25 tilemap updates per frame.
- **Atomicity**: All changes apply before listeners react, so Synergy sees the full picture at once.
- **Simplicity**: Renderer can optimize batch updates (e.g., redraw only affected tiles).

**Impact**:
- Divine Powers call `grid.reshapeBatch(changes)` instead of looping and calling `reshape()` 9 times.
- SynergyEngine listens to `batchChanged` with the same logic as individual `cellChanged` (dirty cells + neighbors).

---

### 11. Boundary Behavior (Hard Edges, No Wrapping)

**Decision**: Map edges are hard boundaries. `getAdjacentCells(x, y)` skips out-of-bounds neighbors. Corners have 3 neighbors, edges have 5, interior has 8.

**Rationale**:
- **GDD alignment**: "Maps have hard edges. This creates natural frontiers."
- **Intuitive**: Players understand edges are final; no surprise wrapping.
- **Synergy simplicity**: Rules work with partial neighbor sets naturally (3 trees at corner can still trigger Sacred Grove).

**Impact**:
- All boundary checks in `getAdjacentCells()` and `getCell()` return null for out-of-bounds.
- SynergyEngine rules must handle varying neighbor counts (not a problem; rules are written per-pattern, not per-neighbor-count).

---

### 12. Divine Pulse Orchestration in GameEngine

**Decision**: GameEngine's `divinePulse()` method sequences: Synergy → Humans → Creatures → Mana → clear dirty flags.

**Rationale**:
- **Clear order**: Synergy always runs first; Humans and Creatures react to the new world state; Mana regenerates based on new structures.
- **Testable**: Can mock each system and verify pulse order.
- **Extensible**: Adding audio/particle cues is easy: insert before/after any step.

**Impact**:
- Excalibur scene calls `gameEngine.divinePulse()` each game tick (e.g., every 2–3 seconds for v0.1 pacing).
- All state updates happen in one sequence; no race conditions.

---

### 13. API Clarity with No Surprise Mutations

**Decision**: Grid and GameEngine methods have clear, predictable side effects. Mutation is explicit: `reshape()`, `unveil()`, `awaken()`, `reshapeBatch()` mutate; `getCell()`, `getAdjacentCells()` are read-only. Returned objects are mutable (caller can inspect/test), but mutation is caller's responsibility.

**Rationale**:
- **No hidden mutations**: Methods do what their names suggest.
- **Testing**: Callers can verify behavior by checking Grid state after calling methods.

**Impact**:
- Code is self-documenting: `grid.reshape()` mutates; `grid.getCell()` doesn't.
- Callers know when to expect events: only `reshape()`, `unveil()`, `awaken()`, `reshapeBatch()` emit.

---

### 14. Optional Dirty Flagging (Forgiving API)

**Decision**: `getDirtyCells()` returns an array regardless of whether cells were marked dirty. If nothing is dirty, it returns an empty array.

**Rationale**:
- **Forgiving API**: Callers don't need to check if dirty set is empty before iterating.
- **Extensibility**: Future systems can call `getDirtyCells()` without knowing Grid internals.

**Impact**:
- SynergyEngine loops through `getDirtyCells()` even if the set is empty; loop runs 0 times, no harm.

---

### 15. Portable Grid via PersistenceService

**Decision**: Grid does not import or depend on localStorage. PersistenceService wraps Grid's serialization methods and handles storage I/O.

**Rationale**:
- **Testability**: Grid can be tested in Node.js or browser without localStorage mocks.
- **Reusability**: Grid logic is portable to future platforms (electron, mobile, etc.).
- **Separation**: PersistenceService owns the storage contract; Grid owns game logic.

**Impact**:
- PersistenceService.saveGrid(grid) calls `JSON.stringify(grid.toJSON())` and `localStorage.setItem()`.
- PersistenceService.loadGrid() calls `localStorage.getItem()` and `Grid.fromJSON()`.
- Grid has no knowledge of storage.

---

## Testing Decisions

### What Makes a Good Test

A good test verifies **external behavior**, not implementation details:
- **✅ Good**: "When I call `grid.reshape(5, 5, 'forest')`, the cell at (5, 5) has terrainType 'forest' and a `cellChanged` event is emitted."
- **❌ Bad**: "When I call `reshape()`, the private `dirty` Set contains '5,5'."

Tests should:
1. Call public methods.
2. Verify returned values or side effects (state changes, events emitted).
3. Not depend on private fields or implementation order.

### Modules to Be Tested

1. **Grid** (Unit Tests)
   - Constructor initializes width, height, and cells.
   - `getCell(x, y)` returns correct cell; out-of-bounds returns null.
   - `getAdjacentCells(x, y)` returns correct neighbors (8 for center, 5 for edge, 3 for corner).
   - `reshape(x, y, terrain)` updates cell and emits event.
   - `unveil(x, y)` and `awaken(x, y)` update state.
   - `reshapeBatch()` applies all changes and emits single event.
   - `toJSON()` and `fromJSON()` round-trip correctly.
   - Dirty flagging: `markDirty()`, `getDirtyCells()`, `clearDirty()` work as expected.

2. **SynergyEngine** (Integration Tests)
   - Apply synergy rules to a test Grid.
   - Verify that dirty cells and neighbors are checked.
   - Verify specific synergy transformations (e.g., Water + Meadow → Fertile Plain).

3. **GameEngine** (Integration Tests)
   - `divinePulse()` sequences synergy, humans, creatures, mana correctly.
   - `reshape()` with cooldown enforces 200ms delay per cell.
   - `reshape()` with mana cost prevents reshapes if insufficient mana.

4. **TileMapRenderer** (Integration Tests)
   - When Grid emits `cellChanged`, TileMapRenderer updates tilemap.
   - Terrains map correctly to tile IDs.
   - State (veiled/dormant/active) affects visual tile ID.

5. **PersistenceService** (Unit Tests)
   - `saveGrid(grid)` serializes to localStorage.
   - `loadGrid()` deserializes from localStorage.
   - Missing localStorage key returns null.

### Prior Art

The codebase already uses **Playwright** for end-to-end tests. For v0.1 unit tests:
- Use a simple test runner (Jest, Vitest, or Playwright's built-in test support).
- Test Grid in Node.js (no DOM required).
- Test TileMapRenderer in a headless Excalibur instance.

---

## Out of Scope

The following are **out of scope for v0.1** and will be addressed in later milestones:

1. **IsometricMapRenderer**: v0.1 ships with TileMapRenderer only. IsometricMapRenderer will be added in v1.2+ as a simple drop-in replacement.

2. **Dynamic Map Resizing**: v0.1 hardcodes 16×16. In v1.1, we'll support tier upgrades (32×32, 64×64, etc.), but the Grid class is already designed to support this without changes.

3. **Memory Fragment System**: The full memory fragment system (bonuses, persistence) is v1.2+. v0.1 may ship a simplified version.

4. **Creature AI**: v0.1 includes placeholder creatures to test the mechanics. Full AI (pathfinding, desire logic, interaction) is v1.0+.

5. **Advanced Synergy Rules**: v0.1 implements a core synergy table. Rare combinations (e.g., Volcanic Ash + Water → Fertile Obsidian, triggering Blacksmith) are v1.0+.

6. **UI Polish**: v0.1 has a minimal HUD (mana display, cell info). Accessibility features, colorblind modes, and tutorial hints are v1.2+.

7. **Audio**: v0.1 may have placeholder sounds. Full ambient soundtrack and dynamic audio is v1.0+.

8. **Mobile Optimization**: Desktop/browser first. Mobile port is v2.0+.

9. **Narrative/Ruins Discovery**: The ruins and story fragments tie into the memory system (v1.2+). v0.1 may have ruins as a visual terrain, but no story discovery.

10. **Save Game Management UI**: v0.1 saves/loads automatically. Multiple save slots and save browser UI are v1.0+.

---

## Further Notes

### v0.1 Pacing

The **Divine Pulse** is the heartbeat of the game. For v0.1, we recommend:
- **Pulse frequency**: ~1 pulse per 2–3 seconds during gameplay (can be paused).
- **Mana regeneration**: +2 mana per pulse (baseline).
- **Structure generation**: +2 mana per pulse per human structure (farms, mills, etc.).
- **Initial mana cap**: 50 mana. Increases by 2 per human structure (max mana = 50 + 2 × structures).

This pacing allows a relaxed, meditative experience where the player watches patterns emerge naturally.

### v0.1 Terrain & Synergy MVP

For v0.1, implement these core synergies (subset of full GDD table):
- **Water + Meadow** → Fertile Plain (builds Farm; +2 mana/pulse)
- **Forest + Forest + Forest** (3+ adjacent) → Sacred Grove (builds Shrine; +3 mana/pulse)
- **Meadow + Mountain** → Foothill (builds Guard Tower; +1 mana/pulse)
- **Ruins + Forest** → Hidden Temple (builds Research Lab; +2 mana/pulse)

Advanced synergies can be added incrementally in v1.0+.

### Divine Powers for v0.1

Implement these powers:
- **Blessed Rain** (25 mana): Hydrate 3×3 area.
- **Divine Wind** (20 mana): Move a creature or fog token.
- **Veil of Forgetting** (20 mana): Revert a cell; refund 50% of reshape cost.

Defer:
- **Fertility Bloom** (requires understanding of synergy cascades)
- **Whisper of Memory** (requires ruins system)

### Integration with Excalibur Scene

The main game scene should:
1. Create a GameEngine instance in `onInitialize()`.
2. Create a TileMapRenderer and add it as an Actor to the scene.
3. Set up input listeners (mouse clicks for reshape, keyboard for powers).
4. Call `gameEngine.divinePulse()` on a timer (e.g., every 3 seconds).
5. Update HUD (mana display, messages) from GameEngine state.

### File Organization

Use the structure from CLAUDE.md:
```
/src/core/grid/
  grid.model.ts        (Cell, CellState, TerrainType types)
  grid.service.ts      (Grid class)
  grid.system.ts       (GridSystem for Excalibur integration, if needed)
  synergy.service.ts   (SynergyEngine)
  synergy.model.ts     (synergy rule types)
/src/core/
  game-engine.service.ts
/src/graphics/
  tilemap-renderer.ts  (TileMapRenderer + ICellRenderer)
/src/persistence/
  save.service.ts      (PersistenceService)
```

### Checklist for v0.1 Completion

- [ ] Grid class implemented with all 10 architectural decisions.
- [ ] Event emission (cellChanged, batchChanged) working.
- [ ] Dirty flagging system functional.
- [ ] SynergyEngine wired and synergy rules applied.
- [ ] GameEngine orchestration complete.
- [ ] TileMapRenderer with ICellRenderer interface rendering correctly.
- [ ] Batch operations working (Divine Powers).
- [ ] Boundary handling verified (corner/edge cells).
- [ ] Serialization (toJSON/fromJSON) tested.
- [ ] PersistenceService saving/loading to localStorage.
- [ ] End-to-end test: Unveil → Awaken → Reshape → Synergy triggers → Pulse.
- [ ] Input system wired (mouse clicks, keyboard for powers).
- [ ] HUD displaying mana, grid info.
- [ ] Unit tests for Grid, GameEngine, SynergyEngine.
- [ ] Integration tests for TileMapRenderer and PersistenceService.

---

**End of PRD**