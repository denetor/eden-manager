import { GameEngine } from './game-engine.service';
import { Grid } from './grid/grid.service';
import { SynergyEngine } from './synergy/synergy.service';
import { ManaService } from './mana/mana.service';
import { HumansService } from './humans/humans.service';
import { CreaturesService } from './creatures/creatures.service';

describe('GameEngine', () => {
    let grid: Grid;
    let synergy: SynergyEngine;
    let mana: ManaService;
    let humans: HumansService;
    let creatures: CreaturesService;
    let engine: GameEngine;

    beforeEach(() => {
        grid = new Grid(16, 16);
        synergy = new SynergyEngine(grid);
        mana = new ManaService(50, 100, 10);
        humans = new HumansService(grid);
        creatures = new CreaturesService(grid);
        engine = new GameEngine(grid, synergy, mana, humans, creatures);
    });

    describe('Initialization', () => {
        it('should initialize with all required systems', () => {
            expect(engine.getGrid()).toBe(grid);
            expect(engine.getSynergy()).toBe(synergy);
            expect(engine.getMana()).toBe(mana);
            expect(engine.getHumans()).toBe(humans);
            expect(engine.getCreatures()).toBe(creatures);
        });

        it('should have correct initial mana state', () => {
            expect(engine.getMana().getCurrent()).toBe(50);
            expect(engine.getMana().getMax()).toBe(100);
        });
    });

    describe('Mana System Integration', () => {
        it('should track current and max mana', () => {
            expect(mana.getCurrent()).toBe(50);
            expect(mana.getMax()).toBe(100);
        });

        it('should check if enough mana available', () => {
            expect(mana.hasEnough(30)).toBe(true);
            expect(mana.hasEnough(50)).toBe(true);
            expect(mana.hasEnough(51)).toBe(false);
        });

        it('should spend mana and return success/failure', () => {
            expect(mana.spend(20)).toBe(true);
            expect(mana.getCurrent()).toBe(30);
            expect(mana.spend(31)).toBe(false);
            expect(mana.getCurrent()).toBe(30);
        });

        it('should regenerate mana per pulse', () => {
            mana.spend(20);
            expect(mana.getCurrent()).toBe(30);
            mana.regenerate();
            expect(mana.getCurrent()).toBe(40);
        });

        it('should cap mana at maximum during regeneration', () => {
            // Start with max-5
            const manaWithHighStart = new ManaService(95, 100, 10);
            manaWithHighStart.regenerate();
            expect(manaWithHighStart.getCurrent()).toBe(100);
        });
    });

    describe('Humans System Integration', () => {
        it('should add humans to the world', () => {
            humans.addHuman('h1', 5, 5);
            expect(humans.getCount()).toBe(1);
        });

        it('should get all humans', () => {
            humans.addHuman('h1', 5, 5);
            humans.addHuman('h2', 8, 8);
            const allHumans = humans.getHumans();
            expect(allHumans).toHaveLength(2);
            expect(allHumans[0].id).toBe('h1');
            expect(allHumans[1].id).toBe('h2');
        });

        it('should update humans (placeholder in v0.1)', () => {
            humans.addHuman('h1', 5, 5);
            expect(() => humans.update()).not.toThrow();
        });

        it('should get humans state snapshot', () => {
            humans.addHuman('h1', 5, 5);
            const state = humans.getState();
            expect(state.totalCount).toBe(1);
            expect(state.population).toHaveLength(1);
        });
    });

    describe('Creatures System Integration', () => {
        it('should spawn creatures in the world', () => {
            creatures.spawnCreature('c1', 'Phoenix', 5, 5, 100);
            expect(creatures.getCount()).toBe(1);
        });

        it('should get all creatures', () => {
            creatures.spawnCreature('c1', 'Phoenix', 5, 5);
            creatures.spawnCreature('c2', 'Dragon', 10, 10);
            const allCreatures = creatures.getCreatures();
            expect(allCreatures).toHaveLength(2);
            expect(allCreatures[0].name).toBe('Phoenix');
            expect(allCreatures[1].name).toBe('Dragon');
        });

        it('should update creatures (placeholder in v0.1)', () => {
            creatures.spawnCreature('c1', 'Phoenix', 5, 5);
            expect(() => creatures.update()).not.toThrow();
        });

        it('should get creatures state snapshot', () => {
            creatures.spawnCreature('c1', 'Phoenix', 5, 5);
            const state = creatures.getState();
            expect(state.count).toBe(1);
            expect(state.creatures).toHaveLength(1);
        });
    });

    describe('reshape() mutation method', () => {
        it('should reshape cell with sufficient mana', () => {
            const result = engine.reshape(5, 5, 'Forest', 10);
            expect(result).toBe(true);
            expect(grid.getCell(5, 5)?.terrainType).toBe('Forest');
            expect(mana.getCurrent()).toBe(40);
        });

        it('should not reshape cell with insufficient mana', () => {
            const result = engine.reshape(5, 5, 'Forest', 51);
            expect(result).toBe(false);
            expect(grid.getCell(5, 5)?.terrainType).toBe('Meadow');
            expect(mana.getCurrent()).toBe(50);
        });

        it('should not reshape out-of-bounds cell', () => {
            const result = engine.reshape(-1, 5, 'Forest', 10);
            expect(result).toBe(false);
            expect(mana.getCurrent()).toBe(50);
        });

        it('should mark cell dirty after reshape', () => {
            engine.reshape(5, 5, 'Forest', 10);
            const dirtyCells = grid.getDirtyCells();
            expect(dirtyCells.some((d) => d.x === 5 && d.y === 5)).toBe(true);
        });

        it('should handle zero mana cost', () => {
            const result = engine.reshape(5, 5, 'Forest', 0);
            expect(result).toBe(true);
            expect(grid.getCell(5, 5)?.terrainType).toBe('Forest');
            expect(mana.getCurrent()).toBe(50);
        });

        it('should handle exact mana amount', () => {
            const result = engine.reshape(5, 5, 'Forest', 50);
            expect(result).toBe(true);
            expect(mana.getCurrent()).toBe(0);
        });
    });

    describe('unveil() mutation method', () => {
        it('should unveil cell with sufficient mana', () => {
            // Cells start Veiled by default
            const result = engine.unveil(5, 5, 10);
            expect(result).toBe(true);
            expect(grid.getCell(5, 5)?.state).toBe('Dormant');
            expect(mana.getCurrent()).toBe(40);
        });

        it('should not unveil non-Veiled cell', () => {
            grid.unveil(5, 5); // Unveil manually first
            const result = engine.unveil(5, 5, 10);
            expect(result).toBe(false);
            expect(grid.getCell(5, 5)?.state).toBe('Dormant');
            expect(mana.getCurrent()).toBe(50);
        });

        it('should not unveil with insufficient mana', () => {
            const result = engine.unveil(5, 5, 51);
            expect(result).toBe(false);
            expect(grid.getCell(5, 5)?.state).toBe('Veiled');
            expect(mana.getCurrent()).toBe(50);
        });

        it('should not unveil out-of-bounds cell', () => {
            const result = engine.unveil(16, 5, 10);
            expect(result).toBe(false);
            expect(mana.getCurrent()).toBe(50);
        });

        it('should mark cell dirty after unveil', () => {
            engine.unveil(5, 5, 10);
            const dirtyCells = grid.getDirtyCells();
            expect(dirtyCells.some((d) => d.x === 5 && d.y === 5)).toBe(true);
        });
    });

    describe('awaken() mutation method', () => {
        it('should awaken cell with sufficient mana', () => {
            // Manually get cell to Dormant state first
            grid.unveil(5, 5);
            grid.clearDirty();

            const result = engine.awaken(5, 5, 10);
            expect(result).toBe(true);
            expect(grid.getCell(5, 5)?.state).toBe('Active');
            expect(mana.getCurrent()).toBe(40);
        });

        it('should not awaken Veiled cell', () => {
            const result = engine.awaken(5, 5, 10);
            expect(result).toBe(false);
            expect(grid.getCell(5, 5)?.state).toBe('Veiled');
            expect(mana.getCurrent()).toBe(50);
        });

        it('should not awaken with insufficient mana', () => {
            grid.unveil(5, 5);
            grid.clearDirty();
            const result = engine.awaken(5, 5, 51);
            expect(result).toBe(false);
            expect(grid.getCell(5, 5)?.state).toBe('Dormant');
            expect(mana.getCurrent()).toBe(50);
        });

        it('should not awaken out-of-bounds cell', () => {
            const result = engine.awaken(16, 5, 10);
            expect(result).toBe(false);
            expect(mana.getCurrent()).toBe(50);
        });

        it('should mark cell dirty after awaken', () => {
            grid.unveil(5, 5);
            grid.clearDirty();
            engine.awaken(5, 5, 10);
            const dirtyCells = grid.getDirtyCells();
            expect(dirtyCells.some((d) => d.x === 5 && d.y === 5)).toBe(true);
        });
    });

    describe('divinePulse() orchestration', () => {
        it('should execute pulse sequence: Synergy → Humans → Creatures → Mana → clearDirty', () => {
            // Set up: Create state for testing sequence
            const callSequence: string[] = [];

            // Spy on methods to verify call order
            const originalSynergyApply = synergy.apply.bind(synergy);
            const originalHumansUpdate = humans.update.bind(humans);
            const originalCreaturesUpdate = creatures.update.bind(creatures);
            const originalManaRegenerate = mana.regenerate.bind(mana);

            synergy.apply = jest.fn(() => {
                callSequence.push('synergy');
                originalSynergyApply();
            });
            humans.update = jest.fn(() => {
                callSequence.push('humans');
                originalHumansUpdate();
            });
            creatures.update = jest.fn(() => {
                callSequence.push('creatures');
                originalCreaturesUpdate();
            });
            mana.regenerate = jest.fn(() => {
                callSequence.push('mana');
                originalManaRegenerate();
            });

            // Mark dirty cells to verify clearDirty is called
            engine.reshape(5, 5, 'Forest', 10);
            expect(grid.getDirtyCells().length).toBeGreaterThan(0);

            // Execute pulse
            engine.divinePulse();

            // Verify call sequence
            expect(callSequence).toEqual(['synergy', 'humans', 'creatures', 'mana']);
            expect(synergy.apply).toHaveBeenCalledTimes(1);
            expect(humans.update).toHaveBeenCalledTimes(1);
            expect(creatures.update).toHaveBeenCalledTimes(1);
            expect(mana.regenerate).toHaveBeenCalledTimes(1);

            // Verify dirty flags were cleared
            expect(grid.getDirtyCells()).toHaveLength(0);
        });

        it('should regenerate mana during pulse', () => {
            mana.spend(20);
            expect(mana.getCurrent()).toBe(30);

            engine.divinePulse();

            expect(mana.getCurrent()).toBe(40);
        });

        it('should clear dirty cells at end of pulse', () => {
            engine.reshape(5, 5, 'Forest', 10);
            expect(grid.getDirtyCells().length).toBeGreaterThan(0);

            engine.divinePulse();

            expect(grid.getDirtyCells()).toHaveLength(0);
        });
    });

    describe('Integration: Full turn sequence', () => {
        it('should complete reshape → divinePulse → synergy applies → dirty cleared', () => {
            // Set up: Grid with synergy trigger
            grid.reshape(8, 8, 'Water');
            grid.reshape(8, 9, 'Meadow');
            grid.clearDirty();

            // Player action: reshape via GameEngine
            const success = engine.reshape(8, 8, 'Water', 20);
            expect(success).toBe(true);

            // Verify Water+Meadow synergy rule will apply
            expect(grid.getCell(8, 9)?.terrainType).toBe('Meadow');

            // Execute Divine Pulse
            engine.divinePulse();

            // Verify synergy was applied
            expect(grid.getCell(8, 9)?.terrainType).toBe('Fertile Plain');

            // Verify dirty was cleared
            expect(grid.getDirtyCells()).toHaveLength(0);
        });

        it('should handle multiple mutations in single turn', () => {
            const r1 = engine.reshape(5, 5, 'Forest', 10);
            const r2 = engine.reshape(6, 5, 'Forest', 10);
            const r3 = engine.reshape(7, 5, 'Forest', 10);

            expect(r1).toBe(true);
            expect(r2).toBe(true);
            expect(r3).toBe(true);
            expect(mana.getCurrent()).toBe(20);

            // Both cells are dirty
            expect(grid.getDirtyCells().length).toBe(3);

            // Pulse clears them
            engine.divinePulse();
            expect(grid.getDirtyCells()).toHaveLength(0);
        });

        it('should chain multiple pulses for synergy cascades', () => {
            // Pulse 1: Create Water + Meadow adjacent
            engine.reshape(5, 5, 'Water', 10);
            engine.reshape(5, 6, 'Meadow', 10);
            engine.divinePulse();

            // Meadow should now be Fertile Plain
            expect(grid.getCell(5, 6)?.terrainType).toBe('Fertile Plain');

            // Pulse 2: No new changes
            engine.divinePulse();
            expect(grid.getDirtyCells()).toHaveLength(0);
        });

        it('should prevent mutations with insufficient mana in single turn', () => {
            const costs = [40, 15, 10]; // Total 65, but only 50 available
            const results: boolean[] = [];

            results.push(engine.reshape(5, 5, 'Forest', costs[0])); // Success
            results.push(engine.reshape(6, 5, 'Forest', costs[1])); // Success
            results.push(engine.reshape(7, 5, 'Forest', costs[2])); // Fail (only 0 left)

            expect(results).toEqual([true, true, false]);
            expect(mana.getCurrent()).toBe(0);
        });
    });

    describe('State consistency', () => {
        it('should maintain consistent state after failed mutation', () => {
            const initialMana = mana.getCurrent();
            const initialTerrain = grid.getCell(5, 5)?.terrainType;

            engine.reshape(5, 5, 'Forest', 51); // Should fail

            expect(mana.getCurrent()).toBe(initialMana);
            expect(grid.getCell(5, 5)?.terrainType).toBe(initialTerrain);
        });

        it('should maintain mana balance across operations', () => {
            engine.reshape(5, 5, 'Forest', 20);
            expect(mana.getCurrent()).toBe(30);

            engine.divinePulse();
            expect(mana.getCurrent()).toBe(40);

            engine.reshape(6, 6, 'Mountain', 15);
            expect(mana.getCurrent()).toBe(25);

            engine.divinePulse();
            expect(mana.getCurrent()).toBe(35);
        });
    });

    describe('Edge cases', () => {
        it('should handle pulse with no mutations', () => {
            expect(grid.getDirtyCells()).toHaveLength(0);
            expect(() => engine.divinePulse()).not.toThrow();
            expect(mana.getCurrent()).toBe(60); // Regenerated
        });

        it('should handle pulse with only synergy effects', () => {
            // Set up Forest cluster
            grid.reshape(5, 5, 'Forest');
            grid.reshape(4, 5, 'Forest');
            grid.reshape(5, 4, 'Forest');
            grid.reshape(6, 5, 'Forest');

            engine.divinePulse();

            // Forest at (5,5) should become Sacred Grove
            expect(grid.getCell(5, 5)?.terrainType).toBe('Sacred Grove');
        });

        it('should recover from boundary conditions', () => {
            // Try to reshape corner
            expect(engine.reshape(0, 0, 'Forest', 10)).toBe(true);
            expect(engine.reshape(15, 15, 'Mountain', 10)).toBe(true);
            expect(mana.getCurrent()).toBe(30);
        });
    });

    describe('Terrain mana generation', () => {
        it('should yield +1 mana for Active Fertile Plain each pulse', () => {
            grid.unveil(3, 3);
            grid.awaken(3, 3);
            grid.reshape(3, 3, 'Fertile Plain');
            mana.spend(50);

            engine.divinePulse();

            expect(mana.getCurrent()).toBe(11); // 0 + 1 terrain + 10 regen
        });

        it('should yield +2 mana for Active Sacred Grove each pulse', () => {
            grid.unveil(3, 3);
            grid.awaken(3, 3);
            grid.reshape(3, 3, 'Sacred Grove');
            mana.spend(50);

            engine.divinePulse();

            expect(mana.getCurrent()).toBe(12); // 0 + 2 terrain + 10 regen
        });

        it('should yield +2 mana for Active Hidden Temple each pulse', () => {
            grid.unveil(3, 3);
            grid.awaken(3, 3);
            grid.reshape(3, 3, 'Hidden Temple');
            mana.spend(50);

            engine.divinePulse();

            expect(mana.getCurrent()).toBe(12); // 0 + 2 terrain + 10 regen
        });

        it('should not yield mana for Dormant mana terrain', () => {
            grid.unveil(3, 3);
            grid.reshape(3, 3, 'Sacred Grove');
            mana.spend(50);

            engine.divinePulse();

            expect(mana.getCurrent()).toBe(10); // 0 + 0 terrain + 10 regen
        });

        it('should not yield mana for Veiled mana terrain', () => {
            grid.reshape(3, 3, 'Fertile Plain');
            mana.spend(50);

            engine.divinePulse();

            expect(mana.getCurrent()).toBe(10); // 0 + 0 terrain + 10 regen
        });

        it('should not yield mana for Active non-mana terrain', () => {
            grid.unveil(3, 3);
            grid.awaken(3, 3);
            grid.reshape(3, 3, 'Forest');
            mana.spend(50);

            engine.divinePulse();

            expect(mana.getCurrent()).toBe(10); // 0 + 0 terrain + 10 regen
        });

        it('should sum mana from multiple active mana-yielding cells', () => {
            grid.unveil(0, 0); grid.awaken(0, 0); grid.reshape(0, 0, 'Fertile Plain');
            grid.unveil(1, 0); grid.awaken(1, 0); grid.reshape(1, 0, 'Fertile Plain');
            grid.unveil(2, 0); grid.awaken(2, 0); grid.reshape(2, 0, 'Sacred Grove');
            mana.spend(50);

            engine.divinePulse();

            expect(mana.getCurrent()).toBe(14); // 0 + 1 + 1 + 2 terrain + 10 regen
        });

        it('should cap mana at max when terrain yield would overflow', () => {
            const highMana = new ManaService(95, 100, 10);
            const highGrid = new Grid(16, 16);
            const highEngine = new GameEngine(
                highGrid,
                new SynergyEngine(highGrid),
                highMana,
                new HumansService(highGrid),
                new CreaturesService(highGrid)
            );
            highGrid.unveil(0, 0);
            highGrid.awaken(0, 0);
            highGrid.reshape(0, 0, 'Sacred Grove'); // +2 terrain + 10 regen = +12, capped at 100

            highEngine.divinePulse();

            expect(highMana.getCurrent()).toBe(100);
        });
    });

    describe('Cooldown mechanics', () => {
        it('should allow reshape when no cooldown is active', () => {
            const result = engine.reshape(5, 5, 'Forest', 10);
            expect(result).toBe(true);
            expect(engine.canReshape(5, 5)).toBe(false); // Cooldown now active
        });

        it('should block reshape while cooldown is active', () => {
            engine.reshape(5, 5, 'Forest', 10);
            expect(mana.getCurrent()).toBe(40);

            const result = engine.reshape(5, 5, 'Mountain', 10); // Immediate second reshape
            expect(result).toBe(false);
            expect(grid.getCell(5, 5)?.terrainType).toBe('Forest'); // Cell unchanged
            expect(mana.getCurrent()).toBe(40); // Mana unchanged
        });

        it('should allow reshape after cooldown expires', (done) => {
            engine.reshape(5, 5, 'Forest', 10);
            expect(engine.canReshape(5, 5)).toBe(false);

            // Wait 200ms for cooldown to expire
            setTimeout(() => {
                expect(engine.canReshape(5, 5)).toBe(true);
                const result = engine.reshape(5, 5, 'Mountain', 10);
                expect(result).toBe(true);
                expect(grid.getCell(5, 5)?.terrainType).toBe('Mountain');
                done();
            }, 200);
        });

        it('should track independent cooldowns per cell', () => {
            engine.reshape(5, 5, 'Forest', 10);
            engine.reshape(6, 6, 'Mountain', 10);

            expect(engine.canReshape(5, 5)).toBe(false);
            expect(engine.canReshape(6, 6)).toBe(false);

            // Both should be on cooldown (same time)
            expect(engine.reshape(5, 5, 'Mountain', 10)).toBe(false);
            expect(engine.reshape(6, 6, 'Forest', 10)).toBe(false);
        });

        it('should not reset cooldown on failed reshape (bounds check)', () => {
            engine.reshape(5, 5, 'Forest', 10);
            engine.reshape(-1, 5, 'Forest', 10); // Out of bounds

            // Cooldown should still be active for (5,5)
            expect(engine.canReshape(5, 5)).toBe(false);
        });

        it('should not reset cooldown on failed reshape (insufficient mana)', () => {
            engine.reshape(5, 5, 'Forest', 10);
            engine.reshape(5, 5, 'Mountain', 41); // Insufficient mana

            // Cooldown should still be active (from first reshape)
            expect(engine.canReshape(5, 5)).toBe(false);
        });

        it('should reset cooldown timer on successful reshape', (done) => {
            engine.reshape(5, 5, 'Forest', 10);
            const firstTime = Date.now();

            setTimeout(() => {
                // After 100ms, cooldown is still active
                expect(engine.canReshape(5, 5)).toBe(false);

                setTimeout(() => {
                    // After another 100ms (200ms total from first reshape), cooldown should expire
                    expect(engine.canReshape(5, 5)).toBe(true);
                    engine.reshape(5, 5, 'Mountain', 10); // Reset timer
                    const secondTime = Date.now();

                    // Cooldown should be re-active from second reshape
                    expect(engine.canReshape(5, 5)).toBe(false);
                    expect(secondTime - firstTime).toBeGreaterThanOrEqual(200);

                    done();
                }, 105); // Total ~205ms
            }, 100);
        });

        it('should handle stress test with rapid clicks on same cell', (done) => {
            let successCount = 0;

            // Simulate rapid clicks over 500ms
            for (let i = 0; i < 10; i++) {
                setTimeout(() => {
                    const result = engine.reshape(5, 5, 'Forest', 1);
                    if (result) successCount++;
                }, i * 50); // Click every 50ms
            }

            setTimeout(() => {
                // With 200ms cooldown and 50ms clicks, expect ~2-3 successful reshapes
                // (first one succeeds immediately, then ~1 more every 200ms)
                expect(successCount).toBeLessThanOrEqual(4);
                expect(successCount).toBeGreaterThan(0);
                done();
            }, 550);
        });

        it('should handle cooldown for unveil and awaken independently', () => {
            // Note: Current implementation only tracks reshape cooldown
            // This test verifies that unveil/awaken don't affect reshape cooldown
            engine.reshape(5, 5, 'Forest', 10);
            expect(engine.canReshape(5, 5)).toBe(false);

            // unveil and awaken are separate operations (may have their own cooldowns in future)
            const unveilResult = engine.unveil(7, 7, 10); // Different cell
            expect(unveilResult).toBe(true);

            // reshape cooldown on (5,5) should be unaffected
            expect(engine.canReshape(5, 5)).toBe(false);
        });

        it('should allow reshape on different cell during cooldown', () => {
            engine.reshape(5, 5, 'Forest', 10);
            expect(engine.canReshape(5, 5)).toBe(false);

            // Different cell should not be on cooldown
            expect(engine.canReshape(6, 6)).toBe(true);
            const result = engine.reshape(6, 6, 'Mountain', 10);
            expect(result).toBe(true);
            expect(grid.getCell(6, 6)?.terrainType).toBe('Mountain');
        });

        it('should maintain state consistency during rapid clicks with mana checks', () => {
            const initialMana = mana.getCurrent();
            let successCount = 0;

            // Simulate 5 rapid clicks on same cell (all should fail after first due to cooldown)
            for (let i = 0; i < 5; i++) {
                const result = engine.reshape(5, 5, 'Forest', 10);
                if (result) successCount++;
            }

            // Only first reshape should succeed
            expect(successCount).toBe(1);
            expect(mana.getCurrent()).toBe(initialMana - 10);
            expect(grid.getCell(5, 5)?.terrainType).toBe('Forest');
        });
    });
});