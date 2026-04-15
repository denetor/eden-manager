import {
    Scene,
    Engine,
    Keys,
    ExcaliburGraphicsContext,
    TileMap,
    Rectangle,
    Color, vec,
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
    private tileMap!: TileMap;
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
        const humans = new HumansService(grid);
        const creatures = new CreaturesService(grid);
        this.gameEngine = new GameEngine(grid, synergy, mana, humans, creatures);

        // 3. Create TileMap for rendering the grid
        this.initializeTileMap(grid);
        this.add(this.tileMap);

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

    override onPostDraw(ctx: ExcaliburGraphicsContext): void {
        // Draw grid background
        this.drawGridBackground(ctx);

        // Draw feedback message if active
        if (this.feedbackMessage) {
            this.drawFeedbackMessage(ctx);
        }
    }


    /**
     * Initialize TileMap from the Grid data.
     */
    private initializeTileMap(grid: Grid): void {
        const width = grid.getWidth();
        const height = grid.getHeight();

        // Create TileMap with dimensions matching the grid
        this.tileMap = new TileMap({
            rows: height,
            columns: width,
            tileWidth: this.tileSize,
            tileHeight: this.tileSize,
        });

        // Populate tiles with colored rectangles based on grid state
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const cell = grid.getCell(x, y)!;
                const tile = this.tileMap.getTile(x, y)!;

                let color: Color;
                // Darken if veiled
                if (cell.state === 'Veiled') {
                    color = new Color(128, 128, 128);
                } else {
                    switch (cell.terrainType) {
                        case 'Forest':
                            color = new Color(34, 139, 34);
                            break;
                        case 'Water':
                            color = new Color(30, 144, 255);
                            break;
                        case 'Mountain':
                            color = new Color(169, 169, 169);
                            break;
                        default:
                            color = new Color(144, 238, 144); // Green for meadow (default)
                    }
                }

                // Create a rectangle shape for the tile
                const rect = new Rectangle({
                    width: this.tileSize,
                    height: this.tileSize,
                    color: color,
                });

                // Add the rectangle as a graphic to the tile
                tile.addGraphic(rect);
            }
        }
    }


    /**
     * Setup input handling for mouse clicks and keyboard shortcuts.
     */
    private setupInputHandling(engine: Engine): void {
        engine.input.pointers.primary.on('down', (evt: any) => {
            const gridPos = this.screenToGridCoordinates(evt.coordinates.worldPos.x, evt.coordinates.worldPos.y);
            if (gridPos) {
                console.log({gridPos});
                this.selectCell(gridPos.x, gridPos.y);
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
            } else if (evt.key === Keys.Space) {
                this.attemptUnveil(this.selectedX, this.selectedY)
            } else if (evt.key === Keys.Enter) {
                this.triggerDivinePulse();
            } else if (evt.key === Keys.Tab) {
                // Tab to next cell
                this.selectedX = (this.selectedX + 1) % this.gameEngine.getGrid().getWidth();
                this.selectCell(this.selectedX, this.selectedY);
            }
        });
    }

    /**
     * Select a cell and update UI.
     */
    private selectCell(x: number, y: number): void {
        this.selectedX = x;
        this.selectedY = y;
        this.cellInfo.setSelectedCell(x, y);
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
            console.log('Cooling...');
            this.showFeedback('Cooling...');
            return;
        }

        // Check mana
        if (!mana.hasEnough(manaCost)) {
            console.log('Insufficient mana');
            this.showFeedback('Insufficient mana');
            return;
        }

        // Attempt reshape
        const success = this.gameEngine.reshape(x, y, terrainType as any, manaCost);
        if (success) {
            console.log(`Reshaped to ${terrainType}`);
            this.showFeedback(`Reshaped to ${terrainType}`);
            this.selectCell(x, y);
        }
    }


    /**
     * Attempts to unveil a cell at the specified coordinates. Calls necessary game logic
     * to determine if the cell can be unveiled based on mana availability. If successful,
     * selects the unveiled cell.
     *
     * @param {number} x - The x-coordinate of the cell to unveil.
     * @param {number} y - The y-coordinate of the cell to unveil.
     * @return {void} This method does not return a value.
     */
    private attemptUnveil(x: number, y: number): void {
        console.log(`attemptUnveil(${x}, ${y})`);
        const mana = this.gameEngine.getMana();
        const manaCost = 10; // Base cost per reshape

        // Check mana
        if (!mana.hasEnough(manaCost)) {
            console.log('Insufficient mana');
            this.showFeedback('Insufficient mana');
            return;
        }

        // Attempt unveil
        const success = this.gameEngine.unveil(x, y, manaCost);
        if (success) {
            this.selectCell(x, y);
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
     * Draw overlay effects on the grid (grid lines and selection highlight).
     * TileMap renders the base colors; this handles overlays.
     */
    private drawGridBackground(ctx: ExcaliburGraphicsContext): void {
        const grid = this.gameEngine.getGrid();
        const width = grid.getWidth();
        const height = grid.getHeight();

        // Draw grid lines
        const gridColor = new Color(192, 192, 192);
        // ctx.drawLine(vec(0, 0), vec(width * this.tileSize, height * this.tileSize), gridColor, 1);
        let currentY = 0;
        let maxX = width * this.tileSize;
        for (let y = 0; y <= height; y++) {
            ctx.drawLine(vec(0, currentY), vec(maxX, currentY), gridColor, 2);
            currentY += this.tileSize;
        }
        let currentX = 0;
        let maxY = height * this.tileSize;
        for (let x = 0; x <= width; x++) {
            ctx.drawLine(vec(currentX, 0), vec(currentX, maxY), gridColor, 2);
            currentX += this.tileSize;
        }


        // Highlight selected cell with bright border
        const selectedScreenX = this.selectedX * this.tileSize;
        const selectedScreenY = this.selectedY * this.tileSize;
        ctx.drawRectangle(vec(selectedScreenX, selectedScreenY), this.tileSize, this.tileSize, new Color(255,255,255, 0), new Color(255,255,96), 2);
    }

    /**
     * Draw feedback message on screen.
     */
    private drawFeedbackMessage(ctx: ExcaliburGraphicsContext): void {
        // const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        // if (!canvas) return;
        // const canvasCtx = canvas.getContext('2d')!;
        // canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        // canvasCtx.fillRect(50, 30, 300, 40);
        //
        // canvasCtx.fillStyle = '#FFFFFF';
        // canvasCtx.font = 'bold 16px Arial';
        // canvasCtx.fillText(this.feedbackMessage, 70, 60);
    }

}