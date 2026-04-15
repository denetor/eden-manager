import { Cell, CellState, TerrainType } from './grid.model';

/**
 * Grid manages a 2D world as a flat array of cells.
 * Stores cells indexed as: cells[x + y * width]
 */
export class Grid {
    private width: number;
    private height: number;
    private cells: Cell[];

    /**
     * Create a new Grid with given dimensions.
     * All cells initialized to Veiled state with Meadow terrain.
     */
    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.cells = [];

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
}