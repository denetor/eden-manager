import { Cell } from '../core/grid/grid.model';

/**
 * ICellRenderer defines the contract for rendering a cell.
 * This allows different renderers (TileMap, Isometric, etc.) to implement
 * cell visualization without changing game logic.
 */
export interface ICellRenderer {
    /**
     * Update the visual representation of a cell at (x, y).
     * Called when the cell's state or terrain changes.
     * @param x - Grid X coordinate
     * @param y - Grid Y coordinate
     * @param cell - The updated cell data
     */
    updateCell(x: number, y: number, cell: Cell): void;
}