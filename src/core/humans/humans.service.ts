import { Grid } from '../grid/grid.service';
import { Human, HumansState } from './humans.model';

/**
 * Humans service manages autonomous human settlements.
 * Humans respond to environmental changes and move/settle based on terrain.
 */
export class HumansService {
    private humans: Human[] = [];

    constructor(private grid: Grid) {}

    /**
     * Update human positions and states during Divine Pulse.
     * Humans respond to nearby terrain changes.
     */
    update(): void {
        // For v0.1, humans are placeholders
        // Future: implement pathfinding, settlement behavior, reproduction
        for (const human of this.humans) {
            this.updateHuman(human);
        }
    }

    /**
     * Update a single human's state
     */
    private updateHuman(human: Human): void {
        // Placeholder: In v0.1, humans don't move yet
        // Future implementation will check nearby cells and decide movement
    }

    /**
     * Add a human to the world
     */
    addHuman(id: string, x: number, y: number): void {
        const newHuman: Human = {
            id,
            x,
            y,
            state: 'idle',
        };
        this.humans.push(newHuman);
    }

    /**
     * Get all humans
     */
    getHumans(): Human[] {
        return [...this.humans];
    }

    /**
     * Get human count
     */
    getCount(): number {
        return this.humans.length;
    }

    /**
     * Get state snapshot
     */
    getState(): HumansState {
        return {
            population: [...this.humans],
            totalCount: this.humans.length,
        };
    }
}