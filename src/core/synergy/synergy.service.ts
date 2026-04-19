import { Grid } from '../grid/grid.service';

/**
 * SynergyEngine applies cell-to-cell synergy transformations.
 * Reads dirty cells from the Grid and applies rules based on neighboring terrain.
 */
export class SynergyEngine {
    constructor(private grid: Grid) {}

    /**
     * Apply synergy rules to all dirty cells.
     * For each dirty cell and its neighbors, check synergy patterns.
     * Transformations are applied via grid.reshape(), which marks cells dirty.
     */
    apply(): void {
        const dirtyCells = this.grid.getDirtyCells();

        // For each dirty cell, check synergies involving it and its neighbors
        for (const dirtyCoord of dirtyCells) {
            this.checkSynergies(dirtyCoord.x, dirtyCoord.y);
        }
    }

    /**
     * Check all synergy patterns for a cell and its neighbors.
     */
    private checkSynergies(x: number, y: number): void {
        const cell = this.grid.getCell(x, y);
        // ignore for inactive cells
        if (!cell || cell.state !== 'Active') {
            return;
        }

        // Rule 1: Water + Meadow → Fertile Plain
        this.checkWaterMeadowRule(x, y);

        // Rule 2: 3+ adjacent Forests → Sacred Grove
        this.checkForestRule(x, y);

        // Rule 3: Meadow + Mountain → Foothill
        this.checkMeadowMountainRule(x, y);

        // Rule 4: Ruins + Forest → Hidden Temple
        this.checkRuinsForestRule(x, y);
    }

    /**
     * Rule 1: Water + Meadow → Fertile Plain
     * If a Meadow has a Water neighbor (or vice versa), transform Meadow to Fertile Plain.
     */
    private checkWaterMeadowRule(x: number, y: number): void {
        const cell = this.grid.getCell(x, y);
        if (!cell) {
            return;
        }

        // Check if this Meadow has a Water neighbor
        if (cell.terrainType === 'Meadow') {
            const neighbors = this.grid.getAdjacentCells(x, y);
            if (neighbors.some((n) => n.terrainType === 'Water' && n.state === 'Active')) {
                this.grid.reshape(x, y, 'Fertile Plain');
            }
        }

        // Check if this Water has a Meadow neighbor
        if (cell.terrainType === 'Water') {
            const neighbors = this.grid.getAdjacentCells(x, y);
            for (const neighbor of neighbors) {
                if (neighbor.terrainType === 'Meadow' && neighbor.state === 'Active') {
                    this.grid.reshape(neighbor.x, neighbor.y, 'Fertile Plain');
                }
            }
        }
    }

    /**
     * Rule 2: 3+ adjacent Forests → Sacred Grove
     * If a Forest has 3 or more Forest neighbors, transform it to Sacred Grove.
     */
    private checkForestRule(x: number, y: number): void {
        const cell = this.grid.getCell(x, y);
        if (!cell || cell.terrainType !== 'Forest') {
            return;
        }

        const neighbors = this.grid.getAdjacentCells(x, y);
        const forestNeighborCount = neighbors.filter((n) => n.terrainType === 'Forest' && n.state === 'Active').length;

        if (forestNeighborCount >= 3) {
            this.grid.reshape(x, y, 'Sacred Grove');
        }
    }

    /**
     * Rule 3: Meadow + Mountain → Foothill
     * If a Meadow has a Mountain neighbor (or vice versa), transform Meadow to Foothill.
     */
    private checkMeadowMountainRule(x: number, y: number): void {
        const cell = this.grid.getCell(x, y);
        if (!cell) {
            return;
        }

        // Check if this Meadow has a Mountain neighbor
        if (cell.terrainType === 'Meadow') {
            const neighbors = this.grid.getAdjacentCells(x, y);
            if (neighbors.some((n) => n.terrainType === 'Mountain' && n.state === 'Active')) {
                this.grid.reshape(x, y, 'Foothill');
            }
        }

        // Check if this Mountain has a Meadow neighbor
        if (cell.terrainType === 'Mountain') {
            const neighbors = this.grid.getAdjacentCells(x, y);
            for (const neighbor of neighbors) {
                if (neighbor.terrainType === 'Meadow' && neighbor.state === 'Active') {
                    this.grid.reshape(neighbor.x, neighbor.y, 'Foothill');
                }
            }
        }
    }

    /**
     * Rule 4: Ruins + Forest → Hidden Temple
     * If Ruins has a Forest neighbor (or vice versa), transform Ruins to Hidden Temple.
     */
    private checkRuinsForestRule(x: number, y: number): void {
        const cell = this.grid.getCell(x, y);
        if (!cell) {
            return;
        }

        // Check if this Ruins has a Forest neighbor
        if (cell.terrainType === 'Ruins') {
            const neighbors = this.grid.getAdjacentCells(x, y);
            if (neighbors.some((n) => n.terrainType === 'Forest' && n.state === 'Active')) {
                this.grid.reshape(x, y, 'Hidden Temple');
            }
        }

        // Check if this Forest has a Ruins neighbor
        if (cell.terrainType === 'Forest') {
            const neighbors = this.grid.getAdjacentCells(x, y);
            for (const neighbor of neighbors) {
                if (neighbor.terrainType === 'Ruins' && neighbor.state === 'Active') {
                    this.grid.reshape(neighbor.x, neighbor.y, 'Hidden Temple');
                }
            }
        }
    }
}