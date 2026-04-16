import { Actor, Color, Line, vec, Vector } from 'excalibur';
import { CoordinateSystem } from '../../graphics/coordinate-system';

/**
 * Highlights the selected cell with a colored border.
 * Uses CoordinateSystem to position itself in the game world (isometric or orthogonal).
 * Initially invisible; becomes visible when a cell is selected via updateSelection().
 */
export class HighlightedCell extends Actor {
    private readonly tileWidth: number;
    private readonly tileHeight: number;
    private readonly borderColor: Color;
    private readonly coordinateSystem: CoordinateSystem;

    constructor(
        tileWidth: number,
        tileHeight: number,
        borderColor: Color,
        coordinateSystem: CoordinateSystem
    ) {
        super();
        this.anchor = vec(0, 0);
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.borderColor = borderColor;
        this.coordinateSystem = coordinateSystem;
        this.active = false; // Initially inactive until a cell is selected
    }

    override onInitialize(): void {
        // Create 4 line actors to form a diamond border (isometric shape)
        const w = this.tileWidth;
        const h = this.tileHeight;

        // For isometric tiles (diamond shape), create a diamond border
        // Isometric diamond has corners at: top (w/2, 0), right (w, h/2), bottom (w/2, h), left (0, h/2)

        // TOP-RIGHT diagonal line
        this.addChild(
            new Actor({
                anchor: vec(0, 0),
                graphic: new Line({
                    start: vec(w / 2, 0),
                    end: vec(w, h / 2),
                    color: this.borderColor,
                    thickness: 2,
                }),
            })
        );

        // BOTTOM-RIGHT diagonal line
        this.addChild(
            new Actor({
                anchor: vec(0, 0),
                graphic: new Line({
                    start: vec(w, h / 2),
                    end: vec(w / 2, h),
                    color: this.borderColor,
                    thickness: 2,
                }),
            })
        );

        // BOTTOM-LEFT diagonal line
        this.addChild(
            new Actor({
                anchor: vec(0, 0),
                graphic: new Line({
                    start: vec(w / 2, h),
                    end: vec(0, h / 2),
                    color: this.borderColor,
                    thickness: 2,
                }),
            })
        );

        // TOP-LEFT diagonal line
        this.addChild(
            new Actor({
                anchor: vec(0, 0),
                graphic: new Line({
                    start: vec(0, h / 2),
                    end: vec(w / 2, 0),
                    color: this.borderColor,
                    thickness: 2,
                }),
            })
        );
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