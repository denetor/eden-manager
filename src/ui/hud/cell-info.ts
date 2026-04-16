import {Actor, Color, Font, FontUnit, Label, vec} from 'excalibur';
import { Grid } from '../../core/grid/grid.service';

/**
 * CellInfo displays information about the selected cell in the HUD.
 * Shows terrain type, state, and coordinates. Only visible when a cell is selected.
 */
export class CellInfo extends Actor {
    private grid: Grid;
    private readonly positionLabel: Label;
    private readonly terrainLabel: Label;
    private readonly stateLabel: Label;
    private readonly adjacentLabel: Label;

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

        // Create persistent label children (updated on cell selection, not recreated)
        this.positionLabel = new Label({
            anchor: vec(0,0),
            pos: vec(10, 20),
            text: '',
            font: new Font({
                family: 'Arial',
                size: 12,
                unit: FontUnit.Px,
            }),
            color: new Color(255, 255, 255),
        });

        this.terrainLabel = new Label({
            anchor: vec(0,0),
            pos: vec(10, 40),
            text: '',
            font: new Font({
                family: 'Arial',
                size: 12,
                unit: FontUnit.Px,
            }),
            color: new Color(255, 255, 255),
        });

        this.stateLabel = new Label({
            anchor: vec(0,0),
            pos: vec(10, 60),
            text: '',
            font: new Font({
                family: 'Arial',
                size: 12,
                unit: FontUnit.Px,
            }),
            color: new Color(255, 255, 255),
        });

        this.adjacentLabel = new Label({
            anchor: vec(0,0),
            pos: vec(10, 80),
            text: '',
            font: new Font({
                family: 'Arial',
                size: 12,
                unit: FontUnit.Px,
            }),
            color: new Color(255, 255, 255),
        });

        this.addChild(this.positionLabel);
        this.addChild(this.terrainLabel);
        this.addChild(this.stateLabel);
        this.addChild(this.adjacentLabel);

        // Initially hidden until a cell is selected
        this.hide();
    }

    /**
     * Set the selected cell to display info for.
     */
    setSelectedCell(x: number, y: number): void {
        const cell = this.grid.getCell(x, y);
        if (cell) {
            this.positionLabel.text = `Cell: (${x}, ${y})`;
            this.terrainLabel.text = `Terrain: ${cell.terrainType}`;
            this.stateLabel.text = `State: ${cell.state}`;
            this.adjacentLabel.text = `Adjacent Cells: ${this.grid.getAdjacentCells(x, y).length}`;
            this.show();
        } else {
            this.hide();
        }
    }

    /**
     * Show the cell info panel and all labels.
     */
    private show(): void {
        this.scale = vec(1, 1);
    }

    /**
     * Hide the cell info panel and all labels.
     */
    private hide(): void {
        this.scale = vec(0, 0);
    }
}