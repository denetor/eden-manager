import { Actor, Engine, Vector } from 'excalibur';
import { ManaService } from '../../core/mana/mana.service';

/**
 * ManaDisplay shows current/max mana in the HUD.
 * Updates in real-time as mana is spent and regenerated.
 */
export class ManaDisplay extends Actor {
    private mana: ManaService;
    private engine: Engine;

    constructor(mana: ManaService, engine: Engine) {
        super({
            x: 20,
            y: 20,
            width: 200,
            height: 50,
            color: undefined,
        });
        this.mana = mana;
        this.engine = engine;
    }

    override onPostDraw(ctx: CanvasRenderingContext2D): void {
        // const current = this.mana.getCurrent();
        // const max = this.mana.getMax();
        // const percent = (current / max) * 100;
        //
        // // Draw background
        // ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        // ctx.fillRect(this.pos.x, this.pos.y, 200, 30);
        //
        // // Draw border
        // ctx.strokeStyle = '#ffffff';
        // ctx.lineWidth = 2;
        // ctx.strokeRect(this.pos.x, this.pos.y, 200, 30);
        //
        // // Draw mana bar (blue)
        // ctx.fillStyle = '#0077ff';
        // ctx.fillRect(this.pos.x + 4, this.pos.y + 4, (200 - 8) * (percent / 100), 22);
        //
        // // Draw text
        // ctx.fillStyle = '#ffffff';
        // ctx.font = '14px Arial';
        // ctx.fillText(`Mana: ${current}/${max}`, this.pos.x + 10, this.pos.y + 22);
    }
}