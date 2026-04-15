import { EventEmitter } from 'events';
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
}