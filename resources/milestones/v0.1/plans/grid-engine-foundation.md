# Plan: Grid Infrastructure & Game Engine Foundation

> Source PRD: `/resources/milestones/v0.1/prd.md`

## Architectural Decisions

Durable decisions that apply across all phases:

- **Grid Data Model**: 2D grid stored as flat array of Cell objects (plain POJOs, not class instances)
- **Cell Shape**: `{ state: CellState, terrainType: TerrainType, x: number, y: number }`
- **Dimensions**: Constructor accepts dynamic `(width, height)` but v0.1 uses hardcoded 16×16
- **Authority Pattern**: Grid is the single source of truth; all other systems (Rendering, Synergy, Humans, Creatures) read Grid and listen to events, never mutate directly
- **Event System**: Grid extends EventEmitter and emits `cellChanged` (single cell) and `batchChanged` (multiple cells) events
- **GameEngine**: Orchestrator class that coordinates Grid, SynergyEngine, Humans, Creatures, Mana systems
- **Serialization Format**: `{ width, height, cells: [...] }` JSON (human-readable, ~5KB for 16×16)
- **Rendering Abstraction**: `ICellRenderer` interface allows swapping TileMapRenderer ↔ IsometricMapRenderer
- **File Organization**: `/src/core/grid/` for Grid/Cell/Synergy, `/src/core/` for GameEngine, `/src/graphics/` for TileMapRenderer, `/src/persistence/` for PersistenceService

---

## Phase 1: Grid Foundation

**User stories**: US 1, 2, 13

### What to build

Create the Grid class with the foundational data structure: a flat array of Cell objects indexed by `x + y * width`. The Grid should support:
- Constructor that accepts arbitrary `width` and `height`
- Initialization of all cells with default state (Veiled) and terrain (Meadow)
- `getCell(x, y)` to retrieve a cell at any coordinate (returns null if out-of-bounds)
- `setCell(x, y, updates)` to mutate a cell's terrain or state properties
- TypeScript types for CellState and TerrainType

This phase lays the data foundation without events or side effects; Grid is just a mutable data store.

### Acceptance criteria

- [ ] Grid constructor accepts `(width: number, height: height)` and initializes flat array
- [ ] All cells initialized with `{ state: 'Veiled', terrainType: 'Meadow', x, y }`
- [ ] `getCell(x, y)` returns correct cell; returns null if x or y is out-of-bounds
- [ ] `setCell(x, y, { terrainType?, state? })` mutates cell properties
- [ ] Cell coordinates (x, y) are computed and immutable
- [ ] TypeScript types defined: `CellState` (Veiled | Dormant | Active), `TerrainType` (Meadow | Forest | Mountain | Water | Ruins), `Cell` interface
- [ ] Unit tests verify constructor, getCell, setCell for interior, edge, and corner cells
- [ ] Unit tests verify out-of-bounds getCell returns null

---

## Phase 2: State Mutations & Events

**User stories**: US 3, 6, 13

### What to build

Extend Grid to emit events on mutations. Add three public mutation methods (`reshape`, `unveil`, `awaken`) and a private `markDirty` method. Grid extends EventEmitter and emits:
- `cellChanged` event with payload `{ x, y, cell }` on single-cell mutations
- Track dirty cells internally (private Set keyed by "x,y")

This phase connects Grid state changes to the event system so external listeners (Rendering, Synergy) can react.

### Acceptance criteria

- [ ] Grid extends EventEmitter (Node.js or custom implementation)
- [ ] `reshape(x, y, terrain: TerrainType)` updates terrainType, marks dirty, emits `cellChanged`
- [ ] `unveil(x, y)` changes state from Veiled to Dormant, marks dirty, emits `cellChanged`
- [ ] `awaken(x, y)` changes state from Dormant to Active, marks dirty, emits `cellChanged`
- [ ] All three methods are idempotent (calling twice with same args is safe)
- [ ] Dirty cells are tracked internally in a Set (keyed "x,y")
- [ ] `cellChanged` event payload includes `{ x, y, cell }` (cell is the updated object)
- [ ] Unit tests verify each mutation method updates cell and emits correct event
- [ ] Unit tests verify listeners can subscribe to `cellChanged` and receive payloads
- [ ] Integration test: Grid → mock listener → verify listener fired with correct data

---

## Phase 3: Dirty Flagging & Batch Operations

**User stories**: US 4, 5, 14

### What to build

Implement dirty flagging as a core performance feature and add batch mutation support. Add:
- `getDirtyCells()` returns array of dirty cell coordinates (empty if no dirty cells)
- `clearDirty()` resets dirty Set (called at end of Divine Pulse)
- `reshapeBatch(changes: Array<{ x, y, terrain }>)` applies multiple mutations atomically, emits single `batchChanged` event with payload `{ changes: [...] }`
- Dirty flagging is "fire and forget"—callers don't manage it; Grid does

This phase optimizes for synergy checks on large grids (only dirty cells + neighbors checked, not all 256+).

### Acceptance criteria

- [ ] `getDirtyCells()` returns array of `{ x, y }` for all marked dirty cells
- [ ] `getDirtyCells()` returns empty array if no dirty cells (no null/undefined checks needed)
- [ ] `clearDirty()` empties the dirty Set
- [ ] `reshapeBatch(changes)` applies all changes before emitting (atomicity)
- [ ] `reshapeBatch(changes)` emits single `batchChanged` event with payload `{ changes }`
- [ ] All cells modified by `reshapeBatch` are marked dirty
- [ ] `batchChanged` event allows systems to optimize (e.g., renderer updates multiple tiles at once)
- [ ] Unit tests verify dirty flagging after reshape, unveil, awaken
- [ ] Unit tests verify getDirtyCells returns correct set and clearDirty resets it
- [ ] Unit tests verify reshapeBatch marks all cells dirty and emits single event
- [ ] Integration test: reshapeBatch 9 cells → single `batchChanged` event emitted

---

## Phase 4: Adjacency & Boundary Logic

**User stories**: US 11

### What to build

Implement `getAdjacentCells(x, y)` that returns an array of neighboring cells. Handle boundaries correctly:
- Interior cells (8 neighbors)
- Edge cells (5 neighbors)
- Corner cells (3 neighbors)
- No wrapping; out-of-bounds neighbors are omitted

This phase supports synergy rules and boundary awareness.

### Acceptance criteria

- [ ] `getAdjacentCells(x, y)` returns array of adjacent Cell objects (or references)
- [ ] Interior cell (e.g., 8,8 on 16×16 grid) returns 8 neighbors
- [ ] Edge cell (e.g., 0,8) returns 5 neighbors (omits out-of-bounds)
- [ ] Corner cell (e.g., 0,0) returns 3 neighbors (only down-right)
- [ ] All returned cells are valid in-bounds cells
- [ ] No wrapping: neighbors at x=-1 or y=16 are omitted, not wrapped
- [ ] Unit tests verify neighbor counts for interior, edge, and all 4 corners
- [ ] Unit tests verify specific neighbor relationships (e.g., (1,1) neighbors include (0,0), (2,1), (0,2), etc.)
- [ ] Integration test: getAdjacentCells on a grid with specific terrain → correct neighbors returned

---

## Phase 5: SynergyEngine Integration

**User stories**: US 4 (synergy rule application)

### What to build

Create SynergyEngine as a separate class that:
- Accepts a Grid instance in constructor
- `apply(grid)` method that reads dirty cells and applies synergy rules
- For each dirty cell, check it and its neighbors (via `getAdjacentCells`)
- Apply rule transformations (e.g., Water + Meadow → Fertile Plain)
- Emit events or mutate Grid cells based on rules (TBD: design choice on mutation authority)

Implement v0.1 core synergies (from PRD):
- Water + Meadow → Fertile Plain
- 3+ adjacent Forests → Sacred Grove
- Meadow + Mountain → Foothill
- Ruins + Forest → Hidden Temple

### Acceptance criteria

- [ ] SynergyEngine class created with `apply(grid)` method
- [ ] `apply()` reads `grid.getDirtyCells()` (tolerates empty array)
- [ ] For each dirty cell and its 8 neighbors, check synergy patterns
- [ ] Water + Meadow pattern correctly triggers and transforms cells
- [ ] 3+ adjacent Forest pattern correctly detects and transforms to Sacred Grove
- [ ] Meadow + Mountain pattern triggers Foothill
- [ ] Ruins + Forest pattern triggers Hidden Temple
- [ ] Synergy mutations mark affected cells dirty (enabling cascades)
- [ ] Unit tests verify each synergy rule in isolation (mock Grid, verify transformations)
- [ ] Integration test: Grid.reshape → SynergyEngine.apply → verify expected transformations
- [ ] Edge case test: Synergy at map boundaries works correctly (e.g., corner Forests still count for 3+)

---

## Phase 6: GameEngine & Divine Pulse Orchestration

**User stories**: US 12, 13

### What to build

Create GameEngine as the central orchestrator:
- Constructor accepts instances (or creates) Grid, Mana, SynergyEngine, Humans, Creatures
- `divinePulse()` method that sequences the turn: Synergy → Humans → Creatures → Mana → clear dirty
- High-level mutation methods: `reshape(x, y, terrain, manaCost)`, `unveil(x, y, manaCost)`, `awaken(x, y)`
- These methods check mana, deduct cost, call Grid methods, return success/failure

This phase provides the orchestration that ties all systems together into a coherent turn loop.

### Acceptance criteria

- [ ] GameEngine constructor accepts Grid, Mana, SynergyEngine, Humans, Creatures
- [ ] `divinePulse()` sequences: 1) Synergy.apply(), 2) Humans update, 3) Creatures update, 4) Mana regenerate, 5) clearDirty()
- [ ] `reshape(x, y, terrain, manaCost)` checks mana, deducts, calls grid.reshape(), returns boolean
- [ ] `unveil(x, y, manaCost)` and `awaken(x, y, manaCost)` follow same pattern
- [ ] All GameEngine methods return success/failure (for UI feedback)
- [ ] GameEngine does not directly mutate Humans/Creatures/Mana; it orchestrates their systems
- [ ] Unit test: divinePulse() executes steps in correct order (mock each system, verify call sequence)
- [ ] Unit test: reshape() with sufficient mana succeeds; with insufficient mana fails
- [ ] Integration test: Full turn—reshape → divinePulse() → synergy applies → dirty cleared

---

## Phase 7: Cooldown & Input Handling

**User stories**: US 8, 9

### What to build

Add reshape cooldown to prevent input spam:
- GameEngine tracks `reshapeLastTime` Map keyed by "x,y"
- `canReshape(x, y)` checks if 200ms has passed since last reshape on that cell
- `reshape()` checks cooldown before attempting mutation; returns false if on cooldown
- Protect against rapid-fire input without cascading side effects

This phase adds UX polish and stability under rapid clicks.

### Acceptance criteria

- [ ] GameEngine tracks reshape cooldown per cell (200ms minimum between reshapes)
- [ ] `canReshape(x, y)` returns true if cooldown has expired, false otherwise
- [ ] `reshape(x, y, terrain, manaCost)` checks `canReshape()` before proceeding
- [ ] If on cooldown, `reshape()` returns false (no mutation, no mana deduction)
- [ ] Cooldown resets after each successful reshape
- [ ] Unit test: first reshape succeeds; immediate second reshape fails; after 200ms succeeds again
- [ ] Unit test: different cells have independent cooldowns (reshape A doesn't block B)
- [ ] Stress test: rapid-fire 10 clicks on same cell → only ~1 reshape every 200ms

---

## Phase 8: Serialization & Persistence

**User stories**: US 10, 15

### What to build

Implement save/load functionality:
- Grid: `toJSON()` returns `{ width, height, cells: [...] }` (pure serialization, no storage knowledge)
- Grid: static `fromJSON(data)` reconstructs Grid from JSON
- PersistenceService: `saveGrid(grid)` calls `JSON.stringify(grid.toJSON())` and writes to localStorage
- PersistenceService: `loadGrid()` reads from localStorage, parses, calls `Grid.fromJSON()`
- PersistenceService: `deleteGameState()` clears localStorage

This phase enables players to resume their world and decouples storage from game logic (Grid is testable in Node.js).

### Acceptance criteria

- [ ] Grid.`toJSON()` returns object with shape `{ width: number, height: number, cells: Cell[] }`
- [ ] Grid.`fromJSON(data)` reconstructs Grid with identical state (deep copy of cells)
- [ ] JSON is human-readable and ~5KB for 16×16 grid
- [ ] PersistenceService.`saveGrid(grid)` writes to localStorage key (e.g., "edenManagerGameState")
- [ ] PersistenceService.`loadGrid()` retrieves from localStorage and returns Grid (or null if missing)
- [ ] PersistenceService.`deleteGameState()` clears localStorage key
- [ ] Unit test: Grid.toJSON() → Grid.fromJSON() → state matches original (round-trip)
- [ ] Unit test: PersistenceService.save(grid) → localStorage contains serialized data
- [ ] Unit test: PersistenceService.load() with missing localStorage returns null gracefully
- [ ] Integration test: Create Grid, reshape cells, save, create new Grid, load, verify state matches

---

## Phase 9: TileMap Rendering

**User stories**: US 6, 7

### What to build

Integrate Grid with Excalibur TileMapRenderer:
- Define `ICellRenderer` interface with `updateCell(x, y, cell)` method
- Implement TileMapRenderer that listens to Grid events (`cellChanged`, `batchChanged`)
- Map terrain + state to tile IDs (spritesheet convention: meadow=1, meadow veiled=101, meadow dormant=201, meadow active=301, etc.)
- Update Excalibur TileMap when Grid cells change
- Future: IsometricMapRenderer swaps in with no changes to Grid or GameEngine

This phase connects game logic to visual representation.

### Acceptance criteria

- [ ] ICellRenderer interface defined with `updateCell(x, y, cell)` method
- [ ] TileMapRenderer implements ICellRenderer and listens to Grid events
- [ ] TileMapRenderer responds to `cellChanged` by calling `updateCell()`
- [ ] TileMapRenderer responds to `batchChanged` by calling `updateCell()` for all changed cells
- [ ] Terrain + state map correctly to tile IDs (meadow=1, forest=2, mountain=3, water=4, ruins=5; state offset +100 Veiled, +200 Dormant, +300 Active)
- [ ] TileMapRenderer calls Excalibur TileMap's cell update method correctly
- [ ] Integration test: Grid.reshape() → `cellChanged` emitted → TileMapRenderer.updateCell() called → tilemap updated
- [ ] Visual test (Playwright): Change a cell in-game → visual tile changes within 1 frame

---

## Phase 10: Integration & Polish

**User stories**: All

### What to build

Wire everything together into a playable game scene:
- Create GameScene that initializes GameEngine, TileMapRenderer, HUD
- Wire input system: mouse clicks call `gameEngine.reshape()`, keyboard for powers
- Create ManaDisplay HUD showing current/max mana
- Create CellInfo HUD showing selected cell details
- Integrate PersistenceService: auto-save after each pulse, load on scene init
- Polish: animations (cell transitions), error feedback (cooldown messages), snap-to-grid cursor

This phase makes the v0.1 foundation playable and polished.

### Acceptance criteria

- [ ] GameScene.onInitialize() creates GameEngine, TileMapRenderer, adds to scene
- [ ] Mouse click on cell calls `gameEngine.reshape()` with selected terrain
- [ ] Keyboard shortcuts trigger Divine Powers (if implemented) or show placeholders
- [ ] ManaDisplay HUD updates in real-time from GameEngine.getMana()
- [ ] CellInfo HUD shows selected cell terrain, state, synergy info
- [ ] PersistenceService auto-saves after each `divinePulse()`
- [ ] PersistenceService loads saved game on scene init (if exists)
- [ ] Cell reshape feedback: brief "Cooling..." message if on cooldown, or "Insufficient mana" if out of mana
- [ ] Cursor snaps to grid cell nearest mouse
- [ ] End-to-end test (Playwright): Click cell → reshape → HUD updates → divinePulse triggers → synergy applies → mana updates → save persists
- [ ] Performance test: 16×16 grid renders at 60 FPS; no jank on batch reshapes
- [ ] Accessibility test: Game playable with keyboard alone (tab to cells, enter to reshape)