import { Grid } from '../grid/grid.service';
import { Creature, CreaturesState } from './creatures.model';

/**
 * Creatures service manages legendary creatures.
 * Creatures move, interact with terrain, and respond to environmental changes.
 */
export class CreaturesService {
    private creatures: Creature[] = [];

    // Grid parameter kept for future use in creature movement logic
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_grid: Grid) {}

    /**
     * Update creature positions and states during Divine Pulse.
     * Creatures move based on terrain changes and interact with the world.
     */
    update(): void {
        // For v0.1, creatures are placeholders
        // Future: implement pathfinding, combat, environmental interactions
        for (const creature of this.creatures) {
            this.updateCreature(creature);
        }
    }

    /**
     * Update a single creature's state
     */
    private updateCreature(creature: Creature): void {
        // Placeholder: In v0.1, creatures don't move yet
        // Future implementation will check nearby cells and decide movement
    }

    /**
     * Spawn a creature in the world
     */
    spawnCreature(id: string, name: string, x: number, y: number, maxHealth: number = 100): void {
        const newCreature: Creature = {
            id,
            name,
            x,
            y,
            health: maxHealth,
            maxHealth,
        };
        this.creatures.push(newCreature);
    }

    /**
     * Get all creatures
     */
    getCreatures(): Creature[] {
        return [...this.creatures];
    }

    /**
     * Get creature count
     */
    getCount(): number {
        return this.creatures.length;
    }

    /**
     * Get state snapshot
     */
    getState(): CreaturesState {
        return {
            creatures: [...this.creatures],
            count: this.creatures.length,
        };
    }
}