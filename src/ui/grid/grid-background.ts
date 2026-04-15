import {Actor, Color, Line, vec} from "excalibur";


/**
 * Grid to be applied on the TileMap
 */
export class GridBackground extends Actor {
    
    constructor(options: {width: number, height: number, tileSize: number}) {
        super({
            anchor: vec(0,0),
        });
        const gridColor = new Color(255, 255, 255, 0.25);

        // horizontal lines
        let currentY = 0;
        let maxX = options.width * options.tileSize;
        for (let y = 0; y <= options.height; y++) {
            this.addChild(new Actor({
                anchor: vec(0,0),
                graphic: new Line({
                    start: vec(0, currentY),
                    end: vec(maxX, currentY),
                    color: gridColor,
                    thickness: 2,
                }),
            }));
            currentY += options.tileSize;
        }

        // vertical lines
        let currentX = 0;
        let maxY = options.width * options.tileSize;
        for (let x = 0; x <= options.width; x++) {
            this.addChild(new Actor({
                anchor: vec(0,0),
                graphic: new Line({
                    start: vec(currentX, 0),
                    end: vec(currentX, maxY),
                    color: gridColor,
                    thickness: 2,
                }),
            }));
            currentX += options.tileSize;
        }
    }
}