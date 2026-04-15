/**
 * Legendary creature in the world
 */
export interface Creature {
    id: string;
    x: number;
    y: number;
    name: string;
    health: number;
    maxHealth: number;
}

/**
 * Creatures system state
 */
export interface CreaturesState {
    creatures: Creature[];
    count: number;
}