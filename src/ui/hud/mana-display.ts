import {Actor, Color, Engine, Font, FontUnit, Label, vec} from 'excalibur';
import {ManaService} from '../../core/mana/mana.service';

/**
 * ManaDisplay shows current/max mana in the HUD.
 * Updates in real-time as mana is spent and regenerated.
 */
export class ManaDisplay extends Actor {
    private mana: ManaService;
    private engine: Engine;
    private manaBar: Actor;
    private caption: Actor;


    // TODO REFACTOR use a component/system to update mana value
    constructor(mana: ManaService, engine: Engine) {
        super({
            anchor: vec(0,0),
            x: 20,
            y: 20,
            width: 200,
            height: 30,
            color: new Color(0,0,0, 0.7),
        });
        this.mana = mana;
        this.engine = engine;

        this.manaBar = new Actor({
            anchor: vec(0,0),
            pos: vec(4, 4),
            height: 22,
            width: 200 - 8,
            color: new Color(0,127, 255),
        });
        this.caption = new Label({
            anchor: vec(0,0),
            pos: vec(8, 8),
            text: `Mana: ${this.mana.getCurrent()}/${this.mana.getMax()}`,
            font: new Font({
                family: 'Arial',
                size: 14,
                unit: FontUnit.Px,
            }),
            color: new Color(255, 255, 255),
        });

        this.addChild(this.manaBar);
        this.addChild(this.caption);
    }
}