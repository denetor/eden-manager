# Grid Class Design — Grill-Me-Out v0.1

**Date**: 2026-04-15  
**Milestone**: v0.1 (MVP)  
**Focus**: Architecture of the `Grid` class with openness to any size  
**Participants**: Design review via grill-me interview  

---

## Executive Summary

The `Grid` class is the **data authority** for the game world. It must be:
- **Size-agnostic**: Constructor accepts `(width, height)` and works for 16×16, 32×32, up to 128×128.
- **Simple**: Pure data store + queries; logic lives in separate systems (SynergyEngine, HumanSystem, GameEngine).
- **Observable**: Emits events when cells change so the rendering layer (TileMap) stays in sync.
- **Efficient**: Supports batch operations and dirty flagging for pulse-based updates.
- **Persistent**: Serializes to/from JSON for LocalStorage save/load.

**v0.1 Scope**: Hardcoded to 16×16, but the class is architected to scale without rewrite.

---

## Design Decisions (Grill-Me Results)

### 1. Runtime Dimensionality (Decision B)

**Choice**: Grid accepts `(width, height)` at construction time. v0.1 launches with `new Grid(16, 16)`, but the class supports any dimension.

**Why**: 
- Avoids hardcoding grid size; future tier upgrades (32×32 in v1.1, 64×64 in v2.0) reuse the same class.
- Allows easy scaling tests during development (mentally run 128×128 logic without shipping it).
- No rework needed when roadmap requires larger maps.

**Implementation**:
```typescript
class Grid {
    width: number;
    height: number;
    cells: Cell[];

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.cells = Array(width * height).fill(null).map((_, i) => ({
            state: 'veiled' as CellState,
            terrainType: 'meadow' as TerrainType,
            x: i % width,
            y: Math.floor(i / width),
        }));
    }
}
```

---

### 2. Cell Representation (Decision B)

**Choice**: Each cell is a simple object: `{ state, terrainType, x, y }`.

**Why**:
- **Leggibile**: Clear structure; no index arithmetic bugs.
- **Extendable**: Easy to add fields later (e.g., `humanSettlement?: Settlement`, `creaturePresence?: Creature`).
- **Not over-engineered**: Rich cell classes (Decision C) would add indirection; not needed yet.
- **Memory efficient enough**: 256 cells × ~40 bytes/object ≈ 10KB for 16×16; no concern for v0.1.

**Implementation**:
```typescript
interface Cell {
    state: CellState;           // 'veiled' | 'dormant' | 'active'
    terrainType: TerrainType;   // 'meadow' | 'forest' | 'water' | ...
    x: number;
    y: number;
    // Future fields (v1.0+): humanSettlement?, creatureId?, etc.
}

type CellState = 'veiled' | 'dormant' | 'active';
type TerrainType = 'meadow' | 'forest' | 'water' | 'mountain' | 'grassland' | 'ruins' | 'sacred_grove' | 'fertile_plain' | 'dormant_spring' | 'volcanic_ash';
```

---

### 3. Adjacency & Dirty Flagging (Decision B + SynergyEngine)

**Choice**: 
- Grid tracks which cells changed this pulse via a "dirty" flag.
- A separate `SynergyEngine` reads dirty cells and applies transformation rules.

**Why**:
- **Performance**: Don't check all 256 cells every pulse; only check modified ones and their 8 neighbors.
- **Separation of concerns**: Grid ≠ logic. Grid stores state; SynergyEngine interprets state.
- **Scales well**: For 128×128, this pattern prevents O(n) synergy checks from becoming bottleneck.

**Implementation**:
```typescript
class Grid {
    private dirty: Set<string> = new Set(); // "x,y" string keys

    markDirty(x: number, y: number): void {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.dirty.add(`${x},${y}`);
        }
    }

    getDirtyCells(): Cell[] {
        return Array.from(this.dirty).map(key => {
            const [x, y] = key.split(',').map(Number);
            return this.getCell(x, y);
        });
    }

    clearDirty(): void {
        this.dirty.clear();
    }

    getAdjacentCells(x: number, y: number, radius: number = 1): Cell[] {
        const adjacent = [];
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                    adjacent.push(this.getCell(nx, ny));
                }
            }
        }
        return adjacent;
    }
}

class SynergyEngine {
    apply(grid: Grid): void {
        const dirtyNeighbors = new Set<Cell>();
        grid.getDirtyCells().forEach(cell => {
            const neighbors = grid.getAdjacentCells(cell.x, cell.y, 1);
            neighbors.forEach(n => dirtyNeighbors.add(n));
        });

        dirtyNeighbors.forEach(cell => {
            const neighbors = grid.getAdjacentCells(cell.x, cell.y, 1);
            // Check synergy rules and apply transformations
            // Example: Water + Meadow → Fertile Plain
            const pattern = neighbors.map(n => n.terrainType).join(',');
            if (pattern includes 'water' && pattern includes 'meadow') {
                grid.reshape(cell.x, cell.y, 'fertile_plain');
            }
        });
    }
}
```

---

### 4. Serialization (Decision A + Methods)

**Choice**: 
- Grid serializes to/from JSON via `toJSON()` and `fromJSON()` methods.
- Format is human-readable: `{ width, height, cells: [...] }`.

**Why**:
- **Debug-friendly**: Inspect saves in browser DevTools.
- **Compact enough**: 16×16 JSON ≈ 5KB; LocalStorage has 5–10MB limit.
- **No premature optimization**: Only optimize to binary if v2.0 profiling shows it's needed.

**Implementation**:
```typescript
class Grid {
    toJSON(): GridSerialized {
        return {
            width: this.width,
            height: this.height,
            cells: this.cells,
        };
    }

    static fromJSON(data: GridSerialized): Grid {
        const grid = new Grid(data.width, data.height);
        grid.cells = data.cells;
        return grid;
    }
}

interface GridSerialized {
    width: number;
    height: number;
    cells: Cell[];
}
```

**Storage Integration** (via `PersistenceService`):
```typescript
class PersistenceService {
    saveGrid(grid: Grid): void {
        localStorage.setItem('grid', JSON.stringify(grid.toJSON()));
    }

    loadGrid(): Grid | null {
        const data = localStorage.getItem('grid');
        return data ? Grid.fromJSON(JSON.parse(data)) : null;
    }
}
```

---

### 5. Rendering with TileMap (Decision C + Interface Abstraction)

**Choice**:
- Use Excalibur's **TileMap** immediately (not per-cell Actors).
- Abstract rendering behind an `ICellRenderer` interface to enable future swaps (IsometricMap, etc.).

**Why**:
- **Performance**: TileMap renders efficiently; 16×16 → 256×256 sprites in one draw call.
- **Future-proof**: If you want isometric rendering in v1.2, swap the renderer implementation without touching Grid.
- **Design pattern**: Strategy pattern keeps rendering decoupled from logic.

**Implementation**:
```typescript
interface ICellRenderer {
    updateCell(x: number, y: number, cell: Cell): void;
    render(): void;
}

class TileMapRenderer implements ICellRenderer {
    private tilemap: ex.TileMap;
    private grid: Grid;
    private terrainToTileId: Map<TerrainType, number>;

    constructor(grid: Grid) {
        this.grid = grid;
        this.terrainToTileId = new Map([
            ['meadow', 1],
            ['forest', 2],
            ['water', 3],
            // ... etc
        ]);
        this.tilemap = new ex.TileMap(...);
    }

    updateCell(x: number, y: number, cell: Cell): void {
        const tileId = this.getVisualTileId(cell);
        this.tilemap.data[y][x] = tileId;
    }

    render(): void {
        // TileMap handles rendering; called by Excalibur each frame
    }

    private getVisualTileId(cell: Cell): number {
        // State affects visual: veiled = gray, dormant = desaturated, active = saturated
        const baseId = this.terrainToTileId.get(cell.terrainType) || 0;
        if (cell.state === 'veiled') return baseId + 100; // gray tiles
        if (cell.state === 'dormant') return baseId + 200; // desaturated
        return baseId; // active = full color
    }
}

// Future replacement (v1.2+):
class IsometricMapRenderer implements ICellRenderer {
    // Same interface, different implementation
}
```

**Viewport Integration**: The renderer only draws visible cells (culling handled by TileMap).

---

### 6. Authority & Observation (Grid = Authority, Observer Pattern)

**Choice**:
- **Grid** is the single source of truth for all cell state.
- **TileMapRenderer** listens to Grid changes and updates visuals.
- Communication via events/callbacks.

**Why**:
- **No circular dependencies**: Renderer reads Grid; Grid doesn't know about renderer.
- **Testable**: Test Grid logic without rendering code.
- **Syncs naturally**: When a Divine Power or Synergy changes cells, all listeners update.

**Implementation**:
```typescript
class Grid extends EventEmitter {
    reshape(x: number, y: number, newTerrain: TerrainType): void {
        const cell = this.getCell(x, y);
        cell.terrainType = newTerrain;
        this.markDirty(x, y);
        this.emit('cellChanged', { x, y, cell });
    }

    unveil(x: number, y: number): void {
        const cell = this.getCell(x, y);
        if (cell.state === 'veiled') {
            cell.state = 'dormant';
            this.markDirty(x, y);
            this.emit('cellChanged', { x, y, cell });
        }
    }

    awaken(x: number, y: number): void {
        const cell = this.getCell(x, y);
        if (cell.state === 'dormant') {
            cell.state = 'active';
            this.markDirty(x, y);
            this.emit('cellChanged', { x, y, cell });
        }
    }
}

class TileMapRenderer implements ICellRenderer {
    constructor(grid: Grid) {
        this.grid = grid;
        grid.on('cellChanged', ({ x, y, cell }) => {
            this.updateCell(x, y, cell);
        });
    }

    updateCell(x: number, y: number, cell: Cell): void {
        // Update tilemap based on new cell state
    }
}
```

---

### 7. Orchestration via GameEngine (Separate Class)

**Choice**:
- Create a **GameEngine** class that orchestrates all systems (Grid, Mana, Synergy, Humans, Creatures).
- Grid remains simple (data + queries). GameEngine handles pulse logic.

**Why**:
- **No circular imports**: Each system imports GameEngine (if needed), not each other.
- **Testable**: Mock GameEngine dependencies easily.
- **Scalable**: Adding new systems (e.g., audio cues) doesn't require touching Grid.
- **Clear flow**: `gamEngine.divinePulse()` reads naturally.

**Implementation**:
```typescript
class GameEngine {
    grid: Grid;
    mana: ManaSystem;
    synergy: SynergyEngine;
    humans: HumanSystem;
    creatures: CreatureSystem;

    constructor() {
        this.grid = new Grid(16, 16);
        this.mana = new ManaSystem();
        this.synergy = new SynergyEngine();
        this.humans = new HumanSystem();
        this.creatures = new CreatureSystem();
    }

    divinePulse(): void {
        // 1. Synergy: apply adjacency rules to dirty cells
        this.synergy.apply(this.grid);

        // 2. Humans: build structures based on terrain
        this.humans.tick(this.grid);

        // 3. Creatures: move and trigger effects
        this.creatures.tick(this.grid);

        // 4. Mana: regenerate based on structures
        this.mana.regenerate(this.grid);

        // 5. Clear dirty flags for next pulse
        this.grid.clearDirty();
    }

    reshape(x: number, y: number, newTerrain: TerrainType, manaCost: number): boolean {
        if (!this.mana.canSpend(manaCost)) return false;
        this.grid.reshape(x, y, newTerrain);
        this.mana.spend(manaCost);
        return true;
    }
}
```

**Scene Integration** (Excalibur level):
```typescript
export class MyLevel extends ex.Scene {
    engine: GameEngine;

    onInitialize() {
        this.engine = new GameEngine();
        // Listeners for input, pulses, etc.
    }
}
```

---

### 8. State Transitions (Instantaneous)

**Choice**:
- Cell state changes are **immediate** (no intermediate "reshaping" state).
- Animations are purely visual; handled by the renderer.

**Why**:
- **Simplicity**: State machine in Grid doesn't need "in-progress" states.
- **Logical clarity**: Synergy checks, Humans build, Creatures move all see current state instantly.
- **Visual polish**: Renderer plays animation frames while Grid state is already new.

**Cooldown to prevent spam**:
```typescript
class GameEngine {
    private reshapeLastTime: Map<string, number> = new Map();
    private RESHAPE_COOLDOWN_MS = 200; // milliseconds

    canReshape(x: number, y: number): boolean {
        const key = `${x},${y}`;
        const lastTime = this.reshapeLastTime.get(key) ?? 0;
        return Date.now() - lastTime > this.RESHAPE_COOLDOWN_MS;
    }

    reshape(x: number, y: number, newTerrain: TerrainType, manaCost: number): boolean {
        if (!this.canReshape(x, y)) return false; // UI feedback: "too fast"
        // ... apply reshape
        this.reshapeLastTime.set(`${x},${y}`, Date.now());
        return true;
    }
}
```

---

### 9. Batch Operations (reshapeBatch)

**Choice**:
- Grid supports a `reshapeBatch()` method for multi-cell changes (e.g., Divine Power: Blessed Rain on 3×3).
- Single `batchChanged` event emitted after all cells updated, not 9 separate events.

**Why**:
- **Efficiency**: Renderer updates once per batch, not 9 times.
- **Atomic**: All transformations complete before Synergy/Humans react.
- **Necessary for Divine Powers**: Powers naturally operate on areas, not single cells.

**Implementation**:
```typescript
class Grid {
    reshapeBatch(changes: Array<{ x: number; y: number; terrain: TerrainType }>): void {
        const affected: Cell[] = [];
        changes.forEach(({ x, y, terrain }) => {
            const cell = this.getCell(x, y);
            cell.terrainType = terrain;
            this.markDirty(x, y);
            affected.push(cell);
        });
        this.emit('batchChanged', affected);
    }
}

// Divine Power example (Blessed Rain: 3×3 area, cost 25 mana):
class DivineWindPower {
    apply(engine: GameEngine, centerX: number, centerY: number): void {
        if (!engine.mana.canSpend(25)) return;

        const changes = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const x = centerX + dx, y = centerY + dy;
                const cell = engine.grid.getCell(x, y);
                if (cell.state !== 'veiled') {
                    // Blessed Rain logic: grassland/ash → meadow/fertile plain
                    if (cell.terrainType === 'grassland') {
                        changes.push({ x, y, terrain: 'meadow' });
                    } else if (cell.terrainType === 'volcanic_ash') {
                        changes.push({ x, y, terrain: 'fertile_plain' });
                    }
                }
            }
        }

        engine.grid.reshapeBatch(changes);
        engine.mana.spend(25);
    }
}
```

---

### 10. Boundary Behavior (Hard Edges, No Wrapping)

**Choice**:
- Map edges are **hard boundaries**. No wrapping; cells outside bounds return empty.
- `getAdjacentCells()` naturally handles boundary cases (corner = 3 neighbors, edge = 5 neighbors).

**Why**:
- **GDD alignment**: "Maps have hard edges (no wrapping). This creates natural 'frontiers.'"
- **Intuitive**: Players understand that edges are final.
- **Synergy simplicity**: Rules work with partial neighbor sets (e.g., 3 trees at a corner can still trigger Sacred Grove if all 3 are present).

**Implementation**:
```typescript
class Grid {
    getAdjacentCells(x: number, y: number, radius: number = 1): Cell[] {
        const adjacent = [];
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx, ny = y + dy;
                // Boundary check: if outside, skip (no wrapping)
                if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                    adjacent.push(this.getCell(nx, ny));
                }
            }
        }
        return adjacent;
    }

    getCell(x: number, y: number): Cell | null {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null; // Out of bounds
        }
        return this.cells[x + y * this.width];
    }
}
```

---

## API Summary

```typescript
class Grid {
    // Construction & Serialization
    constructor(width: number, height: number);
    toJSON(): GridSerialized;
    static fromJSON(data: GridSerialized): Grid;

    // Query
    getCell(x: number, y: number): Cell | null;
    getAdjacentCells(x: number, y: number, radius?: number): Cell[];
    getDirtyCells(): Cell[];

    // Mutation
    reshape(x: number, y: number, terrain: TerrainType): void;
    unveil(x: number, y: number): void;
    awaken(x: number, y: number): void;
    reshapeBatch(changes: Array<{x, y, terrain}>): void;

    // Dirty tracking
    markDirty(x: number, y: number): void;
    clearDirty(): void;

    // Events
    on(event: 'cellChanged' | 'batchChanged', listener: (data: any) => void): void;
    emit(event: string, data: any): void;
}
```

---

## Integration Points

### GameEngine → Grid
- Calls `grid.reshape()`, `grid.unveil()`, `grid.awaken()`, `grid.reshapeBatch()` when player or systems request changes.

### SynergyEngine → Grid
- Reads `grid.getDirtyCells()` each pulse.
- Calls `grid.reshape()` to apply transformations.

### HumanSystem → Grid
- Reads cell terrains via `grid.getCell()`, `grid.getAdjacentCells()` to decide building placement.

### CreatureSystem → Grid
- Reads terrain to determine valid spawn/movement zones.
- Calls `grid.reshape()` if creature triggers transformation (rare).

### TileMapRenderer → Grid
- Listens to `cellChanged` and `batchChanged` events.
- Updates tilemap visuals based on new cell state.

### PersistenceService → Grid
- Calls `grid.toJSON()` to save state.
- Calls `Grid.fromJSON()` to restore state on page load.

---

## v0.1 Milestones Checklist

- [ ] Implement Grid class with all methods
- [ ] Add event emission (Node.js EventEmitter or custom)
- [ ] Implement dirty flagging and getDirtyCells()
- [ ] Create SynergyEngine and wire it to Grid
- [ ] Create GameEngine and orchestrate pulse logic
- [ ] Implement TileMapRenderer with ICellRenderer interface
- [ ] Add Grid event listeners to TileMapRenderer
- [ ] Test batch operations (Divine Powers)
- [ ] Verify boundary handling (corner/edge cells)
- [ ] Implement toJSON/fromJSON and test serialization
- [ ] Wire PersistenceService to save/load
- [ ] End-to-end test: Unveil → Awaken → Reshape → Synergy triggers → Humans react

---

## Future Considerations (v1.0+)

1. **IsometricMapRenderer**: Swap TileMapRenderer by changing one line in GameEngine.
2. **Cell Extended Fields**: Add `humanSettlement?: Settlement`, `creature?: Creature` when systems are ready.
3. **Performance Profiling**: If 128×128 rendering is slow, implement spatial partitioning or quadtrees.
4. **Synergy Batching**: If synergy cascades are slow, defer updates until end-of-pulse and apply atomically.
5. **Undo System**: Stack cell states in GameEngine for "Veil of Forgetting" power.

---

**End of Document**
