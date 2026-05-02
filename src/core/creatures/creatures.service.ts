import { EventEmitter } from '../../shared/event-emitter';
import { Grid } from '../grid/grid.service';
import { Cell } from '../grid/grid.model';
import { Creature, CreatureType, CreaturesState } from './creatures.model';

export interface CreatureSpawnedPayload {
    x: number;
    y: number;
    type: CreatureType;
}

const SPAWN_CHANCE = 0.05;

/**
 * CreaturesService manages legendary creatures.
 * On each Divine Pulse it attempts to spawn creatures whose habitat conditions are met.
 * At most one creature of each type may exist on the map simultaneously.
 * Extends EventEmitter to emit `creatureSpawned` when a new creature appears.
 */
export class CreaturesService extends EventEmitter {
    private creatures: Creature[] = [];
    private grid: Grid;

    constructor(grid: Grid) {
        super();
        this.grid = grid;
    }

    /**
     * Called every Divine Pulse. Attempts to spawn each creature type.
     */
    update(): void {
        this.checkAndSpawn();
    }

    private checkAndSpawn(): void {
        this.trySpawn('StoneGiant', (cell: Cell) =>
            cell.state === 'Active' &&
            cell.terrainType === 'Mountain' &&
            this.orthogonalNeighbors(cell.x, cell.y).filter(n => n.terrainType === 'Mountain').length >= 2
        );

        this.trySpawn('SeaSerpent', (cell: Cell) =>
            cell.state === 'Active' && cell.terrainType === 'Water'
        );

        this.trySpawn('LuminousSwarm', (cell: Cell) =>
            cell.state === 'Active' && cell.terrainType === 'Sacred Grove'
        );
    }

    private trySpawn(type: CreatureType, qualifies: (cell: Cell) => boolean): void {
        if (this.creatures.some(c => c.type === type)) return;

        const candidates = this.grid.getAllCells().filter(qualifies);
        if (candidates.length === 0) return;
        if (Math.random() >= SPAWN_CHANCE) return;

        const cell = candidates[Math.floor(Math.random() * candidates.length)];
        const creature: Creature = {
            id: `${type}_${Date.now()}`,
            type,
            x: cell.x,
            y: cell.y,
        };
        this.creatures.push(creature);
        console.log(`Creature spawned: ${type} at (${cell.x}, ${cell.y})`);
        this.emit('creatureSpawned', { x: cell.x, y: cell.y, type } as CreatureSpawnedPayload);
    }

    private orthogonalNeighbors(x: number, y: number): Cell[] {
        return this.grid.getAdjacentCells(x, y).filter(
            n => Math.abs(n.x - x) + Math.abs(n.y - y) === 1
        );
    }

    getCreatures(): Creature[] {
        return [...this.creatures];
    }

    getCount(): number {
        return this.creatures.length;
    }

    getState(): CreaturesState {
        return {
            creatures: [...this.creatures],
            count: this.creatures.length,
        };
    }

    toJSON(): { creatures: Creature[] } {
        return { creatures: this.creatures.map(c => ({ ...c })) };
    }

    static fromJSON(data: { creatures: Creature[] }, grid: Grid): CreaturesService | null {
        if (!data || !Array.isArray(data.creatures)) return null;
        const service = new CreaturesService(grid);
        service.creatures = data.creatures.map(c => ({ ...c }));
        return service;
    }
}
