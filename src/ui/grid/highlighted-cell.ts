import { Actor, vec, Vector } from 'excalibur';
import { CoordinateSystem } from '../../graphics/coordinate-system';
import {Sprites} from "../../resources";

/**
 * Highlights the selected cell with a colored border.
 * Uses CoordinateSystem to position itself in the game world (isometric or orthogonal).
 * Initially invisible; becomes visible when a cell is selected via updateSelection().
 */
export class HighlightedCell extends Actor {
    private readonly coordinateSystem: CoordinateSystem;

    constructor(
        coordinateSystem: CoordinateSystem
    ) {
        super();
        this.anchor = vec(0, 0);
        this.coordinateSystem = coordinateSystem;
        this.active = false; // Initially inactive until a cell is selected
    }

    override onInitialize(): void {
        this.graphics.add(Sprites.selected);
    }

    /**
     * Update the highlighted cell position based on grid coordinates.
     * Uses CoordinateSystem to transform grid coordinates to world position.
     * If x or y is undefined, the highlight is hidden.
     *
     * @param x Grid x-coordinate (undefined to hide)
     * @param y Grid y-coordinate (undefined to hide)
     */
    updateSelection(x: number | undefined, y: number | undefined): void {
        if (x === undefined || y === undefined) {
            this.active = false;
        } else {
            this.active = true;
            // Use CoordinateSystem to get world position for the grid coordinates
            const tilePos = new Vector(x, y);
            const worldPos = this.coordinateSystem.tileToWorld(tilePos);
            this.pos = worldPos;
            console.log(`HighlightedCell: grid (${x}, ${y}) → world (${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)})`);
        }
    }
}