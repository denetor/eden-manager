import { Grid } from '../grid/grid.service';
import { Cell } from '../grid/grid.model';
import { HumansService } from '../humans/humans.service';
import { BuildingType } from './building-synergy.model';

const WATER_RADIUS = 3;

const ORTHOGONAL = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
];

/**
 * BuildingSynergyService evaluates building rules each Divine Pulse.
 * For every Active human, it checks the cell they occupy and places
 * a structure if conditions are met and no building already exists.
 */
export class BuildingSynergyService {
    constructor(private grid: Grid, private humans: HumansService) {}

    apply(): void {
        for (const human of this.humans.getHumans()) {
            if (human.status !== 'Active') continue;
            this.checkBuildingRules(human.x, human.y);
        }
    }

    private checkBuildingRules(x: number, y: number): void {
        const cell = this.grid.getCell(x, y);
        if (!cell || cell.state !== 'Active' || cell.building) return;

        const building = this.computeBuilding(cell, x, y);
        if (building) {
            this.grid.setBuilding(x, y, building);
        }
    }

    private computeBuilding(cell: Cell, x: number, y: number): BuildingType | null {
        const hasWater = this.hasWaterInRadius(x, y);

        // Farm: Fertile Plain + water nearby
        if (cell.terrainType === 'Fertile Plain' && hasWater) {
            return 'Farm';
        }

        // Mill: Meadow or Fertile Plain + orthogonal Farm + water nearby
        if ((cell.terrainType === 'Meadow' || cell.terrainType === 'Fertile Plain') && hasWater) {
            if (this.hasOrthogonalFarm(x, y)) {
                return 'Mill';
            }
        }

        // Shrine: Sacred Grove
        if (cell.terrainType === 'Sacred Grove') {
            return 'Shrine';
        }

        // Tower: Foothill, no other tower within 3 tiles
        if (cell.terrainType === 'Foothill' && !this.hasTowerInRadius(x, y, 3)) {
            return 'Tower';
        }

        return null;
    }

    private hasWaterInRadius(x: number, y: number): boolean {
        return this.grid.getCellsInRadius(x, y, WATER_RADIUS).some(
            c => c.terrainType === 'Water' && c.state === 'Active'
        );
    }

    private hasTowerInRadius(x: number, y: number, radius: number): boolean {
        return this.grid.getCellsInRadius(x, y, radius).some(
            c => c.building === 'Tower'
        );
    }

    private hasOrthogonalFarm(x: number, y: number): boolean {
        return ORTHOGONAL.some(({ dx, dy }) => {
            const neighbor = this.grid.getCell(x + dx, y + dy);
            return neighbor?.building === 'Farm';
        });
    }
}
