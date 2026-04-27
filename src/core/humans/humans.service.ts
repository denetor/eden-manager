import { EventEmitter } from '../../shared/event-emitter';
import { Grid } from '../grid/grid.service';
import { Human, HumansState } from './humans.model';

/**
 * Payload emitted by the humanStatusChanged event when a human's survival status transitions.
 */
export interface HumanStatusChangedPayload {
    id: string;
    x: number;
    y: number;
    status: 'Active' | 'Dormant';
}

const WATER_RADIUS = 3;
const FOOD_RADIUS = 2;

/**
 * Humans service manages autonomous human settlements and their survival status.
 * Extends EventEmitter to emit `humanStatusChanged` on every Active↔Dormant transition.
 */
export class HumansService extends EventEmitter {
    private humans: Human[] = [];
    private grid: Grid;

    /**
     * Create the service.
     * @param grid - Grid reference used for Chebyshev radius lookups during necessity checks
     */
    constructor(grid: Grid) {
        super();
        this.grid = grid;
    }

    /**
     * Update every human's survival status during a Divine Pulse.
     * Checks water (radius 3) and food (radius 2) against Active terrain cells.
     * Emits `humanStatusChanged` only when a human's status actually changes.
     */
    update(): void {
        for (const human of this.humans) {
            this.checkNecessities(human);
        }
    }

    /**
     * Evaluate and apply the survival status for one human.
     * Emits `humanStatusChanged` and logs to console on any transition.
     *
     * @param human - The human whose position is evaluated
     */
    private checkNecessities(human: Human): void {
        const newStatus = this.computeStatus(human);
        if (newStatus !== human.status) {
            human.status = newStatus;
            console.log(`Human ${human.id} at (${human.x}, ${human.y}) → ${newStatus}`);
            this.emit('humanStatusChanged', {
                id: human.id,
                x: human.x,
                y: human.y,
                status: newStatus,
            } as HumanStatusChangedPayload);
        }
    }

    /**
     * Determine whether a human's survival needs are met based on nearby Active terrain.
     * Returns 'Active' if both water (radius 3) and food (radius 2) are found, 'Dormant' otherwise.
     *
     * @param human - The human whose grid position is used as the search center
     */
    private computeStatus(human: Human): 'Active' | 'Dormant' {
        const waterCells = this.grid.getCellsInRadius(human.x, human.y, WATER_RADIUS);
        const hasWater = waterCells.some(
            cell => cell.state === 'Active' && cell.terrainType === 'Water'
        );

        const foodCells = this.grid.getCellsInRadius(human.x, human.y, FOOD_RADIUS);
        const hasFood = foodCells.some(
            cell =>
                cell.state === 'Active' &&
                (cell.terrainType === 'Meadow' || cell.terrainType === 'Fertile Plain')
        );

        return hasWater && hasFood ? 'Active' : 'Dormant';
    }

    /**
     * Add a human to the world.
     * New humans start as Active (before the first necessity check runs).
     *
     * @param id - Unique identifier for the human
     * @param x - Column index
     * @param y - Row index
     */
    addHuman(id: string, x: number, y: number): void {
        const newHuman: Human = {
            id,
            x,
            y,
            state: 'idle',
            status: 'Active',
        };
        this.humans.push(newHuman);
    }

    /**
     * Get a shallow copy of all humans.
     */
    getHumans(): Human[] {
        return [...this.humans];
    }

    /**
     * Get the total number of humans.
     */
    getCount(): number {
        return this.humans.length;
    }

    /**
     * Get a snapshot of the humans system state.
     */
    getState(): HumansState {
        return {
            population: [...this.humans],
            totalCount: this.humans.length,
        };
    }

    /**
     * Serialize to a JSON-compatible object.
     */
    toJSON(): { humans: Human[] } {
        return { humans: this.humans.map(h => ({ ...h })) };
    }

    /**
     * Reconstruct a HumansService from serialized data.
     * Defaults `status` to 'Active' for records that predate this field.
     *
     * @param data - Serialized humans data
     * @param grid - Grid reference for the restored service
     */
    static fromJSON(data: { humans: Human[] }, grid: Grid): HumansService | null {
        if (!data || !Array.isArray(data.humans)) return null;
        const service = new HumansService(grid);
        service.humans = data.humans.map(h => ({ ...h, status: h.status ?? 'Active' }));
        return service;
    }
}
