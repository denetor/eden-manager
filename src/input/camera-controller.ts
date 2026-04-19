import { Engine, Keys, Vector } from 'excalibur';
import { TILE_WIDTH, TILE_HEIGHT, GRID_WIDTH, GRID_HEIGHT, MAP_WIDTH, MAP_HEIGHT } from '../shared/constants';

/**
 * CameraController manages pan input (Arrow and WASD keys) and zoom input (mouse wheel, +/- keys).
 * Pan input is constrained by map bounds; zoom is constrained to 1.0x-2.0x range.
 *
 * Pan bounds formula:
 * - X bounds: [tileWidth/2, mapWidth - tileWidth/2]
 * - Y bounds: [tileHeight/2, mapHeight - tileHeight/2]
 *
 * Zoom bounds: [1.0, 2.0]
 */
export class CameraController {
    private readonly panSpeed: number = 8; // pixels per frame at 60 FPS
    private panX: number = 0; // accumulated pan X velocity
    private panY: number = 0; // accumulated pan Y velocity

    private currentZoom: number = 1.0; // camera zoom level
    private readonly zoomSpeed: number = 0.1; // zoom change per key press
    private readonly minZoom: number = 1.0; // minimum zoom level
    private readonly maxZoom: number = 2.0; // maximum zoom level
    private zoomDelta: number = 0; // accumulated zoom change per frame

    // Bounds cache (computed once on init)
    private minCameraX: number;
    private maxCameraX: number;
    private minCameraY: number;
    private maxCameraY: number;

    constructor() {
        // Pre-compute bounds based on map dimensions and tile sizes
        // Camera center must stay within valid region to avoid showing void
        this.minCameraX = TILE_WIDTH / 2;
        this.maxCameraX = MAP_WIDTH - TILE_WIDTH / 2;
        this.minCameraY = TILE_HEIGHT / 2;
        this.maxCameraY = MAP_HEIGHT - TILE_HEIGHT / 2;

        console.log(
            `CameraController initialized with bounds: ` +
            `X=[${this.minCameraX}, ${this.maxCameraX}], Y=[${this.minCameraY}, ${this.maxCameraY}]`
        );
    }

    /**
     * Setup mouse wheel listener for zoom input.
     * Keyboard zoom input is handled in update() using isHeld() checks.
     */
    setupInputHandling(engine: Engine): void {
        // Listen to mouse wheel events for zoom input
        // console.log('CameraController: Setting up wheel listener');

        try {
            engine.input.pointers.on('wheel', (evt: any) => {
                // console.log('Wheel event detected:', evt.deltaY);
                if (evt.deltaY > 0) {
                    // Scroll down: zoom out
                    this.zoomDelta -= this.zoomSpeed;
                    // console.log('Zoom out, delta:', this.zoomDelta);
                } else if (evt.deltaY < 0) {
                    // Scroll up: zoom in
                    this.zoomDelta += this.zoomSpeed;
                    // console.log('Zoom in, delta:', this.zoomDelta);
                }
            });
        } catch (e) {
            console.error('Failed to setup wheel listener:', e);
        }
    }

    /**
     * Update camera position and zoom based on keyboard and pointer input.
     * Called every frame to apply pan, zoom, and validate constraints.
     */
    update(engine: Engine): void {
        // Get camera from current scene (not from engine)
        const scene = engine.currentScene;
        if (!scene) {
            console.log('Scene is undefined');
            return;
        }

        const camera = scene.camera;
        if (!camera) {
            console.log('Camera is undefined');
            return;
        }

        // Reset pan velocity each frame
        this.panX = 0;
        this.panY = 0;

        // Accumulate zoom delta each frame (from events and keyboard)
        let frameZoomDelta = this.zoomDelta;
        // console.log('Frame zoom delta from events:', frameZoomDelta);
        this.zoomDelta = 0;

        // Check keyboard state for zoom input
        // +/= keys for zoom in
        const plusHeld = engine.input.keyboard.isHeld(Keys.Plus);
        const equalHeld = engine.input.keyboard.isHeld(Keys.Equal);
        if (plusHeld || equalHeld) {
            frameZoomDelta += this.zoomSpeed;
            // console.log('Zoom in (keyboard), plus:', plusHeld, 'equal:', equalHeld);
        }
        // -/_ keys for zoom out
        const minusHeld = engine.input.keyboard.isHeld(Keys.Minus);
        const underscoreHeld = engine.input.keyboard.isHeld(Keys.Underscore);
        if (minusHeld || underscoreHeld) {
            frameZoomDelta -= this.zoomSpeed;
            // console.log('Zoom out (keyboard), minus:', minusHeld, 'underscore:', underscoreHeld);
        }

        // console.log('Final frameZoomDelta:', frameZoomDelta, 'currentZoom before:', this.currentZoom);

        // Apply zoom if there's a zoom delta
        if (frameZoomDelta !== 0) {
            this.currentZoom += frameZoomDelta;
            // Clamp zoom to valid range
            this.currentZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.currentZoom));
            camera.zoom = this.currentZoom;
            // console.log(`Camera zoom: ${this.currentZoom.toFixed(2)}x`);
        }

        // Check keyboard state and accumulate pan velocity
        // Arrow keys
        if (engine.input.keyboard.isHeld(Keys.ArrowUp)) { // || engine.input.keyboard.isHeld(Keys.W)) {
            this.panY -= this.panSpeed;
        }
        if (engine.input.keyboard.isHeld(Keys.ArrowDown)) { // || engine.input.keyboard.isHeld(Keys.S)) {
            this.panY += this.panSpeed;
        }
        if (engine.input.keyboard.isHeld(Keys.ArrowLeft)) { // || engine.input.keyboard.isHeld(Keys.A)) {
            this.panX -= this.panSpeed;
        }
        if (engine.input.keyboard.isHeld(Keys.ArrowRight)) { // || engine.input.keyboard.isHeld(Keys.D)) {
            this.panX += this.panSpeed;
        }

        // Apply pan if velocity is non-zero
        if (this.panX !== 0 || this.panY !== 0) {
            // Calculate new camera center
            let newX = camera.pos.x + this.panX;
            let newY = camera.pos.y + this.panY;

            // Clamp to bounds
            newX = Math.max(this.minCameraX, Math.min(this.maxCameraX, newX));
            newY = Math.max(this.minCameraY, Math.min(this.maxCameraY, newY));

            // Apply to camera by creating a new Vector (pos might be immutable)
            camera.pos = new Vector(newX, newY);

            // console.log(`Camera pan: (${camera.pos.x.toFixed(0)}, ${camera.pos.y.toFixed(0)})`);
        }
    }

    /**
     * Get the current bounds for verification or debugging.
     */
    getBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
        return {
            minX: this.minCameraX,
            maxX: this.maxCameraX,
            minY: this.minCameraY,
            maxY: this.maxCameraY,
        };
    }

    /**
     * Get the current zoom level for verification or debugging.
     */
    getZoom(): number {
        return this.currentZoom;
    }
}