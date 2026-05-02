import { Grid } from '../grid/grid.service';
import { CreaturesService, CreatureSpawnedPayload } from './creatures.service';

describe('CreaturesService', () => {
    let grid: Grid;
    let service: CreaturesService;

    const makeActive = (x: number, y: number, terrain: Parameters<Grid['setCell']>[2]['terrainType']) => {
        grid.setCell(x, y, { state: 'Active', terrainType: terrain });
    };

    const makeDormant = (x: number, y: number, terrain: Parameters<Grid['setCell']>[2]['terrainType']) => {
        grid.setCell(x, y, { state: 'Dormant', terrainType: terrain });
    };

    const forceSpawn = () => jest.spyOn(Math, 'random').mockReturnValue(0.01);
    const blockSpawn = () => jest.spyOn(Math, 'random').mockReturnValue(0.99);

    beforeEach(() => {
        grid = new Grid(16, 16);
        service = new CreaturesService(grid);
        jest.restoreAllMocks();
    });

    // ── Stone Giant ────────────────────────────────────────────────────────────

    describe('StoneGiant spawn conditions', () => {
        it('does not spawn on non-Mountain terrain', () => {
            makeActive(5, 5, 'Meadow');
            makeActive(4, 5, 'Mountain');
            makeActive(6, 5, 'Mountain');
            forceSpawn();

            service.update();

            expect(service.getCreatures().some(c => c.type === 'StoneGiant')).toBe(false);
        });

        it('does not spawn on Mountain cell with only 1 orthogonal Mountain neighbor', () => {
            makeActive(5, 5, 'Mountain');
            makeActive(4, 5, 'Mountain'); // 1 orthogonal neighbor
            forceSpawn();

            service.update();

            expect(service.getCreatures().some(c => c.type === 'StoneGiant')).toBe(false);
        });

        it('does not spawn on Mountain cell with 2 diagonal-only Mountain neighbors', () => {
            makeActive(5, 5, 'Mountain');
            makeActive(4, 4, 'Mountain'); // diagonal
            makeActive(6, 6, 'Mountain'); // diagonal
            forceSpawn();

            service.update();

            expect(service.getCreatures().some(c => c.type === 'StoneGiant')).toBe(false);
        });

        it('does not spawn on a Dormant Mountain cell even with qualifying neighbors', () => {
            makeDormant(5, 5, 'Mountain');
            makeActive(4, 5, 'Mountain');
            makeActive(6, 5, 'Mountain');
            forceSpawn();

            service.update();

            expect(service.getCreatures().some(c => c.type === 'StoneGiant')).toBe(false);
        });

        it('spawns on Active Mountain cell with 2+ orthogonal Mountain neighbors when probability passes', () => {
            makeActive(5, 5, 'Mountain');
            makeActive(4, 5, 'Mountain');
            makeActive(6, 5, 'Mountain');
            forceSpawn();

            service.update();

            expect(service.getCreatures().some(c => c.type === 'StoneGiant')).toBe(true);
        });

        it('does not spawn when probability does not pass', () => {
            makeActive(5, 5, 'Mountain');
            makeActive(4, 5, 'Mountain');
            makeActive(6, 5, 'Mountain');
            blockSpawn();

            service.update();

            expect(service.getCreatures().some(c => c.type === 'StoneGiant')).toBe(false);
        });

        it('does not spawn a second StoneGiant when one already exists', () => {
            makeActive(5, 5, 'Mountain');
            makeActive(4, 5, 'Mountain');
            makeActive(6, 5, 'Mountain');
            forceSpawn();

            service.update(); // spawns once
            const countAfterFirst = service.getCreatures().filter(c => c.type === 'StoneGiant').length;
            service.update(); // must not spawn again
            const countAfterSecond = service.getCreatures().filter(c => c.type === 'StoneGiant').length;

            expect(countAfterFirst).toBe(1);
            expect(countAfterSecond).toBe(1);
        });
    });

    // ── Sea Serpent ────────────────────────────────────────────────────────────

    describe('SeaSerpent spawn conditions', () => {
        it('does not spawn on non-Water terrain', () => {
            makeActive(5, 5, 'Meadow');
            forceSpawn();

            service.update();

            expect(service.getCreatures().some(c => c.type === 'SeaSerpent')).toBe(false);
        });

        it('does not spawn on a Dormant Water cell', () => {
            makeDormant(5, 5, 'Water');
            forceSpawn();

            service.update();

            expect(service.getCreatures().some(c => c.type === 'SeaSerpent')).toBe(false);
        });

        it('spawns on an Active Water cell when probability passes', () => {
            makeActive(5, 5, 'Water');
            forceSpawn();

            service.update();

            expect(service.getCreatures().some(c => c.type === 'SeaSerpent')).toBe(true);
        });

        it('does not spawn when probability does not pass', () => {
            makeActive(5, 5, 'Water');
            blockSpawn();

            service.update();

            expect(service.getCreatures().some(c => c.type === 'SeaSerpent')).toBe(false);
        });

        it('does not spawn a second SeaSerpent when one already exists', () => {
            makeActive(5, 5, 'Water');
            makeActive(6, 6, 'Water');
            forceSpawn();

            service.update();
            const countAfterFirst = service.getCreatures().filter(c => c.type === 'SeaSerpent').length;
            service.update();
            const countAfterSecond = service.getCreatures().filter(c => c.type === 'SeaSerpent').length;

            expect(countAfterFirst).toBe(1);
            expect(countAfterSecond).toBe(1);
        });
    });

    // ── Luminous Swarm ─────────────────────────────────────────────────────────

    describe('LuminousSwarm spawn conditions', () => {
        it('does not spawn on non-Sacred Grove terrain', () => {
            makeActive(5, 5, 'Forest');
            forceSpawn();

            service.update();

            expect(service.getCreatures().some(c => c.type === 'LuminousSwarm')).toBe(false);
        });

        it('does not spawn on a Dormant Sacred Grove cell', () => {
            makeDormant(5, 5, 'Sacred Grove');
            forceSpawn();

            service.update();

            expect(service.getCreatures().some(c => c.type === 'LuminousSwarm')).toBe(false);
        });

        it('spawns on an Active Sacred Grove cell when probability passes', () => {
            makeActive(5, 5, 'Sacred Grove');
            forceSpawn();

            service.update();

            expect(service.getCreatures().some(c => c.type === 'LuminousSwarm')).toBe(true);
        });

        it('does not spawn when probability does not pass', () => {
            makeActive(5, 5, 'Sacred Grove');
            blockSpawn();

            service.update();

            expect(service.getCreatures().some(c => c.type === 'LuminousSwarm')).toBe(false);
        });

        it('does not spawn a second LuminousSwarm when one already exists', () => {
            makeActive(5, 5, 'Sacred Grove');
            forceSpawn();

            service.update();
            const countAfterFirst = service.getCreatures().filter(c => c.type === 'LuminousSwarm').length;
            service.update();
            const countAfterSecond = service.getCreatures().filter(c => c.type === 'LuminousSwarm').length;

            expect(countAfterFirst).toBe(1);
            expect(countAfterSecond).toBe(1);
        });
    });

    // ── One-per-type independence ───────────────────────────────────────────────

    describe('one-per-type rule is per type, not global', () => {
        it('allows different creature types to coexist', () => {
            makeActive(3, 3, 'Mountain');
            makeActive(2, 3, 'Mountain');
            makeActive(4, 3, 'Mountain');
            makeActive(8, 8, 'Water');
            makeActive(12, 12, 'Sacred Grove');
            forceSpawn();

            service.update();

            const types = service.getCreatures().map(c => c.type);
            expect(types).toContain('StoneGiant');
            expect(types).toContain('SeaSerpent');
            expect(types).toContain('LuminousSwarm');
        });
    });

    // ── creatureSpawned event ──────────────────────────────────────────────────

    describe('creatureSpawned event', () => {
        it('emits creatureSpawned with correct payload when a creature spawns', () => {
            makeActive(5, 5, 'Water');
            forceSpawn();

            const events: CreatureSpawnedPayload[] = [];
            service.on('creatureSpawned', (p: CreatureSpawnedPayload) => events.push(p));

            service.update();

            expect(events.length).toBe(1);
            expect(events[0].type).toBe('SeaSerpent');
            expect(events[0].x).toBe(5);
            expect(events[0].y).toBe(5);
        });

        it('does not emit creatureSpawned when probability blocks the spawn', () => {
            makeActive(5, 5, 'Water');
            blockSpawn();

            const events: CreatureSpawnedPayload[] = [];
            service.on('creatureSpawned', (p: CreatureSpawnedPayload) => events.push(p));

            service.update();

            expect(events.length).toBe(0);
        });

        it('does not emit creatureSpawned when a creature of the same type already exists', () => {
            makeActive(5, 5, 'Water');
            forceSpawn();

            service.update(); // first spawn — event emitted once

            const events: CreatureSpawnedPayload[] = [];
            service.on('creatureSpawned', (p: CreatureSpawnedPayload) => events.push(p));

            service.update(); // blocked by one-per-type

            expect(events.length).toBe(0);
        });
    });

    // ── Serialization ──────────────────────────────────────────────────────────

    describe('toJSON / fromJSON', () => {
        it('serializes and restores all creatures', () => {
            makeActive(5, 5, 'Water');
            makeActive(8, 8, 'Sacred Grove');
            forceSpawn();

            service.update();

            const data = service.toJSON();
            const restored = CreaturesService.fromJSON(data, grid)!;

            expect(restored.getCreatures()).toHaveLength(service.getCreatures().length);
            expect(restored.getCreatures()[0]).toMatchObject({
                type: service.getCreatures()[0].type,
                x: service.getCreatures()[0].x,
                y: service.getCreatures()[0].y,
            });
        });

        it('returns null for invalid data', () => {
            expect(CreaturesService.fromJSON(null as any, grid)).toBeNull();
            expect(CreaturesService.fromJSON({ creatures: 'bad' } as any, grid)).toBeNull();
        });

        it('returns an empty service for valid data with no creatures', () => {
            const restored = CreaturesService.fromJSON({ creatures: [] }, grid)!;

            expect(restored).not.toBeNull();
            expect(restored.getCreatures()).toHaveLength(0);
        });
    });
});
