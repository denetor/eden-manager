import { Actor, Color, Line, vec } from 'excalibur';

/**
 * Highlights the selected cell with a colored border.
 * Initially invisible; becomes visible when a cell is selected via updateSelection().
 */
export class HighlightedCell extends Actor {
    private readonly tileSize: number;
    private readonly borderColor: Color;

    constructor(tileSize: number, borderColor: Color) {
        super();
        this.anchor = vec(0, 0);
        this.tileSize = tileSize;
        this.borderColor = borderColor;
        this.visible = false; // Initially hidden until a cell is selected
    }

    override onInitialize(): void {
        // Create 4 line actors to form a rectangle border
        const size = this.tileSize;

        // LEFT vertical line
        this.addChild(
            new Actor({
                anchor: vec(0, 0),
                graphic: new Line({
                    start: vec(0, 0),
                    end: vec(0, size),
                    color: this.borderColor,
                    thickness: 2,
                }),
            })
        );

        // BOTTOM horizontal line
        this.addChild(
            new Actor({
                anchor: vec(0, 0),
                graphic: new Line({
                    start: vec(0, size),
                    end: vec(size, size),
                    color: this.borderColor,
                    thickness: 2,
                }),
            })
        );

        // RIGHT vertical line
        this.addChild(
            new Actor({
                anchor: vec(0, 0),
                graphic: new Line({
                    start: vec(size, size),
                    end: vec(size, 0),
                    color: this.borderColor,
                    thickness: 2,
                }),
            })
        );

        // TOP horizontal line
        this.addChild(
            new Actor({
                anchor: vec(0, 0),
                graphic: new Line({
                    start: vec(size, 0),
                    end: vec(0, 0),
                    color: this.borderColor,
                    thickness: 2,
                }),
            })
        );
    }

    /**
     * Update the highlighted cell position based on grid coordinates.
     * If x or y is undefined, the highlight is hidden.
     *
     * @param x Grid x-coordinate (undefined to hide)
     * @param y Grid y-coordinate (undefined to hide)
     */
    updateSelection(x: number | undefined, y: number | undefined): void {
        if (x === undefined || y === undefined) {
            this.visible = false;
        } else {
            this.visible = true;
            this.pos = vec(x * this.tileSize, y * this.tileSize);
        }
    }
}