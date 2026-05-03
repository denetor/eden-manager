import {
    Engine, Graphic,
    IsometricMap, IsometricTile,
    Keys,
    Scene,
} from 'excalibur';
import {Grid} from '../core/grid/grid.service';
import {GameEngine} from '../core/game-engine.service';
import {SynergyEngine} from '../core/synergy/synergy.service';
import {BuildingSynergyService} from '../core/synergy/building-synergy.service';
import {ManaService} from '../core/mana/mana.service';
import {HumansService, HumanStatusChangedPayload} from '../core/humans/humans.service';
import {CreaturesService, CreatureSpawnedPayload, CreatureMovedPayload, CreatureDespawnedPayload} from '../core/creatures/creatures.service';
import {CreatureType} from '../core/creatures/creatures.model';
import {CreatureActor} from '../ui/creatures/creature.actor';
import {BuildingType} from '../core/synergy/building-synergy.model';
import {PersistenceService} from '../persistence/persistence.service';
import {ManaDisplay} from '../ui/hud/mana-display';
import {CellInfo} from '../ui/hud/cell-info';
import {FeedbackMessage} from "../ui/feedback-message";
import {TILE_WIDTH, TILE_HEIGHT, HUMAN_SPAWN_COST, PULSE_INTERVAL} from '../shared/constants';
// import {IsometricCoordinateSystem} from '../graphics/isometric-coordinate-system';
import {CameraController} from '../input/camera-controller';
import {Sprites} from "../resources";
import {Cell} from "../core/grid/grid.model";

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
    private cameraController!: CameraController;
    private manaDisplay!: ManaDisplay;
    private cellInfo!: CellInfo;
    private selectedX: number = -1;
    private selectedY: number = -1;
    private lastPulseTime: number = 0;
    private creatureActors: Map<string, CreatureActor> = new Map();

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
        const mana = new ManaService(50, 100, 1);
        const humans = this.persistenceService.loadHumans(grid) ?? new HumansService(grid);
        const creatures = this.persistenceService.loadCreatures(grid) ?? new CreaturesService(grid);
        const buildingSynergy = new BuildingSynergyService(grid, humans);
        this.gameEngine = new GameEngine(grid, synergy, buildingSynergy, mana, humans, creatures);

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
        // this.coordinateSystem = new IsometricCoordinateSystem(this.isometricMap);

        // 3c. Initialize CameraController (Phase 3: Camera Panning)
        this.cameraController = new CameraController();

        // 4. Create HUD displays
        this.manaDisplay = new ManaDisplay(mana);
        this.add(this.manaDisplay);

        this.cellInfo = new CellInfo(grid);
        this.add(this.cellInfo);

        // 5. Subscribe to cell change events
        this.subscribeToGridEvents(grid);
        this.subscribeToHumansEvents(this.gameEngine.getHumans());
        this.subscribeToCreaturesEvents(this.gameEngine.getCreatures());

        // 5b. Create actors for creatures already loaded from persistence
        // for (const creature of creatures.getCreatures()) {
        //     this.spawnCreatureActor(creature.id, creature.type, creature.x, creature.y);
        // }

        // 6. Subscribe to input events
        this.setupInputHandling(engine, grid);
        this.cameraController.setupInputHandling(engine);
    }


    override onPreUpdate(engine: Engine, elapsedMs: number): void {
        // Update camera position and apply bounds validation (Phase 3: Camera Panning)
        this.cameraController.update(engine);

        // Handle continuous pulse triggering
        this.lastPulseTime += elapsedMs;
        if (this.lastPulseTime >= PULSE_INTERVAL) {
            this.triggerDivinePulse();
            this.lastPulseTime = 0;
        }
    }

    /**
     * Initialize IsometricMap graphics from the Grid data.
     * Creates colored Rectangle graphics for each tile based on terrain type and cell state.
     */
    private initializeIsometricMapGraphics(grid: Grid): void {
        const width = grid.getWidth();
        const height = grid.getHeight();

        // Populate tiles with colored rectangles based on grid state
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const cell = grid.getCell(x, y)!;
                const tile = this.isometricMap.getTile(x, y)!
                this.setComposedGraphic(tile, cell, (x === this.selectedX && y === this.selectedY));
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
    private getCellSprite(state: string, terrainType: string): Graphic {
        switch (terrainType) {
            case 'Forest':
                return state === 'Dormant' ? Sprites.forestDormant : Sprites.forest;
            case 'Water':
                return state === 'Dormant' ? Sprites.waterDormant : Sprites.water;
            case 'Mountain':
                return state === 'Dormant' ? Sprites.mountainDormant : Sprites.mountain;
            case 'Meadow':
                return state === 'Dormant' ? Sprites.meadowDormant : Sprites.meadow;
            case 'Ruins':
                return state === 'Dormant' ? Sprites.ruinsDormant : Sprites.ruins;
            case 'Fertile Plain':
                return state === 'Dormant' ? Sprites.fertilePlainDormant : Sprites.fertilePlain;
            case 'Sacred Grove':
                return state === 'Dormant' ? Sprites.sacredGroveDormant : Sprites.sacredGrove;
            case 'Foothill':
                return state === 'Dormant' ? Sprites.footHillDormant : Sprites.footHill;
            case 'Hidden Temple':
                return state === 'Dormant' ? Sprites.hiddenTempleDormant : Sprites.hiddenTemple;
            default:
                return Sprites.empty;
        }
    }


    /**
     * Subscribe to HumansService events to refresh tiles when a human's survival status changes.
     *
     * @param humans - The HumansService instance emitting humanStatusChanged events
     */
    private subscribeToHumansEvents(humans: HumansService): void {
        humans.on('humanStatusChanged', (payload: HumanStatusChangedPayload) => {
            const tile = this.isometricMap.getTile(payload.x, payload.y);
            if (tile) {
                const cell = this.gameEngine.getGrid().getCell(payload.x, payload.y);
                if (cell) {
                    this.setComposedGraphic(tile, cell, payload.x === this.selectedX && payload.y === this.selectedY);
                }
            }
        });
    }

    /**
     * Subscribes to creature-related events and handles the graphical updates
     * based on the events triggered from the provided CreaturesService instance.
     *
     * @param {CreaturesService} creatures The service emitting creature-related events.
     * @return {void} This method does not return a value.
     */
    private subscribeToCreaturesEvents(creatures: CreaturesService): void {
        creatures.on('creatureSpawned', (payload: CreatureSpawnedPayload) => {
            // add creature sprite to cell graphics
            this.rebuildGraphics(payload.x, payload.y);
        });
        creatures.on('creatureMoved', (payload: CreatureMovedPayload) => {
            // remove creature sprite from source cell graphics
            this.rebuildGraphics(payload.fromX, payload.fromY);
            // add creature sprite to destination cell graphics
            this.rebuildGraphics(payload.toX, payload.toY);
        });
        creatures.on('creatureDespawned', (payload: CreatureDespawnedPayload) => {
            // remove creature sprite from cell graphics
            this.rebuildGraphics(payload.x, payload.y);
        });
    }


    /**
     * Spawns a new creature actor on the isometric map at the specified coordinates.
     *
     * @param {string} id - The unique identifier for the creature actor.
     * @param {CreatureType} type - The type of the creature to be spawned.
     * @param {number} x - The x-coordinate of the tile where the creature will be placed.
     * @param {number} y - The y-coordinate of the tile where the creature will be placed.
     * @return {void} Does not return a value.
     */
    private spawnCreatureActor(id: string, type: CreatureType, x: number, y: number): void {
        const tile = this.isometricMap.getTile(x, y);
        if (!tile) return;
        const actor = new CreatureActor(id, type, tile.center);
        this.creatureActors.set(id, actor);
        this.add(actor);
    }


    /**
     * Subscribe to Grid events to update tile graphics when cell state changes.
     */
    private subscribeToGridEvents(grid: Grid): void {
        grid.on('cellChanged', (payload: any) => {
            const { x, y, cell } = payload;
            const tile = this.isometricMap.getTile(x, y);
            if (tile) {
                this.setComposedGraphic(tile, cell, (x === this.selectedX && y === this.selectedY));
                // console.log(`Updated tile (${x}, ${y}): state=${cell.state}, terrain=${cell.terrainType}`);
            }
        });

        grid.on('batchChanged', (payload: any) => {
            const { changes } = payload;
            for (const change of changes) {
                const tile = this.isometricMap.getTile(change.x, change.y);
                if (tile) {
                    const cell = grid.getCell(change.x, change.y)!;
                    this.setComposedGraphic(tile, cell, (change.x === this.selectedX && change.y === this.selectedY));
                }
            }
            // console.log(`Batch updated ${changes.length} tiles`);
        });
    }


    /**
     * Rebuilds the graphical representation of a specific tile on the isometric map.
     *
     * @param {number} x - The x-coordinate of the tile to rebuild.
     * @param {number} y - The y-coordinate of the tile to rebuild.
     * @return {void} This method does not return a value.
     */
    private rebuildGraphics(x: number, y: number): void {
        const tile = this.isometricMap.getTile(x, y);
        if (tile) {
            const cell = this.gameEngine.getGrid().getCell(x, y);
            if (cell) {
                this.setComposedGraphic(tile, cell, x === this.selectedX && y === this.selectedY);
            }
        }
    }


    /**
     * Configures and sets the composed graphic for a given isometric tile based on the state of a cell.
     * Clears any existing graphics in the tile and adds graphics corresponding to the cell's state and selection status.
     *
     * @param {IsometricTile} tile - The isometric tile to update with new graphics.
     * @param {Cell} cell - The cell containing state and terrain information used to determine the tile's graphics.
     * @param {boolean} [selected] - Indicates whether the tile is selected and should display a selected graphic.
     * @return {void} Does not return a value.
     */
    private setComposedGraphic(tile: IsometricTile, cell: Cell, selected?: boolean): void {
        tile.clearGraphics();
        if (cell.state === 'Active' && cell.building) {
            tile.addGraphic(this.getBuildingSprite(cell.building));
        } else {
            tile.addGraphic(this.getCellSprite(cell.state, cell.terrainType));
        }
        if (cell.state === 'Veiled') {
            tile.addGraphic(Sprites.veiled);
        }
        this.addEntityOverlays(tile, cell);
        if (selected) {
            tile.addGraphic(Sprites.selected);
        }
    }

    private getBuildingSprite(building: BuildingType): Graphic {
        switch (building) {
            case 'Farm':   return Sprites.farm;
            case 'Mill':   return Sprites.mill;
            case 'Shrine': return Sprites.shrine;
            case 'Tower':  return Sprites.tower;
        }
    }

    /**
     * Overlay entity sprites on a tile.
     * Selects the dormant or active human sprite based on the human's current status.
     *
     * @param tile - The tile to add overlay graphics to
     * @param cell - The cell whose coordinates are used to locate entities
     */
    private addEntityOverlays(tile: IsometricTile, cell: Cell): void {
        // add human
        const humans = this.gameEngine.getHumans().getHumans();
        const humanAtCell = humans.find(h => h.x === cell.x && h.y === cell.y);
        if (humanAtCell) {
            tile.addGraphic(humanAtCell.status === 'Dormant' ? Sprites.humanDormant : Sprites.human);
        }
        // add creature
        const creatures = this.gameEngine.getCreatures().getCreatures();
        const creatureAtCell = creatures.find(c => c.x === cell.x && c.y === cell.y);
        if (creatureAtCell) {
            switch (creatureAtCell.type) {
                case 'StoneGiant':
                    tile.addGraphic(Sprites.creatureStoneGiant);
                    break;
                case 'SeaSerpent':
                    tile.addGraphic(Sprites.creatureSeaSerpent);
                    break;
                case 'LuminousSwarm':
                    tile.addGraphic(Sprites.creatureLuminousSwarm);
                    break;
            }

        }
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
                    this.selectCell(tile.x, tile.y);

                    // Console verification: log both methods of getting grid coordinates
                    // Convert world coordinates to grid coordinates using CoordinateSystem abstraction
                    // const gridCoords = this.screenToGridCoordinates(worldPos);
                    // console.log(
                    //     `Click Detection → world (${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)}) ` +
                    //     `→ getTileByPoint: grid (${tile.x}, ${tile.y}) ` +
                    //     `→ CoordinateSystem: grid (${gridCoords.x.toFixed(0)}, ${gridCoords.y.toFixed(0)})`
                    // );
                } else {
                    this.selectCell(-1, -1);
                }
            } else {
                this.selectCell(-1, -1);
            }
        });

        // Keyboard shortcuts
        engine.input.keyboard.on('press', (evt: any) => {
            if (evt.key === Keys.F) {
                this.attemptReshape(this.selectedX, this.selectedY, 'Forest');
            } else if (evt.key === Keys.W) {
                this.attemptReshape(this.selectedX, this.selectedY, 'Water');
            } else if (evt.key === Keys.M) {
                this.attemptReshape(this.selectedX, this.selectedY, 'Mountain');
            } else if (evt.key === Keys.P) {
                this.attemptReshape(this.selectedX, this.selectedY, 'Meadow');
            } else if (evt.key === Keys.Space) {
                this.attemptUnveil(this.selectedX, this.selectedY)
            } else if (evt.key === Keys.A) {
                this.attemptActivate(this.selectedX, this.selectedY);
            } else if (evt.key === Keys.H) {
                this.attemptSpawnHuman(this.selectedX, this.selectedY);
            } else if (evt.key === Keys.Enter) {
                this.triggerDivinePulse();
            }
        });
    }


    /**
     * Select a cell and update UI.
     * Updates both internal state and visual indicators (CellInfo, HighlightedCell).
     *
     * @param x Grid x-coordinate
     * @param y Grid y-coordinate
     */
    private selectCell(x: number, y: number): void {
        // remove selection sprite from currently selected cell
        if (this.selectedX >= 0 && this.selectedY >= 0) {
            const selectedTile = this.isometricMap.getTile(this.selectedX, this.selectedY);
            if (selectedTile) {
                const cell = this.gameEngine.getGrid().getCell(this.selectedX, this.selectedY);
                if (cell) {
                    this.setComposedGraphic(selectedTile, cell, false);
                }
            }
        }
        // set current cell as selected
        this.selectedX = x;
        this.selectedY = y;
        this.cellInfo.setSelectedCell(x, y);
        // add selection sprite to selected cell
        if (this.selectedX >= 0 && this.selectedY >= 0) {
            const selectedTile = this.isometricMap.getTile(this.selectedX, this.selectedY);
            if (selectedTile) {
                const cell = this.gameEngine.getGrid().getCell(this.selectedX, this.selectedY);
                if (cell) {
                    this.setComposedGraphic(selectedTile, cell, true);
                }
            }
        }
        // console.log(`selectCell: Selected (${x}, ${y})`);
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
            // console.log('Cooling...');
            this.showFeedback('Cooling...');
            return;
        }

        // Check mana
        if (!mana.hasEnough(manaCost)) {
            // console.log('Insufficient mana');
            this.showFeedback('Insufficient mana');
            return;
        }

        // Attempt reshape
        const success = this.gameEngine.reshape(x, y, terrainType as any, manaCost);
        if (success) {
            // console.log(`Reshaped to ${terrainType}`);
            this.showFeedback(`Reshaped to ${terrainType}`);
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
        // console.log(`attemptUnveil(${x}, ${y})`);
        const mana = this.gameEngine.getMana();
        const manaCost = 10; // Base cost per reshape

        // Check mana
        if (!mana.hasEnough(manaCost)) {
            // console.log('Insufficient mana');
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
     * Attempts to awaken a cell at the specified coordinates. Calls necessary game logic
     * to determine if the cell can be awakened based on mana availability. If successful,
     * selects the awakened cell.
     *
     * @param {number} x - The x-coordinate of the cell to awaken.
     * @param {number} y - The y-coordinate of the cell to awaken.
     * @return {void} This method does not return a value.
     */
    private attemptActivate(x: number, y: number): void {
        const mana = this.gameEngine.getMana();
        const manaCost = 10;

        // Check mana
        if (!mana.hasEnough(manaCost)) {
            this.showFeedback('Insufficient mana');
            return;
        }

        // Attempt awaken
        const success = this.gameEngine.awaken(x, y, manaCost);
        if (success) {
            this.selectCell(x, y);
        }
    }



    private attemptSpawnHuman(x: number, y: number): void {
        if (!this.gameEngine.getMana().hasEnough(HUMAN_SPAWN_COST)) {
            this.showFeedback('Insufficient mana');
            return;
        }
        const success = this.gameEngine.spawnHuman(x, y, HUMAN_SPAWN_COST);
        if (success) {
            const tile = this.isometricMap.getTile(x, y);
            const cell = this.gameEngine.getGrid().getCell(x, y);
            if (tile && cell) {
                this.setComposedGraphic(tile, cell, x === this.selectedX && y === this.selectedY);
            }
            this.showFeedback('Human placed');
        } else {
            this.showFeedback('Cannot place human here');
        }
    }


    /**
     * Trigger a Divine Pulse turn.
     */
    private triggerDivinePulse(): void {
        this.gameEngine.divinePulse();
        this.persistenceService.saveGrid(this.gameEngine.getGrid());
        this.persistenceService.saveHumans(this.gameEngine.getHumans());
        this.persistenceService.saveCreatures(this.gameEngine.getCreatures());
    }


    /**
     * Show a temporary feedback message.
     */
    private showFeedback(message: string, duration: number = 3000): void {
        const feedback = new FeedbackMessage(message, duration);
        this.add(feedback);
    }
}