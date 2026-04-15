import { Grid } from '../core/grid/grid.service';
import { PersistenceService } from './persistence.service';

describe('Grid Serialization', () => {
    let grid: Grid;

    beforeEach(() => {
        grid = new Grid(16, 16);
    });

    describe('Grid.toJSON()', () => {
        it('should return object with width, height, and cells', () => {
            const json = grid.toJSON();
            expect(json).toHaveProperty('width');
            expect(json).toHaveProperty('height');
            expect(json).toHaveProperty('cells');
        });

        it('should have correct dimensions', () => {
            const json = grid.toJSON();
            expect(json.width).toBe(16);
            expect(json.height).toBe(16);
        });

        it('should serialize all cells', () => {
            const json = grid.toJSON();
            expect(json.cells).toHaveLength(256); // 16 * 16
        });

        it('should preserve cell state and terrain', () => {
            grid.reshape(5, 5, 'Forest');
            grid.unveil(7, 7);

            const json = grid.toJSON();
            const cell55 = json.cells.find((c) => c.x === 5 && c.y === 5);
            const cell77 = json.cells.find((c) => c.x === 7 && c.y === 7);

            expect(cell55?.terrainType).toBe('Forest');
            expect(cell77?.state).toBe('Dormant');
        });

        it('should not affect original grid when modifying serialized data', () => {
            const originalCell = grid.getCell(5, 5);
            const json = grid.toJSON();
            const serializedCell = json.cells.find((c) => c.x === 5 && c.y === 5);

            if (serializedCell) {
                serializedCell.terrainType = 'Mountain';
            }

            expect(originalCell?.terrainType).toBe('Meadow');
        });

        it('should produce consistent output for same grid state', () => {
            grid.reshape(5, 5, 'Forest');
            const json1 = grid.toJSON();
            const json2 = grid.toJSON();

            expect(JSON.stringify(json1)).toBe(JSON.stringify(json2));
        });

        it('should produce valid JSON string', () => {
            const json = grid.toJSON();
            const jsonString = JSON.stringify(json);
            const parsed = JSON.parse(jsonString);

            expect(parsed.width).toBe(16);
            expect(parsed.height).toBe(16);
            expect(parsed.cells).toHaveLength(256);
        });

        it('should produce reasonably sized JSON (~5KB for 16x16)', () => {
            const json = grid.toJSON();
            const jsonString = JSON.stringify(json);
            const sizeKB = jsonString.length / 1024;

            expect(sizeKB).toBeLessThan(10); // Should be under 10KB
            expect(sizeKB).toBeGreaterThan(1); // Should be at least 1KB
        });
    });

    describe('Grid.fromJSON()', () => {
        it('should reconstruct grid with correct dimensions', () => {
            const json = grid.toJSON();
            const loaded = Grid.fromJSON(json);

            expect(loaded).not.toBeNull();
            expect(loaded?.getWidth()).toBe(16);
            expect(loaded?.getHeight()).toBe(16);
        });

        it('should restore cell states and terrain', () => {
            grid.reshape(5, 5, 'Forest');
            grid.unveil(7, 7);
            grid.reshape(8, 8, 'Mountain');

            const json = grid.toJSON();
            const loaded = Grid.fromJSON(json);

            expect(loaded?.getCell(5, 5)?.terrainType).toBe('Forest');
            expect(loaded?.getCell(7, 7)?.state).toBe('Dormant');
            expect(loaded?.getCell(8, 8)?.terrainType).toBe('Mountain');
        });

        it('should restore cell coordinates correctly', () => {
            const json = grid.toJSON();
            const loaded = Grid.fromJSON(json);

            const cell = loaded?.getCell(10, 12);
            expect(cell?.x).toBe(10);
            expect(cell?.y).toBe(12);
        });

        it('should handle complex terrain patterns', () => {
            // Create a pattern
            grid.reshape(4, 4, 'Water');
            grid.reshape(4, 5, 'Meadow');
            grid.reshape(5, 4, 'Forest');
            grid.reshape(5, 5, 'Mountain');

            const json = grid.toJSON();
            const loaded = Grid.fromJSON(json);

            expect(loaded?.getCell(4, 4)?.terrainType).toBe('Water');
            expect(loaded?.getCell(4, 5)?.terrainType).toBe('Meadow');
            expect(loaded?.getCell(5, 4)?.terrainType).toBe('Forest');
            expect(loaded?.getCell(5, 5)?.terrainType).toBe('Mountain');
        });

        it('should return null for invalid width', () => {
            const json = { width: -1, height: 16, cells: [] };
            expect(Grid.fromJSON(json)).toBeNull();
        });

        it('should return null for invalid height', () => {
            const json = { width: 16, height: 'invalid', cells: [] } as any;
            expect(Grid.fromJSON(json)).toBeNull();
        });

        it('should return null for missing cells', () => {
            const json = { width: 16, height: 16 } as any;
            expect(Grid.fromJSON(json)).toBeNull();
        });

        it('should return null for non-array cells', () => {
            const json = { width: 16, height: 16, cells: 'not an array' };
            expect(Grid.fromJSON(json)).toBeNull();
        });

        it('should return null for null input', () => {
            expect(Grid.fromJSON(null as any)).toBeNull();
        });

        it('should return null for undefined input', () => {
            expect(Grid.fromJSON(undefined as any)).toBeNull();
        });
    });

    describe('Grid Round-trip (toJSON → fromJSON)', () => {
        it('should maintain state after round-trip', () => {
            grid.reshape(5, 5, 'Forest');
            grid.reshape(6, 6, 'Mountain');
            grid.unveil(7, 7);
            grid.awaken(8, 8);

            const json = grid.toJSON();
            const loaded = Grid.fromJSON(json);

            expect(loaded?.getCell(5, 5)?.terrainType).toBe('Forest');
            expect(loaded?.getCell(6, 6)?.terrainType).toBe('Mountain');
            expect(loaded?.getCell(7, 7)?.state).toBe('Dormant');
            expect(loaded?.getCell(8, 8)?.state).toBe('Active');
        });

        it('should preserve all cells in round-trip', () => {
            // Modify multiple cells
            for (let x = 0; x < 5; x++) {
                for (let y = 0; y < 5; y++) {
                    const terrain = ['Forest', 'Water', 'Mountain', 'Ruins'][
                        (x + y) % 4
                    ] as any;
                    grid.reshape(x, y, terrain);
                }
            }

            const json = grid.toJSON();
            const loaded = Grid.fromJSON(json);

            for (let x = 0; x < 5; x++) {
                for (let y = 0; y < 5; y++) {
                    const original = grid.getCell(x, y);
                    const restored = loaded?.getCell(x, y);
                    expect(restored?.terrainType).toBe(original?.terrainType);
                    expect(restored?.state).toBe(original?.state);
                }
            }
        });

        it('should create independent grid after round-trip', () => {
            grid.reshape(5, 5, 'Forest');

            const json = grid.toJSON();
            const loaded = Grid.fromJSON(json);

            // Modify original grid
            grid.reshape(5, 5, 'Mountain');

            // Loaded grid should be unaffected
            expect(grid.getCell(5, 5)?.terrainType).toBe('Mountain');
            expect(loaded?.getCell(5, 5)?.terrainType).toBe('Forest');
        });
    });
});

describe('PersistenceService', () => {
    let persistence: PersistenceService;
    let grid: Grid;

    beforeEach(() => {
        persistence = new PersistenceService();
        grid = new Grid(16, 16);

        // Mock localStorage for testing
        const store: { [key: string]: string } = {};
        global.localStorage = {
            getItem: (key: string) => store[key] || null,
            setItem: (key: string, value: string) => {
                store[key] = value;
            },
            removeItem: (key: string) => {
                delete store[key];
            },
            clear: () => {
                Object.keys(store).forEach((key) => delete store[key]);
            },
            length: Object.keys(store).length,
            key: (index: number) => Object.keys(store)[index] || null,
        } as any;
    });

    describe('saveGrid()', () => {
        it('should save grid to localStorage', () => {
            const result = persistence.saveGrid(grid);
            expect(result).toBe(true);
        });

        it('should store JSON string in localStorage', () => {
            persistence.saveGrid(grid);
            const stored = localStorage.getItem('edenManagerGameState');

            expect(stored).not.toBeNull();
            const parsed = JSON.parse(stored!);
            expect(parsed.width).toBe(16);
            expect(parsed.height).toBe(16);
        });

        it('should preserve grid state in localStorage', () => {
            grid.reshape(5, 5, 'Forest');
            grid.reshape(6, 6, 'Mountain');
            grid.unveil(7, 7);

            persistence.saveGrid(grid);
            const stored = localStorage.getItem('edenManagerGameState');
            const parsed = JSON.parse(stored!);

            const cell55 = parsed.cells.find(
                (c: any) => c.x === 5 && c.y === 5
            );
            const cell77 = parsed.cells.find(
                (c: any) => c.x === 7 && c.y === 7
            );

            expect(cell55?.terrainType).toBe('Forest');
            expect(cell77?.state).toBe('Dormant');
        });

        it('should overwrite previous saves', () => {
            const grid1 = new Grid(16, 16);
            grid1.reshape(5, 5, 'Forest');
            persistence.saveGrid(grid1);

            const grid2 = new Grid(16, 16);
            grid2.reshape(6, 6, 'Mountain');
            persistence.saveGrid(grid2);

            const stored = JSON.parse(
                localStorage.getItem('edenManagerGameState')!
            );
            const cell55 = stored.cells.find((c: any) => c.x === 5 && c.y === 5);
            const cell66 = stored.cells.find((c: any) => c.x === 6 && c.y === 6);

            expect(cell55?.terrainType).toBe('Meadow'); // Original state
            expect(cell66?.terrainType).toBe('Mountain'); // New state
        });

        it('should return false if localStorage not available', () => {
            const originalLocalStorage = global.localStorage;
            (global as any).localStorage = undefined;

            const result = persistence.saveGrid(grid);
            expect(result).toBe(false);

            global.localStorage = originalLocalStorage;
        });
    });

    describe('loadGrid()', () => {
        it('should load grid from localStorage', () => {
            grid.reshape(5, 5, 'Forest');
            persistence.saveGrid(grid);

            const loaded = persistence.loadGrid();
            expect(loaded).not.toBeNull();
            expect(loaded?.getWidth()).toBe(16);
            expect(loaded?.getHeight()).toBe(16);
        });

        it('should restore grid state from localStorage', () => {
            grid.reshape(5, 5, 'Forest');
            grid.reshape(6, 6, 'Mountain');
            grid.unveil(7, 7);
            persistence.saveGrid(grid);

            const loaded = persistence.loadGrid();
            expect(loaded?.getCell(5, 5)?.terrainType).toBe('Forest');
            expect(loaded?.getCell(6, 6)?.terrainType).toBe('Mountain');
            expect(loaded?.getCell(7, 7)?.state).toBe('Dormant');
        });

        it('should return null if no saved game exists', () => {
            const loaded = persistence.loadGrid();
            expect(loaded).toBeNull();
        });

        it('should return null if localStorage is corrupted', () => {
            localStorage.setItem('edenManagerGameState', 'invalid json {');
            const loaded = persistence.loadGrid();
            expect(loaded).toBeNull();
        });

        it('should return null if localStorage not available', () => {
            const originalLocalStorage = global.localStorage;
            (global as any).localStorage = undefined;

            const loaded = persistence.loadGrid();
            expect(loaded).toBeNull();

            global.localStorage = originalLocalStorage;
        });

        it('should handle partial JSON gracefully', () => {
            localStorage.setItem(
                'edenManagerGameState',
                JSON.stringify({ width: 16 })
            );
            const loaded = persistence.loadGrid();
            expect(loaded).toBeNull();
        });
    });

    describe('deleteGameState()', () => {
        it('should delete game state from localStorage', () => {
            persistence.saveGrid(grid);
            expect(localStorage.getItem('edenManagerGameState')).not.toBeNull();

            const result = persistence.deleteGameState();
            expect(result).toBe(true);
            expect(localStorage.getItem('edenManagerGameState')).toBeNull();
        });

        it('should return true even if no game state exists', () => {
            const result = persistence.deleteGameState();
            expect(result).toBe(true);
        });

        it('should return false if localStorage not available', () => {
            const originalLocalStorage = global.localStorage;
            (global as any).localStorage = undefined;

            const result = persistence.deleteGameState();
            expect(result).toBe(false);

            global.localStorage = originalLocalStorage;
        });
    });

    describe('hasSavedGame()', () => {
        it('should return true if saved game exists', () => {
            persistence.saveGrid(grid);
            expect(persistence.hasSavedGame()).toBe(true);
        });

        it('should return false if no saved game exists', () => {
            expect(persistence.hasSavedGame()).toBe(false);
        });

        it('should return false after deletion', () => {
            persistence.saveGrid(grid);
            persistence.deleteGameState();
            expect(persistence.hasSavedGame()).toBe(false);
        });

        it('should return false if localStorage not available', () => {
            const originalLocalStorage = global.localStorage;
            (global as any).localStorage = undefined;

            expect(persistence.hasSavedGame()).toBe(false);

            global.localStorage = originalLocalStorage;
        });
    });

    describe('Integration: Save and Load Cycle', () => {
        it('should preserve grid state through save/load cycle', () => {
            // Create complex grid state
            grid.reshape(4, 4, 'Water');
            grid.reshape(4, 5, 'Meadow');
            grid.reshape(5, 4, 'Forest');
            grid.unveil(10, 10);
            grid.reshape(10, 10, 'Ruins');
            grid.awaken(15, 15);

            // Save
            persistence.saveGrid(grid);

            // Create new grid and load
            const newGrid = new Grid(16, 16);
            const loaded = persistence.loadGrid();

            // Verify all states match
            expect(loaded?.getCell(4, 4)?.terrainType).toBe('Water');
            expect(loaded?.getCell(4, 5)?.terrainType).toBe('Meadow');
            expect(loaded?.getCell(5, 4)?.terrainType).toBe('Forest');
            expect(loaded?.getCell(10, 10)?.state).toBe('Dormant');
            expect(loaded?.getCell(10, 10)?.terrainType).toBe('Ruins');
            expect(loaded?.getCell(15, 15)?.state).toBe('Active');
        });

        it('should allow multiple save/load cycles', () => {
            // First save
            grid.reshape(5, 5, 'Forest');
            persistence.saveGrid(grid);

            // Modify and second save
            grid.reshape(5, 5, 'Mountain');
            persistence.saveGrid(grid);

            // Load should have latest state
            const loaded = persistence.loadGrid();
            expect(loaded?.getCell(5, 5)?.terrainType).toBe('Mountain');
        });

        it('should load fresh grid if no save exists', () => {
            const loaded = persistence.loadGrid();
            expect(loaded).toBeNull();
        });
    });
});