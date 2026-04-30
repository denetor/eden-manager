import { Grid } from '../grid/grid.service';
import { HumansService } from '../humans/humans.service';
import { BuildingSynergyService } from './building-synergy.service';

describe('BuildingSynergyService', () => {
    let grid: Grid;
    let humans: HumansService;
    let service: BuildingSynergyService;

    const makeActive = (x: number, y: number, terrain: string) => {
        grid.setCell(x, y, { state: 'Active', terrainType: terrain as any });
    };

    const placeActiveHuman = (x: number, y: number) => {
        humans.addHuman(`h_${x}_${y}`, x, y);
        // humans start as Active by default
    };

    beforeEach(() => {
        grid = new Grid(16, 16);
        humans = new HumansService(grid);
        service = new BuildingSynergyService(grid, humans);
    });

    // ─── Farm ─────────────────────────────────────────────────────────────────

    describe('Farm rule', () => {
        it('should place Farm on Fertile Plain when human is Active and water is within radius 3', () => {
            makeActive(8, 8, 'Fertile Plain');
            makeActive(8, 5, 'Water');      // distance 3
            placeActiveHuman(8, 8);

            service.apply();

            expect(grid.getCell(8, 8)?.building).toBe('Farm');
        });

        it('should not place Farm when water is outside radius 3', () => {
            makeActive(8, 8, 'Fertile Plain');
            makeActive(8, 4, 'Water');      // distance 4
            placeActiveHuman(8, 8);

            service.apply();

            expect(grid.getCell(8, 8)?.building).toBeUndefined();
        });

        it('should not place Farm when water cell is not Active', () => {
            makeActive(8, 8, 'Fertile Plain');
            grid.setCell(8, 5, { state: 'Dormant', terrainType: 'Water' });
            placeActiveHuman(8, 8);

            service.apply();

            expect(grid.getCell(8, 8)?.building).toBeUndefined();
        });

        it('should not place Farm when terrain is not Fertile Plain', () => {
            makeActive(8, 8, 'Meadow');
            makeActive(8, 5, 'Water');
            placeActiveHuman(8, 8);

            service.apply();

            expect(grid.getCell(8, 8)?.building).toBeUndefined();
        });

        it('should not place Farm when human is Dormant', () => {
            // Start human on Forest (not a food source) with no resources → goes Dormant
            makeActive(8, 8, 'Forest');
            placeActiveHuman(8, 8);
            humans.update();   // Forest is not food, no water/food nearby → Dormant

            // Swap terrain to Fertile Plain and add Water so Farm conditions are met,
            // but the human is already Dormant → building should still be skipped
            makeActive(8, 8, 'Fertile Plain');
            makeActive(8, 5, 'Water');

            service.apply();

            expect(grid.getCell(8, 8)?.building).toBeUndefined();
        });

        it('should not overwrite an existing building', () => {
            makeActive(8, 8, 'Fertile Plain');
            makeActive(8, 5, 'Water');
            grid.setBuilding(8, 8, 'Tower');
            placeActiveHuman(8, 8);

            service.apply();

            expect(grid.getCell(8, 8)?.building).toBe('Tower');
        });
    });

    // ─── Mill ─────────────────────────────────────────────────────────────────

    describe('Mill rule', () => {
        it('should place Mill on Meadow adjacent (orthogonal) to Farm with water nearby', () => {
            makeActive(8, 8, 'Meadow');
            makeActive(8, 7, 'Fertile Plain');  // Farm cell to the north
            grid.setBuilding(8, 7, 'Farm');
            makeActive(8, 5, 'Water');
            placeActiveHuman(8, 8);

            service.apply();

            expect(grid.getCell(8, 8)?.building).toBe('Mill');
        });

        it('should place Mill on Fertile Plain adjacent (orthogonal) to Farm', () => {
            makeActive(8, 8, 'Fertile Plain');
            makeActive(7, 8, 'Fertile Plain');
            grid.setBuilding(7, 8, 'Farm');
            makeActive(8, 5, 'Water');
            placeActiveHuman(8, 8);

            service.apply();

            // Fertile Plain + water → Farm takes priority over Mill
            expect(grid.getCell(8, 8)?.building).toBe('Farm');
        });

        it('should not place Mill when Farm is only diagonally adjacent', () => {
            makeActive(8, 8, 'Meadow');
            makeActive(7, 7, 'Fertile Plain');  // diagonal, not orthogonal
            grid.setBuilding(7, 7, 'Farm');
            makeActive(8, 5, 'Water');
            placeActiveHuman(8, 8);

            service.apply();

            expect(grid.getCell(8, 8)?.building).toBeUndefined();
        });

        it('should not place Mill when no Farm is orthogonally adjacent', () => {
            makeActive(8, 8, 'Meadow');
            makeActive(8, 5, 'Water');
            placeActiveHuman(8, 8);

            service.apply();

            expect(grid.getCell(8, 8)?.building).toBeUndefined();
        });

        it('should not place Mill when water is absent', () => {
            makeActive(8, 8, 'Meadow');
            makeActive(8, 7, 'Fertile Plain');
            grid.setBuilding(8, 7, 'Farm');
            placeActiveHuman(8, 8);

            service.apply();

            expect(grid.getCell(8, 8)?.building).toBeUndefined();
        });
    });

    // ─── Shrine ───────────────────────────────────────────────────────────────

    describe('Shrine rule', () => {
        it('should place Shrine on Sacred Grove when human is Active', () => {
            makeActive(8, 8, 'Sacred Grove');
            placeActiveHuman(8, 8);

            service.apply();

            expect(grid.getCell(8, 8)?.building).toBe('Shrine');
        });

        it('should not place Shrine when human is Dormant', () => {
            makeActive(8, 8, 'Sacred Grove');
            placeActiveHuman(8, 8);
            humans.update();   // no food/water → Dormant

            service.apply();

            expect(grid.getCell(8, 8)?.building).toBeUndefined();
        });

        it('should not place Shrine when no human is present', () => {
            makeActive(8, 8, 'Sacred Grove');

            service.apply();

            expect(grid.getCell(8, 8)?.building).toBeUndefined();
        });
    });

    // ─── Tower ────────────────────────────────────────────────────────────────

    describe('Tower rule', () => {
        it('should place Tower on Foothill when human is Active', () => {
            makeActive(8, 8, 'Foothill');
            placeActiveHuman(8, 8);

            service.apply();

            expect(grid.getCell(8, 8)?.building).toBe('Tower');
        });

        it('should not place Tower when human is Dormant', () => {
            makeActive(8, 8, 'Foothill');
            placeActiveHuman(8, 8);
            humans.update();   // no food/water → Dormant

            service.apply();

            expect(grid.getCell(8, 8)?.building).toBeUndefined();
        });

        it('should not place Tower on non-Foothill terrain', () => {
            makeActive(8, 8, 'Mountain');
            placeActiveHuman(8, 8);

            service.apply();

            expect(grid.getCell(8, 8)?.building).toBeUndefined();
        });
    });

    // ─── General ──────────────────────────────────────────────────────────────

    describe('general rules', () => {
        it('should not place any building on a cell with no human', () => {
            makeActive(8, 8, 'Fertile Plain');
            makeActive(8, 5, 'Water');

            service.apply();

            expect(grid.getCell(8, 8)?.building).toBeUndefined();
        });

        it('should not modify a cell that already has a building', () => {
            makeActive(8, 8, 'Sacred Grove');
            grid.setBuilding(8, 8, 'Tower');
            placeActiveHuman(8, 8);

            service.apply();

            expect(grid.getCell(8, 8)?.building).toBe('Tower');
        });

        it('should not place any building on a Dormant cell', () => {
            grid.setCell(8, 8, { state: 'Dormant', terrainType: 'Sacred Grove' });
            placeActiveHuman(8, 8);

            service.apply();

            expect(grid.getCell(8, 8)?.building).toBeUndefined();
        });
    });
});
