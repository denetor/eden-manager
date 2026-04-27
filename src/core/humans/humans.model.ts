/**
 * Human survival status: Active when all needs are met, Dormant when a resource is absent.
 */
export type HumanStatus = 'Active' | 'Dormant';

/**
 * Human agent in the world.
 * `state` tracks movement behaviour (reserved for v0.21+).
 * `status` tracks survival based on nearby terrain resources.
 */
export interface Human {
    id: string;
    x: number;
    y: number;
    state: 'idle' | 'moving' | 'settled';
    status: HumanStatus;
}

/**
 * Humans system state
 */
export interface HumansState {
    population: Human[];
    totalCount: number;
}