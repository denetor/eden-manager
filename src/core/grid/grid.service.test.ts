import { Grid, CellChangedPayload, BatchChangedPayload } from './grid.service';
import { CellState, TerrainType } from './grid.model';

describe('Grid', () => {
    describe('constructor', () => {
        it('should initialize a grid with given dimensions', () => {
            const grid = new Grid(16, 16);

            expect(grid.getWidth()).toBe(16);
            expect(grid.getHeight()).toBe(16);
        });

        it('should create correct number of cells', () => {
            const grid = new Grid(16, 16);

            // All 256 cells should be accessible
            let cellCount = 0;
            for (let x = 0; x < 16; x++) {
                for (let y = 0; y < 16; y++) {
                    const cell = grid.getCell(x, y);
                    if (cell) cellCount++;
                }
            }

            expect(cellCount).toBe(256);
        });

        it('should initialize all cells with Veiled state and Meadow terrain', () => {
            const grid = new Grid(16, 16);

            for (let x = 0; x < 16; x++) {
                for (let y = 0; y < 16; y++) {
                    const cell = grid.getCell(x, y);
                    expect(cell).not.toBeNull();
                    expect(cell!.state).toBe('Veiled');
                    expect(cell!.terrainType).toBe('Meadow');
                }
            }
        });

        it('should set correct x, y coordinates for each cell', () => {
            const grid = new Grid(16, 16);

            for (let x = 0; x < 16; x++) {
                for (let y = 0; y < 16; y++) {
                    const cell = grid.getCell(x, y);
                    expect(cell!.x).toBe(x);
                    expect(cell!.y).toBe(y);
                }
            }
        });
    });

    describe('getCell', () => {
        let grid: Grid;

        beforeEach(() => {
            grid = new Grid(16, 16);
        });

        it('should return cell for valid interior coordinates', () => {
            const cell = grid.getCell(8, 8);

            expect(cell).not.toBeNull();
            expect(cell!.x).toBe(8);
            expect(cell!.y).toBe(8);
        });

        it('should return cell for edge coordinates', () => {
            const topLeft = grid.getCell(0, 0);
            const topRight = grid.getCell(15, 0);
            const bottomLeft = grid.getCell(0, 15);
            const bottomRight = grid.getCell(15, 15);

            expect(topLeft).not.toBeNull();
            expect(topRight).not.toBeNull();
            expect(bottomLeft).not.toBeNull();
            expect(bottomRight).not.toBeNull();
        });

        it('should return null for out-of-bounds coordinates', () => {
            expect(grid.getCell(-1, 0)).toBeNull();
            expect(grid.getCell(0, -1)).toBeNull();
            expect(grid.getCell(16, 0)).toBeNull();
            expect(grid.getCell(0, 16)).toBeNull();
            expect(grid.getCell(-1, -1)).toBeNull();
            expect(grid.getCell(16, 16)).toBeNull();
        });

        it('should return same cell object reference on multiple calls', () => {
            const cell1 = grid.getCell(5, 5);
            const cell2 = grid.getCell(5, 5);

            expect(cell1).toBe(cell2);
        });
    });

    describe('setCell', () => {
        let grid: Grid;

        beforeEach(() => {
            grid = new Grid(16, 16);
        });

        it('should update terrainType', () => {
            grid.setCell(5, 5, { terrainType: 'Forest' });
            const cell = grid.getCell(5, 5);

            expect(cell!.terrainType).toBe('Forest');
        });

        it('should update state', () => {
            grid.setCell(5, 5, { state: 'Active' });
            const cell = grid.getCell(5, 5);

            expect(cell!.state).toBe('Active');
        });

        it('should update both state and terrainType together', () => {
            grid.setCell(5, 5, { state: 'Dormant', terrainType: 'Mountain' });
            const cell = grid.getCell(5, 5);

            expect(cell!.state).toBe('Dormant');
            expect(cell!.terrainType).toBe('Mountain');
        });

        it('should preserve other properties when updating one', () => {
            grid.setCell(5, 5, { terrainType: 'Water' });
            const cell = grid.getCell(5, 5);

            expect(cell!.state).toBe('Veiled'); // unchanged
            expect(cell!.x).toBe(5); // unchanged
            expect(cell!.y).toBe(5); // unchanged
            expect(cell!.terrainType).toBe('Water'); // changed
        });

        it('should handle all terrain types', () => {
            const terrains: TerrainType[] = [
                'Meadow',
                'Forest',
                'Mountain',
                'Water',
                'Ruins',
            ];

            terrains.forEach((terrain, index) => {
                grid.setCell(index, 0, { terrainType: terrain });
                const cell = grid.getCell(index, 0);
                expect(cell!.terrainType).toBe(terrain);
            });
        });

        it('should handle all cell states', () => {
            const states: CellState[] = ['Veiled', 'Dormant', 'Active'];

            states.forEach((state, index) => {
                grid.setCell(index, 0, { state });
                const cell = grid.getCell(index, 0);
                expect(cell!.state).toBe(state);
            });
        });

        it('should do nothing for out-of-bounds coordinates', () => {
            grid.setCell(-1, 0, { terrainType: 'Forest' });
            grid.setCell(16, 0, { terrainType: 'Forest' });
            grid.setCell(0, -1, { terrainType: 'Forest' });
            grid.setCell(0, 16, { terrainType: 'Forest' });

            // No error should occur; grid should remain unchanged
            const cell = grid.getCell(0, 0);
            expect(cell!.terrainType).toBe('Meadow'); // still default
        });

        it('should update cell at edge coordinates', () => {
            grid.setCell(0, 0, { terrainType: 'Forest' });
            grid.setCell(15, 15, { state: 'Active' });

            const topLeft = grid.getCell(0, 0);
            const bottomRight = grid.getCell(15, 15);

            expect(topLeft!.terrainType).toBe('Forest');
            expect(bottomRight!.state).toBe('Active');
        });

        it('should allow multiple updates to same cell', () => {
            grid.setCell(5, 5, { terrainType: 'Forest' });
            const cell1 = grid.getCell(5, 5);
            expect(cell1!.terrainType).toBe('Forest');

            grid.setCell(5, 5, { state: 'Dormant' });
            const cell2 = grid.getCell(5, 5);
            expect(cell2!.state).toBe('Dormant');
            expect(cell2!.terrainType).toBe('Forest'); // still forest
        });
    });

    describe('dimensions', () => {
        it('should support various grid sizes', () => {
            const grid1 = new Grid(8, 8);
            expect(grid1.getWidth()).toBe(8);
            expect(grid1.getHeight()).toBe(8);

            const grid2 = new Grid(32, 32);
            expect(grid2.getWidth()).toBe(32);
            expect(grid2.getHeight()).toBe(32);

            const grid3 = new Grid(128, 128);
            expect(grid3.getWidth()).toBe(128);
            expect(grid3.getHeight()).toBe(128);
        });

        it('should maintain correct cell layout for non-square grids', () => {
            const grid = new Grid(10, 20);

            // Check a cell in the middle
            const cell = grid.getCell(5, 10);
            expect(cell).not.toBeNull();
            expect(cell!.x).toBe(5);
            expect(cell!.y).toBe(10);

            // Check boundaries
            expect(grid.getCell(9, 19)).not.toBeNull();
            expect(grid.getCell(10, 19)).toBeNull();
            expect(grid.getCell(9, 20)).toBeNull();
        });
    });

    describe('reshape', () => {
        let grid: Grid;

        beforeEach(() => {
            grid = new Grid(16, 16);
        });

        it('should update terrainType and emit cellChanged', (done) => {
            grid.on('cellChanged', (payload: CellChangedPayload) => {
                expect(payload.x).toBe(5);
                expect(payload.y).toBe(5);
                expect(payload.cell.terrainType).toBe('Forest');
                done();
            });

            grid.reshape(5, 5, 'Forest');
        });

        it('should mark cell as dirty', () => {
            grid.reshape(5, 5, 'Forest');
            const dirtyCoords = grid.getDirtyCells();

            expect(dirtyCoords).toContainEqual({ x: 5, y: 5 });
        });

        it('should handle all terrain types', () => {
            const terrains: TerrainType[] = [
                'Meadow',
                'Forest',
                'Mountain',
                'Water',
                'Ruins',
            ];

            terrains.forEach((terrain, index) => {
                grid.reshape(index, 0, terrain);
                const cell = grid.getCell(index, 0);
                expect(cell!.terrainType).toBe(terrain);
            });
        });

        it('should be idempotent (safe to call multiple times)', () => {
            let eventCount = 0;
            grid.on('cellChanged', () => {
                eventCount++;
            });

            grid.reshape(5, 5, 'Forest');
            grid.reshape(5, 5, 'Forest');

            expect(eventCount).toBe(2); // both calls emit
            expect(grid.getCell(5, 5)!.terrainType).toBe('Forest');
        });

        it('should do nothing for out-of-bounds', () => {
            let eventEmitted = false;
            grid.on('cellChanged', () => {
                eventEmitted = true;
            });

            grid.reshape(-1, 0, 'Forest');
            grid.reshape(16, 0, 'Forest');

            expect(eventEmitted).toBe(false);
        });

        it('should emit event with correct payload structure', (done) => {
            grid.on('cellChanged', (payload: CellChangedPayload) => {
                expect(payload).toHaveProperty('x');
                expect(payload).toHaveProperty('y');
                expect(payload).toHaveProperty('cell');
                expect(payload.cell).toHaveProperty('state');
                expect(payload.cell).toHaveProperty('terrainType');
                expect(payload.cell).toHaveProperty('x');
                expect(payload.cell).toHaveProperty('y');
                done();
            });

            grid.reshape(5, 5, 'Mountain');
        });
    });

    describe('unveil', () => {
        let grid: Grid;

        beforeEach(() => {
            grid = new Grid(16, 16);
        });

        it('should change state from Veiled to Dormant', () => {
            grid.unveil(5, 5);
            const cell = grid.getCell(5, 5);

            expect(cell!.state).toBe('Dormant');
        });

        it('should emit cellChanged event', (done) => {
            grid.on('cellChanged', (payload: CellChangedPayload) => {
                expect(payload.x).toBe(5);
                expect(payload.y).toBe(5);
                expect(payload.cell.state).toBe('Dormant');
                done();
            });

            grid.unveil(5, 5);
        });

        it('should mark cell as dirty', () => {
            grid.unveil(5, 5);
            const dirtyCoords = grid.getDirtyCells();

            expect(dirtyCoords).toContainEqual({ x: 5, y: 5 });
        });

        it('should be idempotent (no-op if already Dormant or Active)', () => {
            let eventCount = 0;
            grid.on('cellChanged', () => {
                eventCount++;
            });

            grid.unveil(5, 5); // Veiled → Dormant (emits)
            grid.unveil(5, 5); // Already Dormant (no-op, no emit)

            expect(eventCount).toBe(1);
            expect(grid.getCell(5, 5)!.state).toBe('Dormant');
        });

        it('should do nothing for out-of-bounds', () => {
            let eventEmitted = false;
            grid.on('cellChanged', () => {
                eventEmitted = true;
            });

            grid.unveil(-1, 0);
            grid.unveil(16, 0);

            expect(eventEmitted).toBe(false);
        });
    });

    describe('awaken', () => {
        let grid: Grid;

        beforeEach(() => {
            grid = new Grid(16, 16);
            // Awaken requires Dormant state, so set it up first
            grid.clearDirty();
        });

        it('should change state from Dormant to Active', () => {
            grid.unveil(5, 5); // Veiled → Dormant
            grid.clearDirty();
            grid.awaken(5, 5); // Dormant → Active

            const cell = grid.getCell(5, 5);
            expect(cell!.state).toBe('Active');
        });

        it('should emit cellChanged event', (done) => {
            grid.unveil(5, 5);
            grid.clearDirty();

            grid.on('cellChanged', (payload: CellChangedPayload) => {
                expect(payload.x).toBe(5);
                expect(payload.y).toBe(5);
                expect(payload.cell.state).toBe('Active');
                done();
            });

            grid.awaken(5, 5);
        });

        it('should mark cell as dirty', () => {
            grid.unveil(5, 5);
            grid.clearDirty();
            grid.awaken(5, 5);

            const dirtyCoords = grid.getDirtyCells();
            expect(dirtyCoords).toContainEqual({ x: 5, y: 5 });
        });

        it('should be idempotent (no-op if already Active or Veiled)', () => {
            grid.unveil(5, 5);
            grid.clearDirty();

            let eventCount = 0;
            grid.on('cellChanged', () => {
                eventCount++;
            });

            grid.awaken(5, 5); // Dormant → Active (emits)
            grid.awaken(5, 5); // Already Active (no-op, no emit)

            expect(eventCount).toBe(1);
            expect(grid.getCell(5, 5)!.state).toBe('Active');
        });

        it('should do nothing for Veiled cells', () => {
            let eventEmitted = false;
            grid.on('cellChanged', () => {
                eventEmitted = true;
            });

            grid.awaken(5, 5); // Cell is Veiled, awaken is no-op

            expect(eventEmitted).toBe(false);
            expect(grid.getCell(5, 5)!.state).toBe('Veiled');
        });

        it('should do nothing for out-of-bounds', () => {
            let eventEmitted = false;
            grid.on('cellChanged', () => {
                eventEmitted = true;
            });

            grid.awaken(-1, 0);
            grid.awaken(16, 0);

            expect(eventEmitted).toBe(false);
        });
    });

    describe('dirty tracking', () => {
        let grid: Grid;

        beforeEach(() => {
            grid = new Grid(16, 16);
        });

        it('should track dirty cells after reshape', () => {
            grid.reshape(5, 5, 'Forest');
            grid.reshape(8, 8, 'Mountain');

            const dirtyCoords = grid.getDirtyCells();
            expect(dirtyCoords).toContainEqual({ x: 5, y: 5 });
            expect(dirtyCoords).toContainEqual({ x: 8, y: 8 });
            expect(dirtyCoords.length).toBe(2);
        });

        it('should return empty array when no dirty cells', () => {
            const dirtyCoords = grid.getDirtyCells();

            expect(dirtyCoords).toEqual([]);
        });

        it('should not duplicate dirty entries for same cell', () => {
            grid.reshape(5, 5, 'Forest');
            grid.reshape(5, 5, 'Mountain');

            const dirtyCoords = grid.getDirtyCells();
            const count = dirtyCoords.filter(
                (c) => c.x === 5 && c.y === 5
            ).length;

            expect(count).toBe(1); // appears once despite two mutations
        });

        it('should clear dirty flags with clearDirty', () => {
            grid.reshape(5, 5, 'Forest');
            grid.reshape(8, 8, 'Mountain');

            grid.clearDirty();
            const dirtyCoords = grid.getDirtyCells();

            expect(dirtyCoords).toEqual([]);
        });

        it('should track dirty from unveil and awaken', () => {
            grid.unveil(5, 5);
            grid.unveil(8, 8);
            grid.awaken(3, 3); // no-op, Veiled cell
            // Actually awaken a cell after unveiling
            grid.unveil(10, 10);
            grid.awaken(10, 10);

            const dirtyCoords = grid.getDirtyCells();

            expect(dirtyCoords).toContainEqual({ x: 5, y: 5 });
            expect(dirtyCoords).toContainEqual({ x: 8, y: 8 });
            expect(dirtyCoords).toContainEqual({ x: 10, y: 10 });
        });
    });

    describe('event listeners', () => {
        let grid: Grid;

        beforeEach(() => {
            grid = new Grid(16, 16);
        });

        it('should allow multiple listeners on cellChanged', () => {
            const calls1: CellChangedPayload[] = [];
            const calls2: CellChangedPayload[] = [];

            grid.on('cellChanged', (payload) => calls1.push(payload));
            grid.on('cellChanged', (payload) => calls2.push(payload));

            grid.reshape(5, 5, 'Forest');

            expect(calls1.length).toBe(1);
            expect(calls2.length).toBe(1);
            expect(calls1[0].x).toBe(5);
            expect(calls2[0].x).toBe(5);
        });

        it('should allow removing listeners', () => {
            const handler = jest.fn();
            grid.on('cellChanged', handler);
            grid.off('cellChanged', handler);

            grid.reshape(5, 5, 'Forest');

            expect(handler).not.toHaveBeenCalled();
        });

        it('should pass correct payload to listeners', (done) => {
            grid.on('cellChanged', (payload: CellChangedPayload) => {
                expect(payload.x).toBe(7);
                expect(payload.y).toBe(9);
                expect(payload.cell.terrainType).toBe('Water');
                expect(payload.cell.x).toBe(7);
                expect(payload.cell.y).toBe(9);
                done();
            });

            grid.reshape(7, 9, 'Water');
        });

        it('should emit event immediately on mutation', (done) => {
            let eventFired = false;

            grid.on('cellChanged', () => {
                eventFired = true;
            });

            grid.reshape(5, 5, 'Forest');

            expect(eventFired).toBe(true);
            done();
        });
    });

    describe('reshapeBatch', () => {
        let grid: Grid;

        beforeEach(() => {
            grid = new Grid(16, 16);
        });

        it('should apply multiple changes atomically', () => {
            const changes = [
                { x: 5, y: 5, terrainType: 'Forest' as TerrainType },
                { x: 8, y: 8, terrainType: 'Mountain' as TerrainType },
                { x: 3, y: 3, terrainType: 'Water' as TerrainType },
            ];

            grid.reshapeBatch(changes);

            expect(grid.getCell(5, 5)!.terrainType).toBe('Forest');
            expect(grid.getCell(8, 8)!.terrainType).toBe('Mountain');
            expect(grid.getCell(3, 3)!.terrainType).toBe('Water');
        });

        it('should emit single batchChanged event with all changes', (done) => {
            const changes = [
                { x: 5, y: 5, terrainType: 'Forest' as TerrainType },
                { x: 8, y: 8, terrainType: 'Mountain' as TerrainType },
            ];

            grid.on('batchChanged', (payload: BatchChangedPayload) => {
                expect(payload.changes.length).toBe(2);
                expect(payload.changes).toContainEqual({
                    x: 5,
                    y: 5,
                    terrainType: 'Forest',
                });
                expect(payload.changes).toContainEqual({
                    x: 8,
                    y: 8,
                    terrainType: 'Mountain',
                });
                done();
            });

            grid.reshapeBatch(changes);
        });

        it('should mark all affected cells as dirty', () => {
            const changes = [
                { x: 5, y: 5, terrainType: 'Forest' as TerrainType },
                { x: 8, y: 8, terrainType: 'Mountain' as TerrainType },
                { x: 3, y: 3, terrainType: 'Water' as TerrainType },
            ];

            grid.reshapeBatch(changes);

            const dirtyCoords = grid.getDirtyCells();
            expect(dirtyCoords).toContainEqual({ x: 5, y: 5 });
            expect(dirtyCoords).toContainEqual({ x: 8, y: 8 });
            expect(dirtyCoords).toContainEqual({ x: 3, y: 3 });
            expect(dirtyCoords.length).toBe(3);
        });

        it('should be no-op for empty changes array', () => {
            let eventEmitted = false;
            grid.on('batchChanged', () => {
                eventEmitted = true;
            });

            grid.reshapeBatch([]);

            expect(eventEmitted).toBe(false);
            expect(grid.getDirtyCells()).toEqual([]);
        });

        it('should skip out-of-bounds coordinates silently', () => {
            const changes = [
                { x: 5, y: 5, terrainType: 'Forest' as TerrainType },
                { x: -1, y: 0, terrainType: 'Mountain' as TerrainType }, // out-of-bounds
                { x: 16, y: 8, terrainType: 'Water' as TerrainType }, // out-of-bounds
                { x: 8, y: 8, terrainType: 'Meadow' as TerrainType },
            ];

            grid.reshapeBatch(changes);

            const dirtyCoords = grid.getDirtyCells();
            // Should only have the in-bounds cells marked dirty
            expect(dirtyCoords).toContainEqual({ x: 5, y: 5 });
            expect(dirtyCoords).toContainEqual({ x: 8, y: 8 });
            expect(dirtyCoords.length).toBe(2); // out-of-bounds are skipped

            // Verify only in-bounds cells changed
            expect(grid.getCell(5, 5)!.terrainType).toBe('Forest');
            expect(grid.getCell(8, 8)!.terrainType).toBe('Meadow');
            expect(grid.getCell(0, 0)!.terrainType).toBe('Meadow'); // unchanged
        });

        it('should handle single change batch', () => {
            const changes = [
                { x: 7, y: 9, terrainType: 'Ruins' as TerrainType },
            ];

            grid.reshapeBatch(changes);

            expect(grid.getCell(7, 9)!.terrainType).toBe('Ruins');
            expect(grid.getDirtyCells()).toContainEqual({ x: 7, y: 9 });
        });

        it('should handle large batch (3x3 area)', () => {
            const changes: Array<{
                x: number;
                y: number;
                terrainType: TerrainType;
            }> = [];
            for (let x = 5; x <= 7; x++) {
                for (let y = 5; y <= 7; y++) {
                    changes.push({
                        x,
                        y,
                        terrainType: 'Forest' as TerrainType,
                    });
                }
            }

            grid.reshapeBatch(changes);

            expect(grid.getDirtyCells().length).toBe(9);
            for (let x = 5; x <= 7; x++) {
                for (let y = 5; y <= 7; y++) {
                    expect(grid.getCell(x, y)!.terrainType).toBe('Forest');
                }
            }
        });

        it('should allow multiple batchChanged listeners', () => {
            const calls1: BatchChangedPayload[] = [];
            const calls2: BatchChangedPayload[] = [];

            grid.on('batchChanged', (payload) => calls1.push(payload));
            grid.on('batchChanged', (payload) => calls2.push(payload));

            const changes = [
                { x: 5, y: 5, terrainType: 'Forest' as TerrainType },
            ];
            grid.reshapeBatch(changes);

            expect(calls1.length).toBe(1);
            expect(calls2.length).toBe(1);
            expect(calls1[0].changes).toEqual(calls2[0].changes);
        });

        it('should preserve change order in event payload', (done) => {
            const changes = [
                { x: 1, y: 1, terrainType: 'Forest' as TerrainType },
                { x: 2, y: 2, terrainType: 'Mountain' as TerrainType },
                { x: 3, y: 3, terrainType: 'Water' as TerrainType },
            ];

            grid.on('batchChanged', (payload: BatchChangedPayload) => {
                expect(payload.changes[0]).toEqual({
                    x: 1,
                    y: 1,
                    terrainType: 'Forest',
                });
                expect(payload.changes[1]).toEqual({
                    x: 2,
                    y: 2,
                    terrainType: 'Mountain',
                });
                expect(payload.changes[2]).toEqual({
                    x: 3,
                    y: 3,
                    terrainType: 'Water',
                });
                done();
            });

            grid.reshapeBatch(changes);
        });

        it('should not emit cellChanged for batch operations', () => {
            let cellChangedCount = 0;
            grid.on('cellChanged', () => {
                cellChangedCount++;
            });

            const changes = [
                { x: 5, y: 5, terrainType: 'Forest' as TerrainType },
                { x: 8, y: 8, terrainType: 'Mountain' as TerrainType },
            ];

            grid.reshapeBatch(changes);

            expect(cellChangedCount).toBe(0); // Only batchChanged emitted, not cellChanged
        });

        it('should apply all changes atomically before emitting event', (done) => {
            const changes = [
                { x: 5, y: 5, terrainType: 'Forest' as TerrainType },
                { x: 8, y: 8, terrainType: 'Mountain' as TerrainType },
            ];

            grid.on('batchChanged', () => {
                // When listener fires, all changes must already be applied to grid
                expect(grid.getCell(5, 5)!.terrainType).toBe('Forest');
                expect(grid.getCell(8, 8)!.terrainType).toBe('Mountain');
                done();
            });

            grid.reshapeBatch(changes);
        });
    });
});