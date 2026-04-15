import {Actor, Color, Font, FontUnit, Label, vec} from 'excalibur';
import { Grid } from '../../core/grid/grid.service';

/**
 * CellInfo displays information about the selected cell in the HUD.
 * Shows terrain type, state, and coordinates.
 */
export class CellInfo extends Actor {
    private grid: Grid;
    private selectedX: number = 0;
    private selectedY: number = 0;


    // TODO REFACTOR display only when a cell is selected
    // TODO REFACTOR use a system and component to update value
    constructor(grid: Grid) {
        super({
            anchor: vec(0,0),
            x: grid.getWidth() * 32 + 16,
            y: 70,
            width: 300,
            height: 100,
            color: new Color(0,0,0, 0.7),
        });
        this.grid = grid;
    }

    /**
     * Set the selected cell to display info for.
     */
    setSelectedCell(x: number, y: number): void {
        this.selectedX = x;
        this.selectedY = y;

        const cell = this.grid.getCell(this.selectedX, this.selectedY);
        if (cell) {
            const lines = [
                `Cell: (${this.selectedX}, ${this.selectedY})`,
                `Terrain: ${cell.terrainType}`,
                `State: ${cell.state}`,
                `Adjacent Cells: ${this.grid.getAdjacentCells(this.selectedX, this.selectedY).length}`,
            ];
            lines.forEach((line, index) => {
                const lineActor = new Label({
                    anchor: vec(0,0),
                    pos: vec(10, 20 + index * 20),
                    text: line,
                    font: new Font({
                        family: 'Arial',
                        size: 12,
                        unit: FontUnit.Px,
                    }),
                    color: new Color(255, 255, 255),
                });
                this.addChild(lineActor);
            });
        } else {
            // remove all children of type Label when no cell is selected
            for (let c of this.children) {
                c.kill();
            }
        }
    }
}