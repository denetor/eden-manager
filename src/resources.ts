import {ImageSource, Loader} from "excalibur";

// It is convenient to put your resources in one place
export const Resources = {
  Sword: new ImageSource("./images/sword.png"), // Vite public/ directory serves the root images
  tiles_selected: new ImageSource('./images/tiles/selected-cell.png'),
  tiles_veiled: new ImageSource('./images/tiles/floor-veiled-01.png'),
  tiles_empty: new ImageSource('./images/tiles/floor-empty-01.png'),
  tiles_meadow: new ImageSource('./images/tiles/floor-meadow-01.png'),
  tiles_water: new ImageSource('./images/tiles/floor-water-01.png'),
  tiles_mountain: new ImageSource('./images/tiles/floor-mountain-01.png'),
  tiles_forest: new ImageSource('./images/tiles/floor-forest-01.png'),
  tiles_ruins: new ImageSource('./images/tiles/floor-ruins-01.png'),
  tiles_fertile_plain: new ImageSource('./images/tiles/floor-fertile-plain-01.png'),
  tiles_sacred_grove: new ImageSource('./images/tiles/floor-sacred-grove-01.png'),
  tiles_foothill: new ImageSource('./images/tiles/floor-foothill-01.png'),
  tiles_hidden_temple: new ImageSource('./images/tiles/floor-hidden-temple-01.png'),
} as const; // the 'as const' is a neat typescript trick to get strong typing on your resources.
// So when you type Resources.Sword -> ImageSource

// We build a loader and add all of our resources to the boot loader
// You can build your own loader by extending DefaultLoader
export const loader = new Loader();
for (const res of Object.values(Resources)) {
  loader.addResource(res);
}

export const Sprites = {
  selected: Resources.tiles_selected.toSprite(),
  veiled: Resources.tiles_veiled.toSprite(),
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
  ruins: Resources.tiles_ruins.toSprite(),
  ruinsDormant: Resources.tiles_ruins.toSprite(),
  fertilePlain: Resources.tiles_fertile_plain.toSprite(),
  fertilePlainDormant: Resources.tiles_fertile_plain.toSprite(),
  sacredGrove: Resources.tiles_sacred_grove.toSprite(),
  sacredGroveDormant: Resources.tiles_sacred_grove.toSprite(),
  footHill: Resources.tiles_foothill.toSprite(),
  footHillDormant: Resources.tiles_foothill.toSprite(),
  hiddenTemple: Resources.tiles_hidden_temple.toSprite(),
  hiddenTempleDormant: Resources.tiles_hidden_temple.toSprite(),
}
Sprites.selected.opacity = 0.5;
Sprites.veiled.opacity = 0.85;
// darken dormant versions
// Sprites.emptyDormant.tint = new Color(64, 64, 64);
// ...
// make transparent dormant versions
Sprites.emptyDormant.opacity = 0.6;
Sprites.meadowDormant.opacity = 0.6;
Sprites.waterDormant.opacity = 0.6;
Sprites.mountainDormant.opacity = 0.6;
Sprites.forestDormant.opacity = 0.6;
Sprites.ruinsDormant.opacity = 0.6;
Sprites.fertilePlainDormant.opacity = 0.6;
Sprites.sacredGroveDormant.opacity = 0.6;
Sprites.footHillDormant.opacity = 0.6;
Sprites.hiddenTemple.opacity = 0.6;

