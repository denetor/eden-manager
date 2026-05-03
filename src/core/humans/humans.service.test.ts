import { Grid } from '../grid/grid.service';
import { HumansService, HumanStatusChangedPayload } from './humans.service';

describe('HumansService', () => {
    let grid: Grid;
    let service: HumansService;

    // Helpers to set up terrain quickly
    const makeActive = (x: number, y: number, terrain: 'Water' | 'Meadow' | 'Fertile Plain' | 'Foothill' | 'Forest') => {
        grid.setCell(x, y, { state: 'Active', terrainType: terrain });
    };

    const makeDormant = (x: number, y: number, terrain: 'Water' | 'Meadow') => {
        grid.setCell(x, y, { state: 'Dormant', terrainType: terrain });
    };

    beforeEach(() => {
        grid = new Grid(16, 16);
        service = new HumansService(grid);
    });

    describe('addHuman', () => {
        it('should add a human with status Active', () => {
            service.addHuman('h1', 5, 5);

            expect(service.getHumans()[0].status).toBe('Active');
        });

        it('should set the correct id, x, and y', () => {
            service.addHuman('abc', 3, 7);
            const human = service.getHumans()[0];

            expect(human.id).toBe('abc');
            expect(human.x).toBe(3);
            expect(human.y).toBe(7);
        });
    });

    describe('update - survival status', () => {
        it('should keep human Active when Active Water (radius 3) and Active Meadow (radius 2) are present', () => {
            service.addHuman('h1', 8, 8);
            makeActive(8, 5, 'Water');    // distance 3 (within water radius)
            makeActive(8, 6, 'Meadow');   // distance 2 (within food radius)

            service.update();

            expect(service.getHumans()[0].status).toBe('Active');
        });

        it('should make human Dormant when no Active Water within radius 3', () => {
            service.addHuman('h1', 8, 8);
            makeActive(8, 6, 'Meadow');
            // Water is absent

            service.update();

            expect(service.getHumans()[0].status).toBe('Dormant');
        });

        it('should make human Dormant when no Active food terrain within radius 2', () => {
            service.addHuman('h1', 8, 8);
            makeActive(8, 5, 'Water');
            // Meadow / Fertile Plain absent within radius 2

            service.update();

            expect(service.getHumans()[0].status).toBe('Dormant');
        });

        it('should make human Dormant when neither water nor food are present', () => {
            service.addHuman('h1', 8, 8);

            service.update();

            expect(service.getHumans()[0].status).toBe('Dormant');
        });

        it('should not count a Dormant Water cell as a valid water source', () => {
            service.addHuman('h1', 8, 8);
            makeDormant(8, 5, 'Water');   // state Dormant → does not count
            makeActive(8, 6, 'Meadow');

            service.update();

            expect(service.getHumans()[0].status).toBe('Dormant');
        });

        it('should not count a Dormant Meadow cell as a valid food source', () => {
            service.addHuman('h1', 8, 8);
            makeActive(8, 5, 'Water');
            makeDormant(8, 6, 'Meadow');  // state Dormant → does not count

            service.update();

            expect(service.getHumans()[0].status).toBe('Dormant');
        });

        it('should count Active Fertile Plain as a food source', () => {
            service.addHuman('h1', 8, 8);
            makeActive(8, 5, 'Water');
            makeActive(8, 6, 'Fertile Plain');

            service.update();

            expect(service.getHumans()[0].status).toBe('Active');
        });

        it('should count Active Foothill as a food source', () => {
            service.addHuman('h1', 8, 8);
            makeActive(8, 5, 'Water');
            makeActive(8, 6, 'Foothill');

            service.update();

            expect(service.getHumans()[0].status).toBe('Active');
        });

        it('should count Active Forest as a food source', () => {
            service.addHuman('h1', 8, 8);
            makeActive(8, 5, 'Water');
            makeActive(8, 6, 'Forest');

            service.update();

            expect(service.getHumans()[0].status).toBe('Active');
        });

        it('should count the human own Active Meadow cell as food (distance 0)', () => {
            grid.setCell(8, 8, { state: 'Active', terrainType: 'Meadow' });
            service.addHuman('h1', 8, 8);
            makeActive(8, 5, 'Water');

            service.update();

            expect(service.getHumans()[0].status).toBe('Active');
        });

        it('should not count Water that is exactly at radius 4 (outside water radius 3)', () => {
            service.addHuman('h1', 8, 8);
            makeActive(8, 4, 'Water');    // distance 4 — outside radius 3
            makeActive(8, 6, 'Meadow');

            service.update();

            expect(service.getHumans()[0].status).toBe('Dormant');
        });

        it('should not count food terrain at radius 3 (outside food radius 2)', () => {
            service.addHuman('h1', 8, 8);
            makeActive(8, 5, 'Water');
            makeActive(8, 5, 'Meadow');   // same cell as water is fine for this test;
            // Meadow at distance 3 should not satisfy food radius 2
            makeActive(8, 11, 'Meadow'); // distance 3 — outside food radius

            // Override: remove any Meadow within radius 2
            // All default cells are Veiled/Meadow but state is Veiled → not Active → don't count
            service.update();

            // No Active Meadow or Fertile Plain within radius 2 except the water cell if its terrain is Meadow
            // In this test the water cell at (8,5) has terrain 'Meadow'? No: makeActive sets terrain too.
            // Let me clarify: (8,5) has been set twice: first Water, then Meadow. Last wins → Meadow.
            // That Meadow at (8,5) is at distance |8-8|=0, |5-8|=3 → Chebyshev = 3 → outside food radius 2.
            // So no food within radius 2 → Dormant.
            expect(service.getHumans()[0].status).toBe('Dormant');
        });
    });

    describe('update - event emission', () => {
        it('should emit humanStatusChanged with status Dormant when Active human loses resources', () => {
            service.addHuman('h1', 8, 8);
            // No resources: first update transitions Active → Dormant

            const events: HumanStatusChangedPayload[] = [];
            service.on('humanStatusChanged', (p: HumanStatusChangedPayload) => events.push(p));

            service.update();

            expect(events.length).toBe(1);
            expect(events[0]).toEqual({ id: 'h1', x: 8, y: 8, status: 'Dormant' });
        });

        it('should emit humanStatusChanged with status Active when Dormant human gains resources', () => {
            service.addHuman('h1', 8, 8);
            service.update(); // → Dormant (no resources)

            makeActive(8, 5, 'Water');
            makeActive(8, 6, 'Meadow');

            const events: HumanStatusChangedPayload[] = [];
            service.on('humanStatusChanged', (p: HumanStatusChangedPayload) => events.push(p));

            service.update(); // → Active

            expect(events.length).toBe(1);
            expect(events[0]).toEqual({ id: 'h1', x: 8, y: 8, status: 'Active' });
        });

        it('should not emit event when status does not change between pulses', () => {
            service.addHuman('h1', 8, 8);
            makeActive(8, 5, 'Water');
            makeActive(8, 6, 'Meadow');
            service.update(); // → still Active (no transition from initial Active)

            const events: HumanStatusChangedPayload[] = [];
            service.on('humanStatusChanged', (p: HumanStatusChangedPayload) => events.push(p));

            service.update(); // still Active — no event

            expect(events.length).toBe(0);
        });

        it('should not emit event for a Dormant human that remains Dormant', () => {
            service.addHuman('h1', 8, 8);
            service.update(); // Active → Dormant (event emitted)

            const events: HumanStatusChangedPayload[] = [];
            service.on('humanStatusChanged', (p: HumanStatusChangedPayload) => events.push(p));

            service.update(); // still Dormant — no event

            expect(events.length).toBe(0);
        });

        it('should include correct payload fields in the emitted event', () => {
            service.addHuman('h_test', 3, 7);

            const events: HumanStatusChangedPayload[] = [];
            service.on('humanStatusChanged', (p: HumanStatusChangedPayload) => events.push(p));

            service.update();

            expect(events[0].id).toBe('h_test');
            expect(events[0].x).toBe(3);
            expect(events[0].y).toBe(7);
            expect(events[0].status).toBe('Dormant');
        });
    });

    describe('toJSON / fromJSON', () => {
        it('should serialise and restore status field', () => {
            service.addHuman('h1', 5, 5);
            service.update(); // → Dormant

            const data = service.toJSON();
            const restored = HumansService.fromJSON(data, grid)!;

            expect(restored.getHumans()[0].status).toBe('Dormant');
        });

        it('should default status to Active when loading legacy data without status field', () => {
            const legacyData = {
                humans: [{ id: 'old', x: 1, y: 1, state: 'idle' as const }],
            };

            const restored = HumansService.fromJSON(legacyData as any, grid)!;

            expect(restored.getHumans()[0].status).toBe('Active');
        });
    });
});
