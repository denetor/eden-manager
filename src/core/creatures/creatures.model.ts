export type CreatureType = 'StoneGiant' | 'SeaSerpent' | 'LuminousSwarm';

export interface Creature {
    id: string;
    type: CreatureType;
    x: number;
    y: number;
}

export interface CreaturesState {
    creatures: Creature[];
    count: number;
}
