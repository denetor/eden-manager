import { EventEmitter } from '../../shared/event-emitter';
import { BuildingType } from '../synergy/building-synergy.model';
import { Cell, CellState, TerrainType } from './grid.model';

/**
 * Event payload when a single cell changes
 */
export interface CellChangedPayload {
    x: number;
    y: number;
    cell: Cell;
}

/**
 * Event payload when multiple cells change in a batch
 */
export interface BatchChangedPayload {
    changes: Array<{
        x: number;
        y: number;
        terrainType: TerrainType;
    }>;
}

/**
 * Grid manages a 2D world as a flat array of cells.
 * Stores cells indexed as: cells[x + y * width]
 * Extends EventEmitter to notify listeners of cell mutations.
 */
export class Grid extends EventEmitter {
    private width: number;
    private height: number;
    private cells: Cell[];
    private dirty: Set<string>;

    /**
     * Create a new Grid with given dimensions.
     * All cells initialized to Veiled state with Meadow terrain.
     */
    constructor(width: number, height: number) {
        super();
        this.width = width;
        this.height = height;
        this.cells = [];
        this.dirty = new Set();

        // Initialize flat array with Cell objects
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                this.cells.push({
                    state: 'Veiled',
                    terrainType: 'Meadow',
                    x,
                    y,
                });
            }
        }
    }

    /**
     * Get the cell at (x, y). Returns null if out-of-bounds.
     */
    getCell(x: number, y: number): Cell | null {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }

        const index = x + y * this.width;
        return this.cells[index];
    }

    /**
     * Update a cell's properties (state and/or terrainType).
     * Does nothing if (x, y) is out-of-bounds.
     */
    setCell(
        x: number,
        y: number,
        updates: { state?: CellState; terrainType?: TerrainType }
    ): void {
        const cell = this.getCell(x, y);
        if (!cell) {
            return;
        }

        if (updates.state !== undefined) {
            cell.state = updates.state;
        }

        if (updates.terrainType !== undefined) {
            cell.terrainType = updates.terrainType;
        }
    }

    /**
     * Get grid dimensions
     */
    getWidth(): number {
        return this.width;
    }

    getHeight(): number {
        return this.height;
    }

    getAllCells(): Cell[] {
        return [...this.cells];
    }

    /**
     * Reshape a cell to a new terrain type.
     * Marks cell as dirty and emits cellChanged event.
     */
    reshape(x: number, y: number, terrainType: TerrainType): void {
        const cell = this.getCell(x, y);
        if (!cell) {
            return;
        }

        cell.terrainType = terrainType;
        this.markDirty(x, y);
        this.emit('cellChanged', { x, y, cell } as CellChangedPayload);
    }

    /**
     * Unveil a cell, changing state from Veiled to Dormant.
     * Marks cell as dirty and emits cellChanged event.
     * Idempotent: calling on non-Veiled cell has no effect.
     */
    unveil(x: number, y: number): void {
        const cell = this.getCell(x, y);
        if (!cell || cell.state !== 'Veiled') {
            return;
        }

        cell.state = 'Dormant';
        this.markDirty(x, y);
        this.emit('cellChanged', { x, y, cell } as CellChangedPayload);
    }

    /**
     * Awaken a cell, changing state from Dormant to Active.
     * Marks cell as dirty and emits cellChanged event.
     * Idempotent: calling on non-Dormant cell has no effect.
     */
    awaken(x: number, y: number): void {
        const cell = this.getCell(x, y);
        if (!cell || cell.state !== 'Dormant') {
            return;
        }

        cell.state = 'Active';
        this.markDirty(x, y);
        this.emit('cellChanged', { x, y, cell } as CellChangedPayload);
    }

    /**
     * Apply multiple terrain changes atomically.
     * All changes are applied before emitting event.
     * Marks all affected cells as dirty and emits single batchChanged event.
     */
    reshapeBatch(
        changes: Array<{ x: number; y: number; terrainType: TerrainType }>
    ): void {
        // Early return if no changes
        if (changes.length === 0) {
            return;
        }

        // Apply all changes atomically (before emitting)
        for (const change of changes) {
            const cell = this.getCell(change.x, change.y);
            if (cell) {
                cell.terrainType = change.terrainType;
                this.markDirty(change.x, change.y);
            }
        }

        // Emit single batch event with all changes
        this.emit('batchChanged', { changes } as BatchChangedPayload);
    }

    /**
     * Get all cells within Chebyshev distance `radius` of (x, y).
     * Only in-bounds cells are returned; the center cell at distance 0 is always included.
     * Chebyshev distance: Math.max(|dx|, |dy|) <= radius, so radius r covers a (2r+1)×(2r+1) square.
     *
     * @param x - Column index of the center cell
     * @param y - Row index of the center cell
     * @param radius - Maximum Chebyshev distance; 0 returns only the center cell
     */
    getCellsInRadius(x: number, y: number, radius: number): Cell[] {
        const cells: Cell[] = [];
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const cell = this.getCell(x + dx, y + dy);
                if (cell) {
                    cells.push(cell);
                }
            }
        }
        return cells;
    }

    /**
     * Get all adjacent cells (neighbors) for a given coordinate.
     * Returns empty array if coordinate is out-of-bounds.
     * For valid coordinates, returns up to 8 neighbors depending on position:
     * - Interior cells: 8 neighbors
     * - Edge cells: 5 neighbors
     * - Corner cells: 3 neighbors
     * Out-of-bounds neighbors are omitted (no wrapping).
     */
    getAdjacentCells(x: number, y: number): Cell[] {
        // Return empty if the input coordinate itself is out-of-bounds
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return [];
        }

        const neighbors: Cell[] = [];

        // 8 directions: NW, N, NE, W, E, SW, S, SE
        const directions = [
            { dx: -1, dy: -1 }, // NW
            { dx: 0, dy: -1 },  // N
            { dx: 1, dy: -1 },  // NE
            { dx: -1, dy: 0 },  // W
            { dx: 1, dy: 0 },   // E
            { dx: -1, dy: 1 },  // SW
            { dx: 0, dy: 1 },   // S
            { dx: 1, dy: 1 },   // SE
        ];

        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            const neighbor = this.getCell(nx, ny);
            if (neighbor) {
                neighbors.push(neighbor);
            }
        }

        return neighbors;
    }

    /**
     * Place or remove a building on a cell.
     * Emits cellChanged so the renderer updates the tile immediately.
     * Does nothing if the coordinate is out-of-bounds.
     */
    setBuilding(x: number, y: number, building: BuildingType | undefined): void {
        const cell = this.getCell(x, y);
        if (!cell) return;
        cell.building = building;
        this.markDirty(x, y);
        this.emit('cellChanged', { x, y, cell } as CellChangedPayload);
    }

    /**
     * Mark a cell as dirty (modified in current pulse).
     * Dirty tracking enables efficient synergy checks.
     */
    private markDirty(x: number, y: number): void {
        this.dirty.add(`${x},${y}`);
    }

    /**
     * Get all dirty cells as array of coordinates.
     * Returns empty array if no dirty cells.
     */
    getDirtyCells(): Array<{ x: number; y: number }> {
        return Array.from(this.dirty).map((key) => {
            const [x, y] = key.split(',').map(Number);
            return { x, y };
        });
    }

    /**
     * Clear all dirty flags (called at end of Divine Pulse).
     */
    clearDirty(): void {
        this.dirty.clear();
    }

    /**
     * Serialize the grid to a JSON-compatible object.
     * Returns { width, height, cells: [...] } with deep copy of cells.
     * This is pure serialization with no storage knowledge.
     */
    toJSON(): { width: number; height: number; cells: Cell[] } {
        return {
            width: this.width,
            height: this.height,
            cells: this.cells.map((cell) => ({ ...cell })),
        };
    }

    /**
     * Reconstruct a Grid from serialized JSON data.
     * Creates new Grid instance with identical state to original.
     * Returns null if data is invalid.
     */
    static fromJSON(data: {
        width: number;
        height: number;
        cells: Cell[];
    }): Grid | null {
        // Validate input
        if (
            !data ||
            typeof data.width !== 'number' ||
            typeof data.height !== 'number' ||
            !Array.isArray(data.cells)
        ) {
            return null;
        }

        // Create grid with loaded dimensions
        const grid = new Grid(data.width, data.height);

        // Restore cell states and terrain types
        for (let i = 0; i < data.cells.length; i++) {
            const loadedCell = data.cells[i];
            const currentCell = grid.cells[i];

            if (currentCell && loadedCell) {
                currentCell.state = loadedCell.state;
                currentCell.terrainType = loadedCell.terrainType;
                currentCell.building = loadedCell.building;
            }
        }

        return grid;
    }
}