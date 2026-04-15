import { TileMap } from 'excalibur';
import { Grid } from '../core/grid/grid.service';
import { TileMapRenderer } from './tilemap-renderer.service';

describe('TileMapRenderer', () => {
    let renderer: TileMapRenderer;
    let grid: Grid;
    let mockTileMap: jasmine.SpyObj<TileMap>;

    beforeEach(() => {
        // Create a grid and a mock TileMap
        grid = new Grid(16, 16);
        mockTileMap = jasmine.createSpyObj('TileMap', ['setTile']);

        // Create renderer with mocked TileMap
        renderer = new TileMapRenderer(mockTileMap, grid);
    });

    describe('Tile ID Calculation', () => {
        it('should calculate Meadow Veiled tile ID (1 + 100 = 101)', () => {
            const cell = grid.getCell(0, 0)!;
            expect(cell.state).toBe('Veiled');
            expect(cell.terrainType).toBe('Meadow');

            renderer.updateCell(0, 0, cell);
            expect(mockTileMap.setTile).toHaveBeenCalledWith(0, 0, 101);
        });

        it('should calculate Meadow Dormant tile ID (1 + 200 = 201)', () => {
            grid.unveil(5, 5);
            const cell = grid.getCell(5, 5)!;

            renderer.updateCell(5, 5, cell);
            expect(mockTileMap.setTile).toHaveBeenCalledWith(5, 5, 201);
        });

        it('should calculate Meadow Active tile ID (1 + 300 = 301)', () => {
            grid.unveil(5, 5);
            grid.awaken(5, 5);
            const cell = grid.getCell(5, 5)!;

            renderer.updateCell(5, 5, cell);
            expect(mockTileMap.setTile).toHaveBeenCalledWith(5, 5, 301);
        });

        it('should calculate Forest Veiled tile ID (2 + 100 = 102)', () => {
            grid.reshape(3, 3, 'Forest');
            const cell = grid.getCell(3, 3)!;

            renderer.updateCell(3, 3, cell);
            expect(mockTileMap.setTile).toHaveBeenCalledWith(3, 3, 102);
        });

        it('should calculate Forest Dormant tile ID (2 + 200 = 202)', () => {
            grid.reshape(3, 3, 'Forest');
            grid.unveil(3, 3);
            const cell = grid.getCell(3, 3)!;

            renderer.updateCell(3, 3, cell);
            expect(mockTileMap.setTile).toHaveBeenCalledWith(3, 3, 202);
        });

        it('should calculate Mountain Active tile ID (3 + 300 = 303)', () => {
            grid.reshape(7, 7, 'Mountain');
            grid.unveil(7, 7);
            grid.awaken(7, 7);
            const cell = grid.getCell(7, 7)!;

            renderer.updateCell(7, 7, cell);
            expect(mockTileMap.setTile).toHaveBeenCalledWith(7, 7, 303);
        });

        it('should calculate Water Veiled tile ID (4 + 100 = 104)', () => {
            grid.reshape(2, 4, 'Water');
            const cell = grid.getCell(2, 4)!;

            renderer.updateCell(2, 4, cell);
            expect(mockTileMap.setTile).toHaveBeenCalledWith(2, 4, 104);
        });

        it('should calculate Ruins Active tile ID (5 + 300 = 305)', () => {
            grid.reshape(10, 10, 'Ruins');
            grid.unveil(10, 10);
            grid.awaken(10, 10);
            const cell = grid.getCell(10, 10)!;

            renderer.updateCell(10, 10, cell);
            expect(mockTileMap.setTile).toHaveBeenCalledWith(10, 10, 305);
        });

        it('should calculate Fertile Plain Dormant tile ID (6 + 200 = 206)', () => {
            grid.reshape(6, 6, 'Fertile Plain');
            grid.unveil(6, 6);
            const cell = grid.getCell(6, 6)!;

            renderer.updateCell(6, 6, cell);
            expect(mockTileMap.setTile).toHaveBeenCalledWith(6, 6, 206);
        });

        it('should calculate Sacred Grove Active tile ID (7 + 300 = 307)', () => {
            grid.reshape(9, 9, 'Sacred Grove');
            grid.unveil(9, 9);
            grid.awaken(9, 9);
            const cell = grid.getCell(9, 9)!;

            renderer.updateCell(9, 9, cell);
            expect(mockTileMap.setTile).toHaveBeenCalledWith(9, 9, 307);
        });
    });

    describe('Event Subscription - cellChanged', () => {
        it('should call setTile when cellChanged event is emitted', () => {
            mockTileMap.setTile.calls.reset();

            grid.reshape(4, 4, 'Forest');

            expect(mockTileMap.setTile).toHaveBeenCalled();
            expect(mockTileMap.setTile).toHaveBeenCalledWith(4, 4, 102); // Forest Veiled
        });

        it('should call setTile with correct ID when unveil emits cellChanged', () => {
            mockTileMap.setTile.calls.reset();

            grid.reshape(8, 8, 'Mountain');
            mockTileMap.setTile.calls.reset();

            grid.unveil(8, 8);

            expect(mockTileMap.setTile).toHaveBeenCalledWith(8, 8, 203); // Mountain Dormant
        });

        it('should call setTile with correct ID when awaken emits cellChanged', () => {
            grid.reshape(5, 5, 'Water');
            grid.unveil(5, 5);
            mockTileMap.setTile.calls.reset();

            grid.awaken(5, 5);

            expect(mockTileMap.setTile).toHaveBeenCalledWith(5, 5, 304); // Water Active
        });
    });

    describe('Event Subscription - batchChanged', () => {
        it('should call setTile for each cell in a batch reshape', () => {
            mockTileMap.setTile.calls.reset();

            const changes = [
                { x: 0, y: 0, terrainType: 'Forest' as const },
                { x: 1, y: 0, terrainType: 'Water' as const },
                { x: 2, y: 0, terrainType: 'Mountain' as const },
            ];

            grid.reshapeBatch(changes);

            expect(mockTileMap.setTile).toHaveBeenCalledTimes(3);
            expect(mockTileMap.setTile).toHaveBeenCalledWith(0, 0, 102); // Forest Veiled
            expect(mockTileMap.setTile).toHaveBeenCalledWith(1, 0, 104); // Water Veiled
            expect(mockTileMap.setTile).toHaveBeenCalledWith(2, 0, 103); // Mountain Veiled
        });

        it('should handle batch changes with 9 cells', () => {
            mockTileMap.setTile.calls.reset();

            const changes = [];
            for (let x = 0; x < 3; x++) {
                for (let y = 0; y < 3; y++) {
                    changes.push({
                        x,
                        y,
                        terrainType: ['Forest', 'Water', 'Mountain'][x % 3] as any,
                    });
                }
            }

            grid.reshapeBatch(changes);

            expect(mockTileMap.setTile).toHaveBeenCalledTimes(9);
        });
    });

    describe('Multiple Cell Updates', () => {
        it('should update different cells independently', () => {
            mockTileMap.setTile.calls.reset();

            grid.reshape(2, 2, 'Forest');
            grid.reshape(5, 5, 'Water');
            grid.reshape(10, 10, 'Mountain');

            expect(mockTileMap.setTile).toHaveBeenCalledWith(2, 2, 102); // Forest Veiled
            expect(mockTileMap.setTile).toHaveBeenCalledWith(5, 5, 104); // Water Veiled
            expect(mockTileMap.setTile).toHaveBeenCalledWith(10, 10, 103); // Mountain Veiled
        });

        it('should update the same cell multiple times with correct IDs', () => {
            mockTileMap.setTile.calls.reset();

            grid.reshape(6, 6, 'Forest');
            expect(mockTileMap.setTile).toHaveBeenLastCalledWith(6, 6, 102); // Forest Veiled

            mockTileMap.setTile.calls.reset();
            grid.unveil(6, 6);
            expect(mockTileMap.setTile).toHaveBeenCalledWith(6, 6, 202); // Forest Dormant

            mockTileMap.setTile.calls.reset();
            grid.awaken(6, 6);
            expect(mockTileMap.setTile).toHaveBeenCalledWith(6, 6, 302); // Forest Active

            mockTileMap.setTile.calls.reset();
            grid.reshape(6, 6, 'Mountain');
            expect(mockTileMap.setTile).toHaveBeenCalledWith(6, 6, 302); // Mountain Active (state preserved)
        });
    });

    describe('Integration: Grid State → TileMap', () => {
        it('should preserve state through reshape sequence', () => {
            mockTileMap.setTile.calls.reset();

            // Create a pattern
            grid.reshape(3, 3, 'Forest');
            grid.reshape(4, 3, 'Water');
            grid.reshape(5, 3, 'Mountain');

            // Unveil some cells
            grid.unveil(3, 3);
            grid.unveil(4, 3);

            // Awaken one
            grid.awaken(5, 3);

            // Verify TileMap received all updates in correct order
            expect(mockTileMap.setTile).toHaveBeenCalledWith(3, 3, 102); // Forest Veiled -> Dormant -> 202
            expect(mockTileMap.setTile).toHaveBeenCalledWith(4, 3, 104); // Water Veiled -> Dormant -> 204
            expect(mockTileMap.setTile).toHaveBeenCalledWith(5, 3, 103); // Mountain Veiled -> Active -> 303
        });

        it('should handle edge cells correctly', () => {
            mockTileMap.setTile.calls.reset();

            // Test corner (0, 0)
            grid.reshape(0, 0, 'Forest');
            expect(mockTileMap.setTile).toHaveBeenCalledWith(0, 0, 102);

            // Test corner (15, 15)
            grid.reshape(15, 15, 'Water');
            expect(mockTileMap.setTile).toHaveBeenCalledWith(15, 15, 104);

            // Test edge (0, 8)
            grid.reshape(0, 8, 'Mountain');
            expect(mockTileMap.setTile).toHaveBeenCalledWith(0, 8, 103);
        });
    });

    describe('TileMap Access', () => {
        it('should return the underlying TileMap instance', () => {
            expect(renderer.getTileMap()).toBe(mockTileMap);
        });
    });

    describe('All Terrain Types', () => {
        it('should correctly map all base terrain types to IDs 1-9', () => {
            const terrains = [
                { terrain: 'Meadow', baseId: 1 },
                { terrain: 'Forest', baseId: 2 },
                { terrain: 'Mountain', baseId: 3 },
                { terrain: 'Water', baseId: 4 },
                { terrain: 'Ruins', baseId: 5 },
                { terrain: 'Fertile Plain', baseId: 6 },
                { terrain: 'Sacred Grove', baseId: 7 },
                { terrain: 'Foothill', baseId: 8 },
                { terrain: 'Hidden Temple', baseId: 9 },
            ];

            for (const { terrain, baseId } of terrains) {
                mockTileMap.setTile.calls.reset();
                grid.reshape(7, 7, terrain as any);
                expect(mockTileMap.setTile).toHaveBeenCalledWith(7, 7, baseId + 100); // Veiled
            }
        });
    });

    describe('State Offsets', () => {
        it('should apply correct offset for Veiled state (+100)', () => {
            mockTileMap.setTile.calls.reset();
            grid.reshape(8, 8, 'Forest');
            const cell = grid.getCell(8, 8)!;

            expect(cell.state).toBe('Veiled');
            renderer.updateCell(8, 8, cell);
            expect(mockTileMap.setTile).toHaveBeenCalledWith(8, 8, 102); // 2 + 100
        });

        it('should apply correct offset for Dormant state (+200)', () => {
            mockTileMap.setTile.calls.reset();
            grid.reshape(8, 8, 'Forest');
            grid.unveil(8, 8);
            const cell = grid.getCell(8, 8)!;

            expect(cell.state).toBe('Dormant');
            renderer.updateCell(8, 8, cell);
            expect(mockTileMap.setTile).toHaveBeenCalledWith(8, 8, 202); // 2 + 200
        });

        it('should apply correct offset for Active state (+300)', () => {
            mockTileMap.setTile.calls.reset();
            grid.reshape(8, 8, 'Forest');
            grid.unveil(8, 8);
            grid.awaken(8, 8);
            const cell = grid.getCell(8, 8)!;

            expect(cell.state).toBe('Active');
            renderer.updateCell(8, 8, cell);
            expect(mockTileMap.setTile).toHaveBeenCalledWith(8, 8, 302); // 2 + 300
        });
    });
});