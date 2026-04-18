import {Color, ImageSource, Loader} from "excalibur";

// It is convenient to put your resources in one place
export const Resources = {
  Sword: new ImageSource("./images/sword.png"), // Vite public/ directory serves the root images
  tiles_empty: new ImageSource('./images/tiles/floor-empty-01.png'),
  tiles_meadow: new ImageSource('./images/tiles/floor-meadow-01.png'),
  tiles_water: new ImageSource('./images/tiles/floor-water-01.png'),
  tiles_mountain: new ImageSource('./images/tiles/floor-mountain-01.png'),
  tiles_forest: new ImageSource('./images/tiles/floor-forest-01.png'),
} as const; // the 'as const' is a neat typescript trick to get strong typing on your resources.
// So when you type Resources.Sword -> ImageSource

// We build a loader and add all of our resources to the boot loader
// You can build your own loader by extending DefaultLoader
export const loader = new Loader();
for (const res of Object.values(Resources)) {
  loader.addResource(res);
}

export const Sprites = {
  empty: Resources.tiles_empty.toSprite(),
  emptyDormant: Resources.tiles_empty.toSprite(),
  meadow: Resources.tiles_meadow.toSprite(),
  meadowDormant: Resources.tiles_meadow.toSprite(),
  water: Resources.tiles_water.toSprite(),
  waterDormant: Resources.tiles_water.toSprite(),
  mountain: Resources.tiles_mountain.toSprite(),
  mountainDormant: Resources.tiles_mountain.toSprite(),
  forest: Resources.tiles_forest.toSprite(),
  forestDormant: Resources.tiles_forest.toSprite(),
}
// darken dormant versions
Sprites.emptyDormant.tint = new Color(64, 64, 64);
Sprites.meadowDormant.tint = new Color(64, 64, 64);
Sprites.waterDormant.tint = new Color(64, 64, 64);
Sprites.mountainDormant.tint = new Color(64, 64, 64);
Sprites.forestDormant.tint = new Color(64, 64, 64);


