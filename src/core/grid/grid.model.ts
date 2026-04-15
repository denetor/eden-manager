/**
 * Cell state: progression of awakening from hidden to active
 */
export type CellState = 'Veiled' | 'Dormant' | 'Active';

/**
 * Terrain type: the landscape composition of a cell
 */
export type TerrainType = 'Meadow' | 'Forest' | 'Mountain' | 'Water' | 'Ruins' | 'Fertile Plain' | 'Sacred Grove' | 'Foothill' | 'Hidden Temple';

/**
 * A single cell in the grid
 */
export interface Cell {
    state: CellState;
    terrainType: TerrainType;
    x: number;
    y: number;
}