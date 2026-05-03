import { Grid } from './grid/grid.service';
import { TerrainType } from './grid/grid.model';
import { SynergyEngine } from './synergy/synergy.service';
import { BuildingSynergyService } from './synergy/building-synergy.service';
import { BUILDING_MANA_YIELD } from './synergy/building-synergy.model';
import { ManaService } from './mana/mana.service';
import { HumansService } from './humans/humans.service';
import { CreaturesService } from './creatures/creatures.service';

const TERRAIN_MANA_YIELD: Record<TerrainType, number> = {
    'Fertile Plain': 1,
    'Sacred Grove':  2,
    'Hidden Temple': 2,
    'Meadow':        0,
    'Forest':        0,
    'Mountain':      0,
    'Water':         0,
    'Ruins':         0,
    'Foothill':      0,
};

/**
 * GameEngine orchestrates all game systems and coordinates the Divine Pulse turn sequence.
 * Responsible for:
 * - High-level mutation methods with mana cost checking
 * - Turn orchestration via divinePulse()
 * - System lifecycle management
 */
export class GameEngine {
    private grid: Grid;
    private synergy: SynergyEngine;
    private buildingSynergy: BuildingSynergyService;
    private mana: ManaService;
    private humans: HumansService;
    private creatures: CreaturesService;
    private reshapeLastTime: Map<string, number> = new Map();
    private readonly RESHAPE_COOLDOWN_MS = 200;

    constructor(
        grid: Grid,
        synergy: SynergyEngine,
        buildingSynergy: BuildingSynergyService,
        mana: ManaService,
        humans: HumansService,
        creatures: CreaturesService
    ) {
        this.grid = grid;
        this.synergy = synergy;
        this.buildingSynergy = buildingSynergy;
        this.mana = mana;
        this.humans = humans;
        this.creatures = creatures;
    }

    /**
     * Execute one full Divine Pulse turn sequence:
     * 1. Apply synergies to dirty cells
     * 2. Update humans based on grid changes
     * 3. Update creatures based on grid changes
     * 4. Collect mana from active terrain cells
     * 5. Regenerate mana
     * 6. Clear dirty flags for next pulse
     */
    divinePulse(): void {
        this.synergy.apply();
        this.buildingSynergy.apply();
        this.humans.update();
        const creatureManaBonus = this.creatures.update();
        if (creatureManaBonus > 0) {
            this.mana.add(creatureManaBonus);
        }
        this.collectTerrainMana();
        this.collectBuildingsMana();
        this.mana.regenerate();
        this.grid.clearDirty();
    }

    private collectTerrainMana(): void {
        let total = 0;
        for (const cell of this.grid.getAllCells()) {
            if (cell.state === 'Active') {
                total += TERRAIN_MANA_YIELD[cell.terrainType];
            }
        }
        if (total > 0) {
            this.mana.add(total);
        }
    }

    private collectBuildingsMana(): void {
        const humans = this.humans.getHumans();
        let total = 0;
        for (const cell of this.grid.getAllCells()) {
            if (cell.state !== 'Active' || !cell.building) continue;
            const hasActiveHuman = humans.some(h => h.x === cell.x && h.y === cell.y && h.status === 'Active');
            if (hasActiveHuman) {
                total += BUILDING_MANA_YIELD[cell.building];
            }
        }
        if (total > 0) {
            this.mana.add(total);
        }
    }

    /**
     * Check if a cell can be reshaped (cooldown has expired).
     * Returns true if 200ms has passed since last reshape on that cell.
     */
    canReshape(x: number, y: number): boolean {
        const key = `${x},${y}`;
        const lastTime = this.reshapeLastTime.get(key);
        if (!lastTime) {
            return true;
        }
        return Date.now() - lastTime >= this.RESHAPE_COOLDOWN_MS;
    }

    /**
     * Reshape a cell's terrain at a mana cost.
     * Checks cooldown, mana sufficiency, deducts cost, calls grid.reshape().
     * Returns true if successful, false if on cooldown, insufficient mana, or out-of-bounds.
     */
    reshape(x: number, y: number, terrainType: TerrainType, manaCost: number): boolean {
        // Check cooldown
        if (!this.canReshape(x, y)) {
            return false;
        }

        // Check bounds
        if (x < 0 || x >= this.grid.getWidth() || y < 0 || y >= this.grid.getHeight()) {
            return false;
        }

        // Check mana
        if (!this.mana.hasEnough(manaCost)) {
            return false;
        }

        // Spend mana
        const spent = this.mana.spend(manaCost);
        if (!spent) {
            return false;
        }

        // Apply mutation (marks cell dirty) and reset cooldown
        this.grid.reshape(x, y, terrainType);
        const key = `${x},${y}`;
        this.reshapeLastTime.set(key, Date.now());
        return true;
    }

    /**
     * Unveil a cell's state from Veiled to Dormant at a mana cost.
     * Returns true if successful, false if insufficient mana, out-of-bounds, or not Veiled.
     */
    unveil(x: number, y: number, manaCost: number): boolean {
        // Check bounds
        if (x < 0 || x >= this.grid.getWidth() || y < 0 || y >= this.grid.getHeight()) {
            return false;
        }

        // Check if cell is Veiled before spending mana
        const cell = this.grid.getCell(x, y);
        if (!cell || cell.state !== 'Veiled') {
            return false;
        }

        // Check mana
        if (!this.mana.hasEnough(manaCost)) {
            return false;
        }

        // Spend mana
        const spent = this.mana.spend(manaCost);
        if (!spent) {
            return false;
        }

        // Apply mutation (marks cell dirty)
        this.grid.unveil(x, y);
        return true;
    }

    /**
     * Awaken a cell's state from Dormant to Active at a mana cost.
     * Returns true if successful, false if insufficient mana, out-of-bounds, or not Dormant.
     */
    awaken(x: number, y: number, manaCost: number): boolean {
        // Check bounds
        if (x < 0 || x >= this.grid.getWidth() || y < 0 || y >= this.grid.getHeight()) {
            return false;
        }

        // Check if cell is Dormant before spending mana
        const cell = this.grid.getCell(x, y);
        if (!cell || cell.state !== 'Dormant') {
            return false;
        }

        // Check mana
        if (!this.mana.hasEnough(manaCost)) {
            return false;
        }

        // Spend mana
        const spent = this.mana.spend(manaCost);
        if (!spent) {
            return false;
        }

        // Apply mutation (marks cell dirty)
        this.grid.awaken(x, y);
        return true;
    }

    /**
     * Spawn a human on an Active Meadow or Fertile Plain cell with no existing occupants.
     * Returns true if successful, false if the cell is invalid or mana is insufficient.
     */
    spawnHuman(x: number, y: number, manaCost: number): boolean {
        if (x < 0 || x >= this.grid.getWidth() || y < 0 || y >= this.grid.getHeight()) {
            return false;
        }

        const cell = this.grid.getCell(x, y);
        if (!cell || cell.state !== 'Active') return false;
        if (cell.terrainType !== 'Meadow' && cell.terrainType !== 'Fertile Plain') return false;

        const occupied = this.humans.getHumans().some(h => h.x === x && h.y === y)
            || this.creatures.getCreatures().some(c => c.x === x && c.y === y);
        if (occupied) return false;

        if (!this.mana.spend(manaCost)) return false;

        this.humans.addHuman(`human_${Date.now()}`, x, y);
        return true;
    }

    // Accessors for testing and external systems
    getGrid(): Grid {
        return this.grid;
    }

    getSynergy(): SynergyEngine {
        return this.synergy;
    }

    getMana(): ManaService {
        return this.mana;
    }

    getHumans(): HumansService {
        return this.humans;
    }

    getCreatures(): CreaturesService {
        return this.creatures;
    }
}