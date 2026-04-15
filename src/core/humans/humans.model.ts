/**
 * Human agent in the world
 */
export interface Human {
    id: string;
    x: number;
    y: number;
    state: 'idle' | 'moving' | 'settled';
}

/**
 * Humans system state
 */
export interface HumansState {
    population: Human[];
    totalCount: number;
}