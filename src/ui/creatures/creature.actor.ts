import { Actor, EasingFunctions, Vector, vec } from 'excalibur';
import { CreatureType } from '../../core/creatures/creatures.model';
import { Sprites } from '../../resources';
import { PULSE_INTERVAL } from '../../shared/constants';

const CREATURE_Z = 50;

export class CreatureActor extends Actor {
    readonly creatureId: string;

    constructor(creatureId: string, type: CreatureType, worldPos: Vector) {
        super({ pos: worldPos, anchor: vec(0.5, 0.5), z: CREATURE_Z });
        this.creatureId = creatureId;
        this.graphics.use(getCreatureSprite(type));
    }

    tweenTo(targetPos: Vector): void {
        this.actions.clearActions();
        this.actions.moveTo({ pos: targetPos, duration: PULSE_INTERVAL, easing: EasingFunctions.Linear });
    }
}

function getCreatureSprite(type: CreatureType) {
    switch (type) {
        case 'StoneGiant':    return Sprites.creatureStoneGiant;
        case 'SeaSerpent':    return Sprites.creatureSeaSerpent;
        case 'LuminousSwarm': return Sprites.creatureLuminousSwarm;
    }
}
