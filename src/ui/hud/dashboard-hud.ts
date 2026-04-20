import { Color, Engine, Font, FontUnit, Label, Rectangle, ScreenElement, TextAlign, vec } from 'excalibur';
import {Z_UI} from "../../shared/constants";

export class DashboardHud extends ScreenElement {
    private bg!: Rectangle;
    private helpLabel!: Label;
    private currentWidth: number = 0;
    private dashboardHeight: number = 64;

    constructor() {
        super({ pos: vec(0, 0), anchor: vec(0, 0) });
    }

    override onInitialize(engine: Engine): void {
        this.currentWidth = engine.drawWidth;
        this.z = Z_UI;

        this.bg = new Rectangle({
            width: engine.drawWidth,
            height: this.dashboardHeight,
            color: new Color(0, 0, 0, 0.75),
        });
        this.graphics.use(this.bg);

        this.helpLabel = new Label({
            anchor: vec(0,0),
            text: 'Arrows: move view - SPACE: unveil tile - A: activate tile - F,W,P,M: change tile to Forest, Water, Plain, Mountain - H: spawn humans',
            pos: vec(2, this.dashboardHeight - 14),
            font: new Font({
                family: 'Arial',
                size: 12,
                unit: FontUnit.Px,
                color: Color.Yellow,
                textAlign: TextAlign.Center,
            }),
        });
        this.addChild(this.helpLabel);
    }

    override onPreUpdate(engine: Engine): void {
        if (engine.drawWidth !== this.currentWidth) {
            this.currentWidth = engine.drawWidth;
            this.bg.width = engine.drawWidth;
            this.graphics.use(this.bg);
            this.helpLabel.pos = vec(engine.drawWidth / 2, 32);
        }
    }
}
