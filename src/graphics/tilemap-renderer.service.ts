import { TileMap } from 'excalibur';
import { Grid } from '../core/grid/grid.service';
import { Cell, TerrainType, CellState } from '../core/grid/grid.model';
import { ICellRenderer } from './cell-renderer.model';

/**
 * TileMapRenderer renders a Grid using Excalibur's TileMap.
 * Listens to Grid events and updates tiles when cells change.
 * Decouples game logic (Grid) from rendering (TileMap).
 */
export class TileMapRenderer implements ICellRenderer {
    private tileMap: TileMap;

    /**
     * Maps terrain type to base tile ID (before state offset).
     * Spritesheet convention: meadow=1, forest=2, mountain=3, water=4, ruins=5
     */
    private readonly TERRAIN_TO_TILE_ID: Record<TerrainType, number> = {
        'Meadow': 1,
        'Forest': 2,
        'Mountain': 3,
        'Water': 4,
        'Ruins': 5,
        'Fertile Plain': 6,
        'Sacred Grove': 7,
        'Foothill': 8,
        'Hidden Temple': 9,
    };

    /**
     * State offsets applied to base terrain ID.
     * Veiled: +100, Dormant: +200, Active: +300
     */
    private readonly STATE_OFFSET: Record<CellState, number> = {
        'Veiled': 100,
        'Dormant': 200,
        'Active': 300,
    };

    constructor(tileMap: TileMap, grid: Grid) {
        this.tileMap = tileMap;
        this.subscribeToGridEvents(grid);
    }

    /**
     * Subscribe to Grid events and update tiles when cells change.
     */
    private subscribeToGridEvents(grid: Grid): void {
        // Listen to single cell changes
        grid.on('cellChanged', (payload: any) => {
            const { x, y, cell } = payload;
            this.updateCell(x, y, cell);
        });

        // Listen to batch changes
        grid.on('batchChanged', (payload: any) => {
            const { changes } = payload;
            for (const change of changes) {
                const cell = grid.getCell(change.x, change.y);
                if (cell) {
                    this.updateCell(change.x, change.y, cell);
                }
            }
        });
    }

    /**
     * Calculate the tile ID for a cell based on terrain + state.
     * Formula: baseTerrainId + stateOffset
     * Example: Forest (2) + Dormant (200) = 202
     */
    private calculateTileId(cell: Cell): number {
        const baseId = this.TERRAIN_TO_TILE_ID[cell.terrainType];
        const stateOffset = this.STATE_OFFSET[cell.state];
        return baseId + stateOffset;
    }

    /**
     * Update the visual representation of a cell at (x, y).
     * Calculates the tile ID and updates the TileMap.
     */
    updateCell(x: number, y: number, cell: Cell): void {
        const tileId = this.calculateTileId(cell);
        // Excalibur TileMap uses setTile(x, y, tileId) to update a cell
        this.tileMap.setTile(x, y, tileId);
    }

    /**
     * Get the TileMap instance (for testing or external access).
     */
    getTileMap(): TileMap {
        return this.tileMap;
    }
}