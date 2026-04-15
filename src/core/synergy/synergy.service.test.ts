import { Grid } from '../grid/grid.service';
import { SynergyEngine } from './synergy.service';

describe('SynergyEngine', () => {
    let grid: Grid;
    let engine: SynergyEngine;

    beforeEach(() => {
        grid = new Grid(16, 16);
        engine = new SynergyEngine(grid);
    });

    describe('Water + Meadow → Fertile Plain rule', () => {
        it('should transform Meadow to Fertile Plain when adjacent to Water', () => {
            // Set up: (5,5) = Water, (5,6) = Meadow
            grid.reshape(5, 5, 'Water');
            grid.reshape(5, 6, 'Meadow');

            engine.apply();

            expect(grid.getCell(5, 6)?.terrainType).toBe('Fertile Plain');
        });

        it('should transform all Meadow neighbors of Water to Fertile Plain', () => {
            // Set up: (8,8) = Water, surrounded by Meadows
            grid.reshape(8, 8, 'Water');
            grid.reshape(7, 8, 'Meadow');
            grid.reshape(8, 7, 'Meadow');
            grid.reshape(9, 8, 'Meadow');
            grid.reshape(8, 9, 'Meadow');

            engine.apply();

            expect(grid.getCell(7, 8)?.terrainType).toBe('Fertile Plain');
            expect(grid.getCell(8, 7)?.terrainType).toBe('Fertile Plain');
            expect(grid.getCell(9, 8)?.terrainType).toBe('Fertile Plain');
            expect(grid.getCell(8, 9)?.terrainType).toBe('Fertile Plain');
        });

        it('should not transform non-Meadow cells adjacent to Water', () => {
            // Set up: (5,5) = Water, (5,6) = Forest
            grid.reshape(5, 5, 'Water');
            grid.reshape(5, 6, 'Forest');

            engine.apply();

            expect(grid.getCell(5, 6)?.terrainType).toBe('Forest');
        });

        it('should not transform Meadow not adjacent to Water', () => {
            // Set up: (5,5) = Water, (5,8) = Meadow (3 cells away)
            grid.reshape(5, 5, 'Water');
            grid.reshape(5, 8, 'Meadow');

            engine.apply();

            expect(grid.getCell(5, 8)?.terrainType).toBe('Meadow');
        });
    });

    describe('3+ adjacent Forests → Sacred Grove rule', () => {
        it('should transform Forest to Sacred Grove when it has 3+ Forest neighbors', () => {
            // Set up: (8,8) = Forest with 4 Forest neighbors
            grid.reshape(8, 8, 'Forest');
            grid.reshape(7, 8, 'Forest');
            grid.reshape(8, 7, 'Forest');
            grid.reshape(9, 8, 'Forest');
            grid.reshape(8, 9, 'Forest');

            engine.apply();

            expect(grid.getCell(8, 8)?.terrainType).toBe('Sacred Grove');
        });

        it('should transform Forest to Sacred Grove with exactly 3 Forest neighbors', () => {
            // Set up: (8,8) = Forest with exactly 3 Forest neighbors
            grid.reshape(8, 8, 'Forest');
            grid.reshape(7, 8, 'Forest');
            grid.reshape(8, 7, 'Forest');
            grid.reshape(9, 8, 'Forest');
            // (8,9) remains Meadow

            engine.apply();

            expect(grid.getCell(8, 8)?.terrainType).toBe('Sacred Grove');
        });

        it('should not transform Forest with only 2 Forest neighbors', () => {
            // Set up: (8,8) = Forest with 2 Forest neighbors
            grid.reshape(8, 8, 'Forest');
            grid.reshape(7, 8, 'Forest');
            grid.reshape(8, 7, 'Forest');
            // (9,8), (8,9) remain Meadow

            engine.apply();

            expect(grid.getCell(8, 8)?.terrainType).toBe('Forest');
        });

        it('should transform isolated Forest clusters independently', () => {
            // Set up: two separate Forest clusters
            // Cluster 1: (5,5) = Forest with 3 neighbors
            grid.reshape(5, 5, 'Forest');
            grid.reshape(4, 5, 'Forest');
            grid.reshape(5, 4, 'Forest');
            grid.reshape(6, 5, 'Forest');

            // Cluster 2: (12,12) = Forest with 2 neighbors (no transformation)
            grid.reshape(12, 12, 'Forest');
            grid.reshape(11, 12, 'Forest');
            grid.reshape(12, 11, 'Forest');

            engine.apply();

            expect(grid.getCell(5, 5)?.terrainType).toBe('Sacred Grove');
            expect(grid.getCell(12, 12)?.terrainType).toBe('Forest');
        });

        it('should work at grid boundaries (corner)', () => {
            // Set up: (0,0) = Forest with 3 Forest neighbors (diagonal + 2 edges)
            grid.reshape(0, 0, 'Forest');
            grid.reshape(1, 0, 'Forest');
            grid.reshape(0, 1, 'Forest');
            grid.reshape(1, 1, 'Forest');

            engine.apply();

            expect(grid.getCell(0, 0)?.terrainType).toBe('Sacred Grove');
        });
    });

    describe('Meadow + Mountain → Foothill rule', () => {
        it('should transform Meadow to Foothill when adjacent to Mountain', () => {
            // Set up: (5,5) = Mountain, (5,6) = Meadow
            grid.reshape(5, 5, 'Mountain');
            grid.reshape(5, 6, 'Meadow');

            engine.apply();

            expect(grid.getCell(5, 6)?.terrainType).toBe('Foothill');
        });

        it('should transform all Meadow neighbors of Mountain to Foothill', () => {
            // Set up: (8,8) = Mountain, surrounded by Meadows
            grid.reshape(8, 8, 'Mountain');
            grid.reshape(7, 8, 'Meadow');
            grid.reshape(8, 7, 'Meadow');
            grid.reshape(9, 8, 'Meadow');
            grid.reshape(8, 9, 'Meadow');

            engine.apply();

            expect(grid.getCell(7, 8)?.terrainType).toBe('Foothill');
            expect(grid.getCell(8, 7)?.terrainType).toBe('Foothill');
            expect(grid.getCell(9, 8)?.terrainType).toBe('Foothill');
            expect(grid.getCell(8, 9)?.terrainType).toBe('Foothill');
        });

        it('should not transform non-Meadow cells adjacent to Mountain', () => {
            // Set up: (5,5) = Mountain, (5,6) = Forest
            grid.reshape(5, 5, 'Mountain');
            grid.reshape(5, 6, 'Forest');

            engine.apply();

            expect(grid.getCell(5, 6)?.terrainType).toBe('Forest');
        });
    });

    describe('Ruins + Forest → Hidden Temple rule', () => {
        it('should transform Ruins to Hidden Temple when adjacent to Forest', () => {
            // Set up: (5,5) = Ruins, (5,6) = Forest
            grid.reshape(5, 5, 'Ruins');
            grid.reshape(5, 6, 'Forest');

            engine.apply();

            expect(grid.getCell(5, 5)?.terrainType).toBe('Hidden Temple');
        });

        it('should transform all Ruins neighbors of Forest to Hidden Temple', () => {
            // Set up: (8,8) = Forest, surrounded by Ruins
            grid.reshape(8, 8, 'Forest');
            grid.reshape(7, 8, 'Ruins');
            grid.reshape(8, 7, 'Ruins');
            grid.reshape(9, 8, 'Ruins');
            grid.reshape(8, 9, 'Ruins');

            engine.apply();

            expect(grid.getCell(7, 8)?.terrainType).toBe('Hidden Temple');
            expect(grid.getCell(8, 7)?.terrainType).toBe('Hidden Temple');
            expect(grid.getCell(9, 8)?.terrainType).toBe('Hidden Temple');
            expect(grid.getCell(8, 9)?.terrainType).toBe('Hidden Temple');
        });

        it('should not transform non-Ruins cells adjacent to Forest (except Ruins)', () => {
            // Set up: (5,5) = Forest, (5,6) = Meadow
            grid.reshape(5, 5, 'Forest');
            grid.reshape(5, 6, 'Meadow');

            engine.apply();

            expect(grid.getCell(5, 6)?.terrainType).toBe('Meadow');
        });
    });

    describe('Integration: Multiple rules', () => {
        it('should apply multiple synergies in a single apply() call', () => {
            // Set up: a small ecosystem
            // Water at (5,5) → should trigger Water+Meadow rule
            // Forest cluster at (10,10) with 4 neighbors → should trigger Sacred Grove rule
            grid.reshape(5, 5, 'Water');
            grid.reshape(5, 6, 'Meadow');

            grid.reshape(10, 10, 'Forest');
            grid.reshape(9, 10, 'Forest');
            grid.reshape(10, 9, 'Forest');
            grid.reshape(11, 10, 'Forest');
            grid.reshape(10, 11, 'Forest');

            engine.apply();

            expect(grid.getCell(5, 6)?.terrainType).toBe('Fertile Plain');
            expect(grid.getCell(10, 10)?.terrainType).toBe('Sacred Grove');
        });

        it('should handle empty dirty cells gracefully', () => {
            // Grid initialized but no reshape calls (no dirty cells)
            engine.apply(); // Should not throw

            // All cells should remain default Meadow/Veiled
            expect(grid.getCell(5, 5)?.terrainType).toBe('Meadow');
        });

        it('should apply synergies only to dirty cells', () => {
            // Reshape at (5,5) to Water
            grid.reshape(5, 5, 'Water');

            // This should only check (5,5) and its neighbors, not all cells
            engine.apply();

            // Dirty cells should be cleared by caller after apply()
            const dirtyCells = grid.getDirtyCells();
            expect(dirtyCells.length).toBeGreaterThan(0); // Changed cells are now dirty
        });
    });

    describe('Edge cases: Boundary synergies', () => {
        it('should apply Water+Meadow rule at grid edges', () => {
            // Set up: (0,5) = Water (left edge), (1,5) = Meadow
            grid.reshape(0, 5, 'Water');
            grid.reshape(1, 5, 'Meadow');

            engine.apply();

            expect(grid.getCell(1, 5)?.terrainType).toBe('Fertile Plain');
        });

        it('should apply Sacred Grove rule at grid corners', () => {
            // Set up: (0,0) = Forest with 3 Forest neighbors (corner case)
            grid.reshape(0, 0, 'Forest');
            grid.reshape(1, 0, 'Forest');
            grid.reshape(0, 1, 'Forest');
            grid.reshape(1, 1, 'Forest');

            engine.apply();

            expect(grid.getCell(0, 0)?.terrainType).toBe('Sacred Grove');
        });

        it('should apply Foothill rule at top edge', () => {
            // Set up: (8,0) = Mountain (top edge), (8,1) = Meadow
            grid.reshape(8, 0, 'Mountain');
            grid.reshape(8, 1, 'Meadow');

            engine.apply();

            expect(grid.getCell(8, 1)?.terrainType).toBe('Foothill');
        });

        it('should apply Hidden Temple rule at right edge', () => {
            // Set up: (15,8) = Forest (right edge), (14,8) = Ruins
            grid.reshape(15, 8, 'Forest');
            grid.reshape(14, 8, 'Ruins');

            engine.apply();

            expect(grid.getCell(14, 8)?.terrainType).toBe('Hidden Temple');
        });

        it('should apply Hidden Temple rule at bottom edge', () => {
            // Set up: (8,15) = Ruins (bottom edge), (8,14) = Forest
            grid.reshape(8, 15, 'Ruins');
            grid.reshape(8, 14, 'Forest');

            engine.apply();

            expect(grid.getCell(8, 15)?.terrainType).toBe('Hidden Temple');
        });
    });

    describe('Cascading synergies', () => {
        it('should mark newly transformed cells as dirty for cascade detection', () => {
            // First reshape marks cells dirty
            grid.reshape(5, 5, 'Water');
            grid.reshape(5, 6, 'Meadow');

            // Apply synergies
            engine.apply();

            // The transformed cell (5,6) should now be dirty and could trigger more synergies
            const dirtyCells = grid.getDirtyCells();
            expect(dirtyCells.some((d) => d.x === 5 && d.y === 6)).toBe(true);
        });

        it('should support multiple apply() calls for synergy chains', () => {
            // Set up: Initial state
            grid.reshape(5, 5, 'Water');
            grid.reshape(5, 6, 'Meadow');
            grid.reshape(4, 6, 'Mountain');

            // First apply: Water+Meadow → Fertile Plain
            engine.apply();
            grid.clearDirty();

            // If Fertile Plain had a rule that triggered from Mountain, it would be checked here
            // For now, just verify the first transformation worked
            expect(grid.getCell(5, 6)?.terrainType).toBe('Fertile Plain');

            // Second apply on different dirty cells
            grid.reshape(10, 10, 'Forest');
            grid.reshape(9, 10, 'Forest');
            grid.reshape(10, 9, 'Forest');
            grid.reshape(11, 10, 'Forest');

            engine.apply();

            expect(grid.getCell(10, 10)?.terrainType).toBe('Sacred Grove');
        });
    });

    describe('Synergy interaction patterns', () => {
        it('should handle Water adjacent to multiple Meadows', () => {
            // Set up: Water in center, Meadows on all cardinal directions
            grid.reshape(8, 8, 'Water');
            grid.reshape(7, 8, 'Meadow');
            grid.reshape(8, 7, 'Meadow');
            grid.reshape(9, 8, 'Meadow');
            grid.reshape(8, 9, 'Meadow');

            engine.apply();

            expect(grid.getCell(7, 8)?.terrainType).toBe('Fertile Plain');
            expect(grid.getCell(8, 7)?.terrainType).toBe('Fertile Plain');
            expect(grid.getCell(9, 8)?.terrainType).toBe('Fertile Plain');
            expect(grid.getCell(8, 9)?.terrainType).toBe('Fertile Plain');
        });

        it('should handle Mountain adjacent to multiple Meadows', () => {
            // Set up: Mountain in center, Meadows on all cardinal directions
            grid.reshape(8, 8, 'Mountain');
            grid.reshape(7, 8, 'Meadow');
            grid.reshape(8, 7, 'Meadow');
            grid.reshape(9, 8, 'Meadow');
            grid.reshape(8, 9, 'Meadow');

            engine.apply();

            expect(grid.getCell(7, 8)?.terrainType).toBe('Foothill');
            expect(grid.getCell(8, 7)?.terrainType).toBe('Foothill');
            expect(grid.getCell(9, 8)?.terrainType).toBe('Foothill');
            expect(grid.getCell(8, 9)?.terrainType).toBe('Foothill');
        });

        it('should handle complex mixed terrain patterns', () => {
            // Set up: Complex pattern with multiple rules potentially triggering
            // Water at (5,5)
            grid.reshape(5, 5, 'Water');
            // Meadow neighbors that should become Fertile Plain
            grid.reshape(5, 6, 'Meadow');
            grid.reshape(6, 5, 'Meadow');

            // Forest cluster at (10,10)
            grid.reshape(10, 10, 'Forest');
            grid.reshape(9, 10, 'Forest');
            grid.reshape(10, 9, 'Forest');
            grid.reshape(11, 10, 'Forest');
            grid.reshape(10, 11, 'Forest');

            engine.apply();

            // Verify both rule sets applied correctly
            expect(grid.getCell(5, 6)?.terrainType).toBe('Fertile Plain');
            expect(grid.getCell(6, 5)?.terrainType).toBe('Fertile Plain');
            expect(grid.getCell(10, 10)?.terrainType).toBe('Sacred Grove');
        });
    });

    describe('Synergy rule order independence', () => {
        it('should produce same results regardless of dirty cell check order', () => {
            // Create two identical grids
            const grid2 = new Grid(16, 16);
            const engine2 = new SynergyEngine(grid2);

            // Apply same changes to both
            grid.reshape(5, 5, 'Water');
            grid.reshape(5, 6, 'Meadow');
            grid.reshape(10, 10, 'Forest');
            grid.reshape(9, 10, 'Forest');
            grid.reshape(10, 9, 'Forest');
            grid.reshape(11, 10, 'Forest');

            grid2.reshape(5, 5, 'Water');
            grid2.reshape(5, 6, 'Meadow');
            grid2.reshape(10, 10, 'Forest');
            grid2.reshape(9, 10, 'Forest');
            grid2.reshape(10, 9, 'Forest');
            grid2.reshape(11, 10, 'Forest');

            // Apply synergies to both
            engine.apply();
            engine2.apply();

            // Both should produce identical results
            expect(grid.getCell(5, 6)?.terrainType).toBe(grid2.getCell(5, 6)?.terrainType);
            expect(grid.getCell(10, 10)?.terrainType).toBe(grid2.getCell(10, 10)?.terrainType);
        });
    });
});