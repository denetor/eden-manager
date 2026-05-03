import { EventEmitter } from '../../shared/event-emitter';
import { Grid } from '../grid/grid.service';
import { Cell } from '../grid/grid.model';
import { Creature, CreatureType, CreaturesState } from './creatures.model';
import { CREATURE_DESPAWN_PROBABILITY } from '../../shared/constants';

export interface CreatureSpawnedPayload {
    id: string;
    x: number;
    y: number;
    type: CreatureType;
}

export interface CreatureMovedPayload {
    id: string;
    type: CreatureType;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
}

export interface CreatureDespawnedPayload {
    id: string;
    type: CreatureType;
    x: number;
    y: number;
}

const SPAWN_CHANCE = 0.05;
const MOVE_CHANCE = 0.5;

const ORTHOGONAL_DIRECTIONS = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
];

/**
 * CreaturesService manages legendary creatures.
 * Each Divine Pulse: moves existing creatures, despawns some, then attempts spawning new ones.
 * At most one creature of each type may exist on the map simultaneously (spawn rule only).
 */
export class CreaturesService extends EventEmitter {
    private creatures: Creature[] = [];
    private grid: Grid;

    constructor(grid: Grid) {
        super();
        this.grid = grid;
    }

    update(): number {
        for (const creature of this.creatures) {
            this.moveCreature(creature);
        }
        this.despawnCreatures();

        let manaBonus = 0;
        for (const creature of this.creatures) {
            manaBonus += this.applyEffects(creature);
        }

        this.checkAndSpawn();
        return manaBonus;
    }

    private moveCreature(creature: Creature): void {
        if (Math.random() < MOVE_CHANCE) return;

        const validNeighbors = ORTHOGONAL_DIRECTIONS
            .map(dir => ({ x: creature.x + dir.dx, y: creature.y + dir.dy }))
            .filter(pos =>
                pos.x >= 0 && pos.x < this.grid.getWidth() &&
                pos.y >= 0 && pos.y < this.grid.getHeight()
            )
            .filter(pos => !this.creatures.some(c => c.id !== creature.id && c.x === pos.x && c.y === pos.y));

        if (validNeighbors.length === 0) return;

        const target = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
        const fromX = creature.x;
        const fromY = creature.y;
        creature.x = target.x;
        creature.y = target.y;

        console.log(`Creature moved: ${creature.type} (${creature.id}) from (${fromX}, ${fromY}) to (${target.x}, ${target.y})`);
        this.emit('creatureMoved', { id: creature.id, type: creature.type, fromX, fromY, toX: target.x, toY: target.y } as CreatureMovedPayload);
    }

    private despawnCreatures(): void {
        const surviving: Creature[] = [];
        for (const creature of this.creatures) {
            if (Math.random() < CREATURE_DESPAWN_PROBABILITY) {
                console.log(`Creature despawned: ${creature.type} (${creature.id}) at (${creature.x}, ${creature.y})`);
                this.emit('creatureDespawned', { id: creature.id, type: creature.type, x: creature.x, y: creature.y } as CreatureDespawnedPayload);
            } else {
                surviving.push(creature);
            }
        }
        this.creatures = surviving;
    }

    private applyEffects(creature: Creature): number {
        const cell = this.grid.getCell(creature.x, creature.y);
        if (!cell) return 0;

        if (creature.type === 'StoneGiant') {
            if (cell.state === 'Active' && cell.terrainType === 'Mountain') {
                this.grid.reshape(creature.x, creature.y, 'Foothill');
                console.log(`StoneGiant transformed Mountain to Foothill at (${creature.x}, ${creature.y})`);
            }
            return 0;
        }

        if (creature.type === 'SeaSerpent') {
            const meadowNeighbors = this.orthogonalNeighbors(creature.x, creature.y)
                .filter(n => n.state === 'Active' && n.terrainType === 'Meadow');
            for (const neighbor of meadowNeighbors) {
                this.grid.reshape(neighbor.x, neighbor.y, 'Fertile Plain');
                console.log(`SeaSerpent transformed Meadow to Fertile Plain at (${neighbor.x}, ${neighbor.y})`);
            }
            return 0;
        }

        if (creature.type === 'LuminousSwarm') {
            if (cell.state === 'Active') {
                console.log(`LuminousSwarm generated +1 mana at (${creature.x}, ${creature.y})`);
                return 1;
            }
            return 0;
        }

        return 0;
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
        this.emit('creatureSpawned', { id: creature.id, x: cell.x, y: cell.y, type } as CreatureSpawnedPayload);
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
