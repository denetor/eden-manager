import { Vector, IsometricMap } from 'excalibur';
import { CoordinateSystem } from './coordinate-system';

/**
 * IsometricCoordinateSystem is a thin wrapper around Excalibur's IsometricMap native coordinate transforms.
 * It delegates all isometric math to IsometricMap's worldToTile() and tileToWorld() methods,
 * avoiding custom math and leveraging the framework's built-in API.
 *
 * Tile coordinates are rounded via Math.floor() for standard grid cell lookup behavior.
 */
export class IsometricCoordinateSystem implements CoordinateSystem {
    private isometricMap: IsometricMap;

    constructor(isometricMap: IsometricMap) {
        this.isometricMap = isometricMap;
    }

    /**
     * Transform world-space coordinates (pixels) to grid coordinates (tile indices).
     * Delegates to IsometricMap's native worldToTile() and floors the result for grid lookup.
     *
     * @param worldPos - Position in world space (Vector)
     * @returns Floored grid coordinates (0-15, 0-15 for a 16×16 grid)
     */
    worldToTile(worldPos: Vector): Vector {
        const tilePos = this.isometricMap.worldToTile(worldPos);
        // Floor coordinates for standard grid cell lookup
        return new Vector(Math.floor(tilePos.x), Math.floor(tilePos.y));
    }

    /**
     * Transform grid coordinates (tile indices) to world-space coordinates (pixels).
     * Delegates to IsometricMap's native tileToWorld() method.
     *
     * @param tilePos - Grid coordinates (0-15, 0-15 for a 16×16 grid)
     * @returns Position in world space (Vector)
     */
    tileToWorld(tilePos: Vector): Vector {
        return this.isometricMap.tileToWorld(tilePos);
    }
}