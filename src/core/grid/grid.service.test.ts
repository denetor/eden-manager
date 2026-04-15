import { Grid } from './grid.service';
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
});