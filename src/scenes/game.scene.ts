import {
    Circle,
    Color,
    Engine, Graphic, ImageSource,
    IsometricMap,
    Keys,
    Rectangle,
    Scene, Sprite,
    Vector,
} from 'excalibur';
import {Grid} from '../core/grid/grid.service';
import {GameEngine} from '../core/game-engine.service';
import {SynergyEngine} from '../core/synergy/synergy.service';
import {ManaService} from '../core/mana/mana.service';
import {HumansService} from '../core/humans/humans.service';
import {CreaturesService} from '../core/creatures/creatures.service';
import {PersistenceService} from '../persistence/persistence.service';
import {ManaDisplay} from '../ui/hud/mana-display';
import {CellInfo} from '../ui/hud/cell-info';
import {HighlightedCell} from "../ui/grid/highlighted-cell";
import {FeedbackMessage} from "../ui/feedback-message";
import {TILE_WIDTH, TILE_HEIGHT} from '../shared/constants';
import {CoordinateSystem} from '../graphics/coordinate-system';
import {IsometricCoordinateSystem} from '../graphics/isometric-coordinate-system';
import {CameraController} from '../input/camera-controller';
import {Resources, Sprites} from "../resources";

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
    private isometricMap!: IsometricMap;
    private coordinateSystem!: CoordinateSystem;
    private cameraController!: CameraController;
    private manaDisplay!: ManaDisplay;
    private cellInfo!: CellInfo;
    private highlightedCell!: HighlightedCell;
    private selectedX: number = 0;
    private selectedY: number = 0;
    private lastPulseTime: number = 0;
    private pulseInterval: number = 500; // ms between pulses

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

        // 3. Create IsometricMap for rendering the grid
        this.isometricMap = new IsometricMap({
            rows: grid.getHeight(),
            columns: grid.getWidth(),
            tileWidth: TILE_WIDTH,
            tileHeight: TILE_HEIGHT,
        });
        this.initializeIsometricMapGraphics(grid);
        this.add(this.isometricMap);

        // 3b. Initialize CoordinateSystem
        this.coordinateSystem = new IsometricCoordinateSystem(this.isometricMap);

        // 3c. Initialize CameraController (Phase 3: Camera Panning)
        this.cameraController = new CameraController();

        // 4. Create HUD displays
        this.manaDisplay = new ManaDisplay(mana);
        this.add(this.manaDisplay);

        this.cellInfo = new CellInfo(grid);
        this.add(this.cellInfo);

        // 4b. Create highlighted cell indicator
        const highlightColor = new Color(255, 255, 96, 0.5);
        this.highlightedCell = new HighlightedCell(TILE_WIDTH, TILE_HEIGHT, highlightColor, this.coordinateSystem);
        this.add(this.highlightedCell);

        // 5. Subscribe to cell change events
        this.subscribeToGridEvents(grid);

        // 6. Subscribe to input events
        this.setupInputHandling(engine, grid);
        this.cameraController.setupInputHandling(engine);

        // 7. Verify CoordinateSystem transformations (Phase 2 verification)
        this.verifyCoordinateSystemTransforms();
    }


    override onPreUpdate(engine: Engine, elapsedMs: number): void {
        // Update camera position and apply bounds validation (Phase 3: Camera Panning)
        this.cameraController.update(engine);

        // Update highlighted cell position (uses CoordinateSystem internally)
        this.highlightedCell.updateSelection(this.selectedX, this.selectedY);

        // Handle continuous pulse triggering
        this.lastPulseTime += elapsedMs;
        if (this.lastPulseTime >= this.pulseInterval) {
            this.triggerDivinePulse();
            this.lastPulseTime = 0;
        }
    }

    /**
     * Initialize IsometricMap graphics from the Grid data.
     * Creates colored Rectangle graphics for each tile based on terrain type and cell state.
     */
    private async initializeIsometricMapGraphics(grid: Grid): Promise<void> {
        const width = grid.getWidth();
        const height = grid.getHeight();

        // // add generic graphic
        // // const floorImage = new ImageSource('../public/images/tiles/floor-empty-01.png');
        // // await floorImage.load();
        // // const floorSprite = floorImage.toSprite();
        // const floorSprite = Resources.tiles_empty.toSprite();
        // for (let tile of this.isometricMap.tiles) {
        //     tile.addGraphic(floorSprite);
        // }

        // Populate tiles with colored rectangles based on grid state
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const cell = grid.getCell(x, y)!;
                const tile = this.isometricMap.getTile(x, y)!
                // get cell sprite given cell.state and cell.terrainType
                tile.addGraphic(this.getCellSprite(cell.state, cell.terrainType));
            }
        }
    }


    /**
     * Retrieves the appropriate sprite for a cell based on its state and terrain type.
     *
     * @param {string} state - The state of the cell, typically representing its status or condition.
     * @param {string} terrainType - The type of terrain the cell belongs to (e.g., 'Forest', 'Water', 'Mountain', 'Meadow').
     * @return {Graphic} The sprite representing the specified terrain type.
     *
     */
    private getCellSprite(state: string, terrainType:string): Graphic {
        if (state === 'Veiled') {
            // TODO return the grey fog sprite
        }
        switch (terrainType) {
            case 'Forest':
                return state === 'Dormant' ? Sprites.forestDormant : Sprites.forest;
            case 'Water':
                return Sprites.water;
            case 'Mountain':
                return Sprites.mountain;
            case 'Meadow':
                return Sprites.meadow;
            // TODO add remaining terrain types
            default:
                return Sprites.empty;
        }
    }




    /**
     * Calculate the color for a cell based on its state and terrain type.
     * - Veiled: Gray (128, 128, 128) with 0.3 opacity
     * - Dormant: Desaturated terrain color
     * - Active: Full-saturation terrain color
     *
     * @deprecated Use getCellSprite() instead
     */
    private getCellColor(state: string, terrainType: string): Color {
        // Veiled cells are always gray with reduced opacity
        if (state === 'Veiled') {
            return new Color(128, 128, 128, 0.3);
        }

        // Get base terrain color
        let baseColor: Color;
        switch (terrainType) {
            case 'Forest':
                baseColor = new Color(34, 139, 34);
                break;
            case 'Water':
                baseColor = new Color(30, 144, 255);
                break;
            case 'Mountain':
                baseColor = new Color(169, 169, 169);
                break;
            default:
                baseColor = new Color(144, 238, 144); // Meadow (default)
        }

        // Apply state-based desaturation
        if (state === 'Dormant') {
            // Desaturate: reduce color brightness by ~40%
            const factor = 0.6;
            return new Color(
                Math.floor(baseColor.r * factor),
                Math.floor(baseColor.g * factor),
                Math.floor(baseColor.b * factor),
                1.0
            );
        }

        // Active: full saturation
        return new Color(baseColor.r, baseColor.g, baseColor.b, 1.0);
    }


    /**
     * Subscribe to Grid events to update tile graphics when cell state changes.
     */
    private subscribeToGridEvents(grid: Grid): void {
        grid.on('cellChanged', (payload: any) => {
            const { x, y, cell } = payload;
            const tile = this.isometricMap.getTile(x, y);
            if (tile) {
                // Clear old graphics and add new one with updated color
                tile.clearGraphics();
                const color = this.getCellColor(cell.state, cell.terrainType);
                const rect = new Rectangle({
                    width: TILE_WIDTH,
                    height: TILE_HEIGHT,
                    color: color,
                });
                tile.addGraphic(rect);
                console.log(`Updated tile (${x}, ${y}): state=${cell.state}, terrain=${cell.terrainType}`);
            }
        });

        grid.on('batchChanged', (payload: any) => {
            const { changes } = payload;
            for (const change of changes) {
                const tile = this.isometricMap.getTile(change.x, change.y);
                if (tile) {
                    const cell = grid.getCell(change.x, change.y)!;
                    tile.clearGraphics();
                    const color = this.getCellColor(cell.state, cell.terrainType);
                    const rect = new Rectangle({
                        width: TILE_WIDTH,
                        height: TILE_HEIGHT,
                        color: color,
                    });
                    tile.addGraphic(rect);
                }
            }
            console.log(`Batch updated ${changes.length} tiles`);
        });
    }

    /**
     * Setup input handling for mouse clicks and keyboard shortcuts.
     * Uses CoordinateSystem for isometric-aware coordinate transformation.
     */
    private setupInputHandling(engine: Engine, grid: Grid): void {
        // Click detection via primary pointer (mouse/touch)
        // Excalibur applies camera transforms automatically, so worldPos is already in world space
        engine.input.pointers.primary.on('down', (evt: any) => {
            // Get the world position from the pointer event (already in world space thanks to Excalibur)
            const worldPos = evt.coordinates.worldPos;
            if (worldPos) {
                // Use IsometricMap's native method to get tile at world position
                const tile = this.isometricMap.getTileByPoint(worldPos);
                if (tile) {
                    // Convert world coordinates to grid coordinates using CoordinateSystem abstraction
                    const gridCoords = this.screenToGridCoordinates(worldPos);

                    this.selectCell(tile.x, tile.y);
                    this.attemptReshape(this.selectedX, this.selectedY, 'Forest');

                    // Console verification: log both methods of getting grid coordinates
                    console.log(
                        `Click Detection → world (${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)}) ` +
                        `→ getTileByPoint: grid (${tile.x}, ${tile.y}) ` +
                        `→ CoordinateSystem: grid (${gridCoords.x.toFixed(0)}, ${gridCoords.y.toFixed(0)})`
                    );
                }
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
     * Convert world position to grid coordinates using the CoordinateSystem abstraction.
     * This method enables isometric-aware coordinate transformation and is the single
     * point of conversion for all world-to-grid operations. Supports future perspective swaps.
     *
     * @param worldPos World position in pixels (result of camera transforms)
     * @returns Grid coordinates (fractional, typically floored for cell lookup)
     */
    private screenToGridCoordinates(worldPos: any): any {
        // Delegate to CoordinateSystem for abstraction and future perspective flexibility
        return this.coordinateSystem.worldToTile(worldPos);
    }

    /**
     * Select a cell and update UI.
     * Updates both internal state and visual indicators (CellInfo, HighlightedCell).
     *
     * @param x Grid x-coordinate
     * @param y Grid y-coordinate
     */
    private selectCell(x: number, y: number): void {
        this.selectedX = x;
        this.selectedY = y;
        this.cellInfo.setSelectedCell(x, y);
        console.log(`selectCell: Selected (${x}, ${y})`);
    }



    /**
     * Attempt to reshape a cell with feedback.
     *
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
    private showFeedback(message: string, duration: number = 3000): void {
        const feedback = new FeedbackMessage(message, duration);
        this.add(feedback);
    }


    /**
     * Verify CoordinateSystem transformations (Phase 2: Click Detection & Selection).
     * Tests key grid cells to ensure worldToTile() and tileToWorld() work correctly.
     * This is a Phase 2 acceptance criteria: console verification of coordinate transforms.
     */
    private verifyCoordinateSystemTransforms(): void {
        console.log('=== Phase 2: CoordinateSystem Verification ===');

        // Test key grid cells: corners and center
        const testCells = [
            { x: 0, y: 0, name: 'top-left corner' },
            { x: 15, y: 0, name: 'top-right corner' },
            { x: 0, y: 15, name: 'bottom-left corner' },
            { x: 15, y: 15, name: 'bottom-right corner' },
            { x: 7, y: 7, name: 'center cell' },
        ];

        for (const cell of testCells) {
            // Test tileToWorld: grid → world
            const tilePos = new Vector(cell.x, cell.y);
            const worldPos = this.coordinateSystem.tileToWorld(tilePos);

            // Test worldToTile: world → grid (should return close to original)
            const backToTile = this.coordinateSystem.worldToTile(worldPos);

            console.log(
                `Cell ${cell.name} (${cell.x}, ${cell.y}): ` +
                `tileToWorld → world (${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)}) ` +
                `→ worldToTile → grid (${backToTile.x.toFixed(2)}, ${backToTile.y.toFixed(2)})`
            );
        }

        console.log('=== Phase 2 Verification Complete ===');
    }

}