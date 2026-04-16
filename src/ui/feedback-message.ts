import { Actor, Color, Font, FontUnit, Label, vec } from 'excalibur';

/**
 * Temporary feedback message displayed on screen, auto-destructs after duration.
 * Creates a semi-transparent background with centered text.
 */
export class FeedbackMessage extends Actor {
    private message: string;
    private duration: number;

    constructor(message: string, duration: number = 3000) {
        super({
            anchor: vec(0, 0),
            pos: vec(50, 30),
            width: 300,
            height: 40,
            color: new Color(0, 0, 0, 0.8),
        });
        this.message = message;
        this.duration = duration;
    }

    override onInitialize(): void {
        // Add text label as child
        this.addChild(
            new Label({
                anchor: vec(0, 0),
                pos: vec(10, 10),
                text: this.message,
                font: new Font({
                    family: 'Arial',
                    size: 16,
                    unit: FontUnit.Px,
                }),
                color: new Color(255, 255, 255),
            })
        );

        // Schedule auto-destruction after duration
        if (this.scene && this.scene.engine) {
            this.scene.engine.clock.schedule(() => {
                this.kill();
            }, this.duration);
        }
    }
}