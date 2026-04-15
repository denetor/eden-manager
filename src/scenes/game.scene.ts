import {
    Scene,
    Engine,
    Actor,
    Vector,
    Keys,
} from 'excalibur';
import { Grid } from '../core/grid/grid.service';
import { GameEngine } from '../core/game-engine.service';
import { SynergyEngine } from '../core/synergy/synergy.service';
import { ManaService } from '../core/mana/mana.service';
import { HumansService } from '../core/humans/humans.service';
import { CreaturesService } from '../core/creatures/creatures.service';
import { PersistenceService } from '../persistence/persistence.service';
import { ManaDisplay } from '../ui/hud/mana-display';
import { CellInfo } from '../ui/hud/cell-info';

/**
 * GameScene orchestrates the complete game experience:
 * - Initializes game systems (Grid, GameEngine)
 * - Manages input (mouse clicks, keyboard shortcuts)
 * - Displays HUD (Mana, Cell Info)
 * - Persists game state (auto-save, load on init)
 * - Handles polish (feedback messages)
 */
export class GameScene extends Scene {
    private gameEngine!: GameEngine;
    private persistenceService: PersistenceService;
    private manaDisplay!: ManaDisplay;
    private cellInfo!: CellInfo;
    private selectedX: number = 0;
    private selectedY: number = 0;
    private lastPulseTime: number = 0;
    private pulseInterval: number = 500; // ms between pulses
    private feedbackMessage: string = '';
    private feedbackEndTime: number = 0;
    private tileSize: number = 32;

    constructor() {
        super();
        this.persistenceService = new PersistenceService();
    }

    override onInitialize(engine: Engine): void {
        // 1. Load or create game state
        let grid = this.persistenceService.loadGrid();
        if (!grid) {
            grid = new Grid(16, 16);
        }

        // 2. Initialize all game systems
        const synergy = new SynergyEngine(grid);
        const mana = new ManaService(50, 100, 10);
        const humans = new HumansService();
        const creatures = new CreaturesService();
        this.gameEngine = new GameEngine(grid, synergy, mana, humans, creatures);

        // 3. Create background grid visualization
        const background = new Actor({
            x: 0,
            y: 0,
            width: grid.getWidth() * this.tileSize,
            height: grid.getHeight() * this.tileSize,
        });
        this.add(background);

        // 4. Create HUD displays
        this.manaDisplay = new ManaDisplay(mana, engine);
        this.add(this.manaDisplay);

        this.cellInfo = new CellInfo(grid, engine);
        this.add(this.cellInfo);

        // 5. Subscribe to input events
        this.setupInputHandling(engine);
    }

    override onPreUpdate(engine: Engine, elapsedMs: number): void {
        // Update feedback message display
        if (this.feedbackMessage && Date.now() > this.feedbackEndTime) {
            this.feedbackMessage = '';
        }

        // Handle continuous pulse triggering
        this.lastPulseTime += elapsedMs;
        if (this.lastPulseTime >= this.pulseInterval) {
            this.triggerDivinePulse();
            this.lastPulseTime = 0;
        }
    }

    override onPostDraw(ctx: any, elapsedMs: number): void {
        // Draw grid background
        this.drawGridBackground(ctx);

        // Draw feedback message if active
        if (this.feedbackMessage) {
            this.drawFeedbackMessage(ctx);
        }
    }

    /**
     * Draw a simple grid background with cells colored by state.
     */
    private drawGridBackground(ctx: CanvasRenderingContext2D): void {
        const grid = this.gameEngine.getGrid();
        const width = grid.getWidth();
        const height = grid.getHeight();

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const cell = grid.getCell(x, y)!;
                const screenX = x * this.tileSize;
                const screenY = y * this.tileSize;

                // Color based on terrain
                let color = '#90EE90'; // Green for meadow (default)
                if (cell.terrainType === 'Forest') {
                    color = '#228B22';
                } else if (cell.terrainType === 'Water') {
                    color = '#1E90FF';
                } else if (cell.terrainType === 'Mountain') {
                    color = '#A9A9A9';
                }

                // Darken if veiled
                if (cell.state === 'Veiled') {
                    color = '#808080';
                }

                ctx.fillStyle = color;
                ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Draw grid lines
                ctx.strokeStyle = '#333333';
                ctx.lineWidth = 1;
                ctx.strokeRect(screenX, screenY, this.tileSize, this.tileSize);

                // Highlight selected cell
                if (x === this.selectedX && y === this.selectedY) {
                    ctx.strokeStyle = '#FFFF00';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(screenX, screenY, this.tileSize, this.tileSize);
                }
            }
        }
    }

    /**
     * Setup input handling for mouse clicks and keyboard shortcuts.
     */
    private setupInputHandling(engine: Engine): void {
        engine.input.pointers.primary.on('down', (evt: any) => {
            const gridPos = this.screenToGridCoordinates(evt.x, evt.y);
            if (gridPos) {
                this.selectedX = gridPos.x;
                this.selectedY = gridPos.y;
                this.cellInfo.setSelectedCell(this.selectedX, this.selectedY);
                this.attemptReshape(this.selectedX, this.selectedY, 'Forest');
            }
        });

        // Keyboard shortcuts
        engine.input.keyboard.on('press', (evt: any) => {
            if (evt.key === Keys.R) {
                this.attemptReshape(this.selectedX, this.selectedY, 'Forest');
            } else if (evt.key === Keys.W) {
                this.attemptReshape(this.selectedX, this.selectedY, 'Water');
            } else if (evt.key === Keys.M) {
                this.attemptReshape(this.selectedX, this.selectedY, 'Mountain');
            } else if (evt.key === Keys.Enter) {
                this.triggerDivinePulse();
            } else if (evt.key === Keys.Tab) {
                // Tab to next cell
                this.selectedX = (this.selectedX + 1) % this.gameEngine.getGrid().getWidth();
                this.cellInfo.setSelectedCell(this.selectedX, this.selectedY);
            }
        });
    }

    /**
     * Convert screen coordinates to grid coordinates (accounting for tile size).
     */
    private screenToGridCoordinates(screenX: number, screenY: number): { x: number; y: number } | null {
        const gridX = Math.floor(screenX / this.tileSize);
        const gridY = Math.floor(screenY / this.tileSize);

        const grid = this.gameEngine.getGrid();
        if (gridX >= 0 && gridX < grid.getWidth() && gridY >= 0 && gridY < grid.getHeight()) {
            return { x: gridX, y: gridY };
        }
        return null;
    }

    /**
     * Attempt to reshape a cell with feedback.
     */
    private attemptReshape(x: number, y: number, terrainType: string): void {
        const mana = this.gameEngine.getMana();
        const manaCost = 10; // Base cost per reshape

        // Check cooldown
        if (!this.gameEngine.canReshape(x, y)) {
            this.showFeedback('Cooling...');
            return;
        }

        // Check mana
        if (!mana.hasEnough(manaCost)) {
            this.showFeedback('Insufficient mana');
            return;
        }

        // Attempt reshape
        const success = this.gameEngine.reshape(x, y, terrainType as any, manaCost);
        if (success) {
            this.showFeedback(`Reshaped to ${terrainType}`);
            this.cellInfo.setSelectedCell(x, y);
        }
    }

    /**
     * Trigger a Divine Pulse turn.
     */
    private triggerDivinePulse(): void {
        this.gameEngine.divinePulse();
        this.persistenceService.saveGrid(this.gameEngine.getGrid());
    }

    /**
     * Show a temporary feedback message.
     */
    private showFeedback(message: string, duration: number = 1000): void {
        this.feedbackMessage = message;
        this.feedbackEndTime = Date.now() + duration;
    }

    /**
     * Draw feedback message on screen.
     */
    private drawFeedbackMessage(ctx: any): void {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(50, 30, 300, 40);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(this.feedbackMessage, 70, 60);
    }
}