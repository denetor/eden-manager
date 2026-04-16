import { Vector } from 'excalibur';

/**
 * CoordinateSystem abstracts the transformation between world coordinates and tile grid coordinates.
 * This enables future perspective swaps (e.g., isometric → top-down in v1.1) without refactoring game logic.
 *
 * Implementations must handle:
 * - Converting world space (pixel coordinates) to grid space (cell indices 0-15)
 * - Converting grid space to world space
 * - Tile coordinate rounding via Math.floor() for grid cell lookup
 */
export interface CoordinateSystem {
    /**
     * Transform world-space coordinates (pixels) to grid coordinates (cell indices).
     * Input is already in world space (Excalibur applies camera transforms automatically).
     * Returns floored integer coordinates for grid cell lookup.
     *
     * @param worldPos - Position in world space (Vector with x, y in pixels)
     * @returns Grid coordinates (0-15, 0-15 for a 16×16 grid)
     */
    worldToTile(worldPos: Vector): Vector;

    /**
     * Transform grid coordinates (cell indices) to world-space coordinates (pixels).
     * Used for positioning actors (e.g., HighlightedCell) on the grid.
     *
     * @param tilePos - Grid coordinates (0-15, 0-15 for a 16×16 grid)
     * @returns Position in world space (Vector with x, y in pixels)
     */
    tileToWorld(tilePos: Vector): Vector;
}