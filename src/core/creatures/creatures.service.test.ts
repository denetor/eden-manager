import { Grid } from '../grid/grid.service';
import { CreaturesService, CreatureSpawnedPayload, CreatureMovedPayload, CreatureDespawnedPayload } from './creatures.service';

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

            jest.restoreAllMocks();
            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(0.4)   // move: stay
                .mockReturnValueOnce(0.99); // despawn: no

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

            jest.restoreAllMocks();
            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(0.4)   // move: stay
                .mockReturnValueOnce(0.99); // despawn: no

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

            jest.restoreAllMocks();
            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(0.4)   // move: stay
                .mockReturnValueOnce(0.99); // despawn: no

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

            jest.restoreAllMocks();
            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(0.4)   // move: stay
                .mockReturnValueOnce(0.99); // despawn: no

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

    // ── Creature movement ──────────────────────────────────────────────────────

    describe('creature movement', () => {
        it('creature stays when move probability not reached (< 0.5)', () => {
            const testService = CreaturesService.fromJSON({
                creatures: [{ id: 'sea_1', type: 'SeaSerpent', x: 5, y: 5 }]
            }, grid)!;

            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(0.4)   // move decision: < 0.5 → stay
                .mockReturnValueOnce(0.99); // despawn: no

            testService.update();

            const creature = testService.getCreatures()[0];
            expect(creature.x).toBe(5);
            expect(creature.y).toBe(5);
        });

        it('creature moves to a valid orthogonal neighbor when move probability reached (>= 0.5)', () => {
            makeActive(5, 4, 'Meadow'); // north neighbor must be Active to be valid
            const testService = CreaturesService.fromJSON({
                creatures: [{ id: 'sea_1', type: 'SeaSerpent', x: 5, y: 5 }]
            }, grid)!;

            // Only (5,4) is Active → validNeighbors = [(5,4)], index 0 → (5,4)
            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(0.6)   // move decision: >= 0.5 → attempt
                .mockReturnValueOnce(0)     // neighbor index 0 → (5, 4)
                .mockReturnValueOnce(0.99); // despawn: no

            testService.update();

            const creature = testService.getCreatures()[0];
            expect(creature.x).toBe(5);
            expect(creature.y).toBe(4);
        });

        it('creature does not move outside map bounds', () => {
            // (0,0): north and west are out of bounds; in-bounds = south(0,1) and east(1,0)
            makeActive(0, 1, 'Meadow');
            makeActive(1, 0, 'Meadow');
            const testService = CreaturesService.fromJSON({
                creatures: [{ id: 'sea_1', type: 'SeaSerpent', x: 0, y: 0 }]
            }, grid)!;

            // index 0 of valid Active neighbors [south(0,1), east(1,0)] → (0,1)
            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(0.6)   // move decision
                .mockReturnValueOnce(0)     // picks (0,1)
                .mockReturnValueOnce(0.99); // despawn: no

            testService.update();

            const creature = testService.getCreatures()[0];
            expect(creature.x).toBe(0);
            expect(creature.y).toBe(1);
        });

        it('creature stays when all valid Active neighbors are occupied', () => {
            // (0,0) in-bounds Active neighbors: south(0,1) and east(1,0) — both occupied
            makeActive(0, 1, 'Meadow');
            makeActive(1, 0, 'Meadow');
            const testService = CreaturesService.fromJSON({
                creatures: [
                    { id: 'sea_1', type: 'SeaSerpent', x: 0, y: 0 },
                    { id: 'stone_1', type: 'StoneGiant', x: 0, y: 1 },
                    { id: 'ls_1', type: 'LuminousSwarm', x: 1, y: 0 },
                ]
            }, grid)!;

            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(0.6)   // sea: attempt (Active neighbors all occupied → stays)
                .mockReturnValueOnce(0.4)   // stone: stay
                .mockReturnValueOnce(0.4)   // ls: stay
                .mockReturnValueOnce(0.99)  // sea: no despawn
                .mockReturnValueOnce(0.99)  // stone: no despawn
                .mockReturnValueOnce(0.99); // ls: no despawn

            testService.update();

            const sea = testService.getCreatures().find(c => c.id === 'sea_1')!;
            expect(sea.x).toBe(0);
            expect(sea.y).toBe(0);
        });

        it('emits creatureMoved event with correct payload', () => {
            makeActive(5, 4, 'Meadow'); // north neighbor must be Active
            const testService = CreaturesService.fromJSON({
                creatures: [{ id: 'sea_1', type: 'SeaSerpent', x: 5, y: 5 }]
            }, grid)!;

            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(0.6)   // move decision
                .mockReturnValueOnce(0)     // picks (5, 4)
                .mockReturnValueOnce(0.99); // despawn: no

            const events: CreatureMovedPayload[] = [];
            testService.on('creatureMoved', (p: CreatureMovedPayload) => events.push(p));

            testService.update();

            expect(events).toHaveLength(1);
            expect(events[0]).toMatchObject({
                id: 'sea_1',
                type: 'SeaSerpent',
                fromX: 5,
                fromY: 5,
                toX: 5,
                toY: 4,
            });
        });

        it('creature does not move to a Veiled neighbor', () => {
            // grid is all Veiled by default; all neighbors at (5,5) are Veiled
            const testService = CreaturesService.fromJSON({
                creatures: [{ id: 'sea_1', type: 'SeaSerpent', x: 5, y: 5 }]
            }, grid)!;

            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(0.6)   // move attempt: no valid Active neighbors → stays
                .mockReturnValueOnce(0.99); // despawn: no

            testService.update();

            const creature = testService.getCreatures()[0];
            expect(creature.x).toBe(5);
            expect(creature.y).toBe(5);
        });

        it('creature does not move to a Dormant neighbor', () => {
            makeDormant(5, 4, 'Meadow');
            makeDormant(5, 6, 'Meadow');
            makeDormant(4, 5, 'Meadow');
            makeDormant(6, 5, 'Meadow');
            const testService = CreaturesService.fromJSON({
                creatures: [{ id: 'sea_1', type: 'SeaSerpent', x: 5, y: 5 }]
            }, grid)!;

            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(0.6)   // move attempt: no valid Active neighbors → stays
                .mockReturnValueOnce(0.99); // despawn: no

            testService.update();

            const creature = testService.getCreatures()[0];
            expect(creature.x).toBe(5);
            expect(creature.y).toBe(5);
        });

        it('creature moves only to Active neighbors, skipping Veiled and Dormant ones', () => {
            // north(5,4): Veiled (default), south(5,6): Dormant, west(4,5): Active, east(6,5): Veiled
            makeDormant(5, 6, 'Meadow');
            makeActive(4, 5, 'Meadow');
            const testService = CreaturesService.fromJSON({
                creatures: [{ id: 'sea_1', type: 'SeaSerpent', x: 5, y: 5 }]
            }, grid)!;

            // validNeighbors = [(4,5)]; index 0 → (4,5)
            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(0.6)   // move attempt
                .mockReturnValueOnce(0)     // picks only valid neighbor (4,5)
                .mockReturnValueOnce(0.99); // despawn: no

            testService.update();

            const creature = testService.getCreatures()[0];
            expect(creature.x).toBe(4);
            expect(creature.y).toBe(5);
        });

        it('does not emit creatureMoved when creature stays', () => {
            const testService = CreaturesService.fromJSON({
                creatures: [{ id: 'sea_1', type: 'SeaSerpent', x: 5, y: 5 }]
            }, grid)!;

            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(0.4)   // stay
                .mockReturnValueOnce(0.99); // no despawn

            const events: CreatureMovedPayload[] = [];
            testService.on('creatureMoved', (p: CreatureMovedPayload) => events.push(p));

            testService.update();

            expect(events).toHaveLength(0);
        });
    });

    // ── Creature passive effects ───────────────────────────────────────────────

    describe('creature passive effects', () => {
        it('StoneGiant transforms Active Mountain to Foothill', () => {
            grid.setCell(5, 5, { state: 'Active', terrainType: 'Mountain' });
            const testService = CreaturesService.fromJSON({
                creatures: [{ id: 'stone_1', type: 'StoneGiant', x: 5, y: 5 }]
            }, grid)!;

            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(0.4)   // move: stay
                .mockReturnValueOnce(0.99); // despawn: no

            testService.update();

            expect(grid.getCell(5, 5)?.terrainType).toBe('Foothill');
        });

        it('StoneGiant does not transform a Dormant Mountain cell', () => {
            grid.setCell(5, 5, { state: 'Dormant', terrainType: 'Mountain' });
            const testService = CreaturesService.fromJSON({
                creatures: [{ id: 'stone_1', type: 'StoneGiant', x: 5, y: 5 }]
            }, grid)!;

            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(0.4)
                .mockReturnValueOnce(0.99);

            testService.update();

            expect(grid.getCell(5, 5)?.terrainType).toBe('Mountain');
        });

        it('StoneGiant does not transform a non-Mountain Active cell', () => {
            grid.setCell(5, 5, { state: 'Active', terrainType: 'Forest' });
            const testService = CreaturesService.fromJSON({
                creatures: [{ id: 'stone_1', type: 'StoneGiant', x: 5, y: 5 }]
            }, grid)!;

            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(0.4)
                .mockReturnValueOnce(0.99);

            testService.update();

            expect(grid.getCell(5, 5)?.terrainType).toBe('Forest');
        });

        it('SeaSerpent transforms orthogonal Active Meadow neighbors to Fertile Plain', () => {
            grid.setCell(5, 5, { state: 'Active', terrainType: 'Water' });
            grid.setCell(5, 4, { state: 'Active', terrainType: 'Meadow' });
            grid.setCell(5, 6, { state: 'Active', terrainType: 'Meadow' });
            grid.setCell(4, 5, { state: 'Active', terrainType: 'Forest' });
            const testService = CreaturesService.fromJSON({
                creatures: [{ id: 'sea_1', type: 'SeaSerpent', x: 5, y: 5 }]
            }, grid)!;

            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(0.4)
                .mockReturnValueOnce(0.99);

            testService.update();

            expect(grid.getCell(5, 4)?.terrainType).toBe('Fertile Plain');
            expect(grid.getCell(5, 6)?.terrainType).toBe('Fertile Plain');
            expect(grid.getCell(4, 5)?.terrainType).toBe('Forest');
        });

        it('SeaSerpent does not transform Dormant Meadow neighbors', () => {
            grid.setCell(5, 5, { state: 'Active', terrainType: 'Water' });
            grid.setCell(5, 4, { state: 'Dormant', terrainType: 'Meadow' });
            const testService = CreaturesService.fromJSON({
                creatures: [{ id: 'sea_1', type: 'SeaSerpent', x: 5, y: 5 }]
            }, grid)!;

            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(0.4)
                .mockReturnValueOnce(0.99);

            testService.update();

            expect(grid.getCell(5, 4)?.terrainType).toBe('Meadow');
        });

        it('LuminousSwarm returns manaBonus 1 when on Active cell', () => {
            grid.setCell(5, 5, { state: 'Active', terrainType: 'Sacred Grove' });
            const testService = CreaturesService.fromJSON({
                creatures: [{ id: 'ls_1', type: 'LuminousSwarm', x: 5, y: 5 }]
            }, grid)!;

            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(0.4)
                .mockReturnValueOnce(0.99);

            const bonus = testService.update();

            expect(bonus).toBe(1);
        });

        it('LuminousSwarm returns manaBonus 0 when on non-Active cell', () => {
            grid.setCell(5, 5, { state: 'Dormant', terrainType: 'Sacred Grove' });
            const testService = CreaturesService.fromJSON({
                creatures: [{ id: 'ls_1', type: 'LuminousSwarm', x: 5, y: 5 }]
            }, grid)!;

            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(0.4)
                .mockReturnValueOnce(0.99);

            const bonus = testService.update();

            expect(bonus).toBe(0);
        });

        it('multiple creatures contribute cumulative mana bonus', () => {
            grid.setCell(5, 5, { state: 'Active', terrainType: 'Sacred Grove' });
            grid.setCell(8, 8, { state: 'Active', terrainType: 'Sacred Grove' });
            const testService = CreaturesService.fromJSON({
                creatures: [
                    { id: 'ls_1', type: 'LuminousSwarm', x: 5, y: 5 },
                    { id: 'ls_2', type: 'LuminousSwarm', x: 8, y: 8 },
                ]
            }, grid)!;

            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(0.4)   // ls_1: move stay
                .mockReturnValueOnce(0.4)   // ls_2: move stay
                .mockReturnValueOnce(0.99)  // ls_1: no despawn
                .mockReturnValueOnce(0.99); // ls_2: no despawn

            const bonus = testService.update();

            expect(bonus).toBe(2);
        });
    });

    // ── Creature despawn ───────────────────────────────────────────────────────

    describe('creature despawn', () => {
        it('removes creature when despawn probability is reached', () => {
            const testService = CreaturesService.fromJSON({
                creatures: [{ id: 'sea_1', type: 'SeaSerpent', x: 5, y: 5 }]
            }, grid)!;

            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(0.4)   // move: stay
                .mockReturnValueOnce(0.01); // despawn: < 0.05 → remove

            testService.update();

            expect(testService.getCreatures()).toHaveLength(0);
        });

        it('keeps creature when despawn probability is not reached', () => {
            const testService = CreaturesService.fromJSON({
                creatures: [{ id: 'sea_1', type: 'SeaSerpent', x: 5, y: 5 }]
            }, grid)!;

            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(0.4)   // move: stay
                .mockReturnValueOnce(0.99); // despawn: >= 0.05 → keep

            testService.update();

            expect(testService.getCreatures()).toHaveLength(1);
        });

        it('emits creatureDespawned event with correct payload', () => {
            const testService = CreaturesService.fromJSON({
                creatures: [{ id: 'sea_1', type: 'SeaSerpent', x: 5, y: 5 }]
            }, grid)!;

            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(0.4)   // move: stay
                .mockReturnValueOnce(0.01); // despawn

            const events: CreatureDespawnedPayload[] = [];
            testService.on('creatureDespawned', (p: CreatureDespawnedPayload) => events.push(p));

            testService.update();

            expect(events).toHaveLength(1);
            expect(events[0]).toMatchObject({ id: 'sea_1', type: 'SeaSerpent', x: 5, y: 5 });
        });

        it('creature is removed from list before creatureDespawned event fires', () => {
            const testService = CreaturesService.fromJSON({
                creatures: [{ id: 'sea_1', type: 'SeaSerpent', x: 5, y: 5 }]
            }, grid)!;

            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(0.4)   // move: stay
                .mockReturnValueOnce(0.01); // despawn

            let countDuringEvent = -1;
            testService.on('creatureDespawned', () => {
                countDuringEvent = testService.getCreatures().length;
            });

            testService.update();

            expect(countDuringEvent).toBe(0);
        });

        it('despawn is independent per creature', () => {
            const testService = CreaturesService.fromJSON({
                creatures: [
                    { id: 'sea_1', type: 'SeaSerpent', x: 5, y: 5 },
                    { id: 'stone_1', type: 'StoneGiant', x: 8, y: 8 },
                ]
            }, grid)!;

            jest.spyOn(Math, 'random')
                .mockReturnValueOnce(0.4)   // sea: move stay
                .mockReturnValueOnce(0.4)   // stone: move stay
                .mockReturnValueOnce(0.01)  // sea: despawn
                .mockReturnValueOnce(0.99); // stone: no despawn

            testService.update();

            const remaining = testService.getCreatures();
            expect(remaining).toHaveLength(1);
            expect(remaining[0].type).toBe('StoneGiant');
        });
    });
});
