import { Actor, Engine, Vector } from 'excalibur';
import { Grid } from '../../core/grid/grid.service';

/**
 * CellInfo displays information about the selected cell in the HUD.
 * Shows terrain type, state, and coordinates.
 */
export class CellInfo extends Actor {
    private grid: Grid;
    private engine: Engine;
    private selectedX: number = 0;
    private selectedY: number = 0;

    constructor(grid: Grid, engine: Engine) {
        super({
            x: 20,
            y: 70,
            width: 300,
            height: 100,
            color: undefined,
        });
        this.grid = grid;
        this.engine = engine;
    }

    /**
     * Set the selected cell to display info for.
     */
    setSelectedCell(x: number, y: number): void {
        this.selectedX = x;
        this.selectedY = y;
    }

    override onPostDraw(ctx: CanvasRenderingContext2D): void {
        const cell = this.grid.getCell(this.selectedX, this.selectedY);
        if (!cell) {
            return;
        }

        // Draw background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(this.pos.x, this.pos.y, 300, 100);

        // Draw border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.pos.x, this.pos.y, 300, 100);

        // Draw text
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';

        const lines = [
            `Cell: (${this.selectedX}, ${this.selectedY})`,
            `Terrain: ${cell.terrainType}`,
            `State: ${cell.state}`,
            `Adjacent Cells: ${this.grid.getAdjacentCells(this.selectedX, this.selectedY).length}`,
        ];

        lines.forEach((line, index) => {
            ctx.fillText(line, this.pos.x + 10, this.pos.y + 20 + index * 20);
        });
    }
}