import {Actor, Color, Font, FontUnit, Label, vec} from 'excalibur';
import {ManaService} from '../../core/mana/mana.service';
import {ManaState} from '../../core/mana/mana.model';

/**
 * ManaDisplay shows current/max mana in the HUD.
 * Updates in real-time as mana is spent and regenerated.
 */
export class ManaDisplay extends Actor {
    private mana: ManaService;
    private readonly manaBar: Actor;
    private readonly caption: Label;

    constructor(mana: ManaService) {
        super({
            anchor: vec(0,0),
            x: 16 * 32 + 16,
            y: 20,
            width: 200,
            height: 30,
            color: new Color(0,0,0, 0.7),
        });
        this.mana = mana;

        // manaBar is initially at 100% Then it's scaled un updateDisplay()
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

        // Register listener for mana state changes
        this.mana.onManaChanged((state: ManaState) => {
            this.updateDisplay(state);
        });
    }


    /**
     * Update mana bar width and caption text based on current mana state
     */
    private updateDisplay(state: ManaState): void {
        // Update bar width proportional to current mana
        // this.manaBar.width = (state.current / state.max) * this.manaBarMaxWidth;
        this.manaBar.scale = vec((state.current / state.max), 1);

        // Update caption text
        this.caption.text = `Mana: ${state.current}/${state.max}`;
    }
}