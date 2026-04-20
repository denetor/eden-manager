/**
 * Shared constants used across the game.
 * These values are referenced by coordinate systems, camera logic, HUD actors, and rendering.
 */

/** Isometric tile width in pixels */
export const TILE_WIDTH = 64;

/** Isometric tile height in pixels */
export const TILE_HEIGHT = 32;

/** Grid dimensions */
export const GRID_WIDTH = 16;
export const GRID_HEIGHT = 16;

/** Map dimensions at 1.0x zoom (pixels) */
export const MAP_WIDTH = GRID_WIDTH * TILE_WIDTH;
export const MAP_HEIGHT = GRID_HEIGHT * TILE_HEIGHT;

/** Viewport dimensions (logical pixels) */
export const VIEWPORT_WIDTH = 800;
export const VIEWPORT_HEIGHT = 600;

/** Excalibur layers **/
export const Z_UI = 999;

/** Mana costs for player actions */
export const HUMAN_SPAWN_COST = 10;