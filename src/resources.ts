import {Color, ImageSource, Loader} from "excalibur";

// It is convenient to put your resources in one place
export const Resources = {
  tiles_selected: new ImageSource('./images/tiles/selected-cell.png'),
  tiles_veiled: new ImageSource('./images/tiles/floor-veiled-01.png'),
  tiles_empty: new ImageSource('./images/tiles/floor-empty-01.png'),
  tiles_meadow: new ImageSource('./images/tiles/floor-meadow-02.png'),
  tiles_meadow_dormant: new ImageSource('./images/tiles/floor-meadow-02-dormant.png'),
  tiles_water: new ImageSource('./images/tiles/floor-water-02.png'),
  tiles_water_dormant: new ImageSource('./images/tiles/floor-water-02-dormant.png'),
  tiles_mountain: new ImageSource('./images/tiles/floor-mountain-01.png'),
  tiles_mountain_dormant: new ImageSource('./images/tiles/floor-mountain-01-dormant.png'),
  tiles_forest: new ImageSource('./images/tiles/floor-forest-01.png'),
  tiles_forest_dormant: new ImageSource('./images/tiles/floor-forest-01-dormant.png'),
  tiles_ruins: new ImageSource('./images/tiles/floor-ruins-01.png'),
  tiles_ruins_dormant: new ImageSource('./images/tiles/floor-ruins-01-dormant.png'),
  tiles_fertile_plain: new ImageSource('./images/tiles/floor-fertile-plain-02.png'),
  tiles_fertile_plain_dormant: new ImageSource('./images/tiles/floor-fertile-plain-02-dormant.png'),
  tiles_sacred_grove: new ImageSource('./images/tiles/floor-sacred-grove-01.png'),
  tiles_sacred_grove_dormant: new ImageSource('./images/tiles/floor-sacred-grove-01-dormant.png'),
  tiles_foothill: new ImageSource('./images/tiles/floor-foothill-02.png'),
  tiles_foothill_dormant: new ImageSource('./images/tiles/floor-foothill-02-dormant.png'),
  tiles_hidden_temple: new ImageSource('./images/tiles/floor-hidden-temple-01.png'),
  tiles_hidden_temple_dormant: new ImageSource('./images/tiles/floor-hidden-temple-01-dormant.png'),
  tiles_mill: new ImageSource('./images/tiles/floor-mill-01.png'),
  tiles_mill_dormant: new ImageSource('./images/tiles/floor-mill-01-dormant.png'),
  tiles_shrine: new ImageSource('./images/tiles/floor-temple-01.png'),
  tiles_shrine_dormant: new ImageSource('./images/tiles/floor-temple-01-dormant.png'),
  tiles_tower: new ImageSource('./images/tiles/floor-tower-01.png'),
  tiles_tower_dormant: new ImageSource('./images/tiles/floor-tower-01-dormant.png'),
  tiles_farm: new ImageSource('./images/tiles/floor-farm-01.png'),
  tiles_farm_dormant: new ImageSource('./images/tiles/floor-farm-01-dormant.png'),
  human: new ImageSource('./images/humans/human-01.png'),
  human_dormant: new ImageSource('./images/humans/human-01-dormant.png'),
  creature_stone_giant: new ImageSource('./images/creatures/stone-giant.png'),
  creature_luminous_swarm: new ImageSource('./images/creatures/luminous-swarm.png'),
  creature_sea_serpent: new ImageSource('./images/creatures/sea-serpent.png'),
  creature_sky_whale: new ImageSource('./images/creatures/sky-whale.png'),
  creature_deer: new ImageSource('./images/creatures/deer.png'),
} as const; // the 'as const' is a neat typescript trick to get strong typing on your resources.
// So when you type Resources.Sword -> ImageSource

// We build a loader and add all of our resources to the boot loader
// You can build your own loader by extending DefaultLoader
export const loader = new Loader();
for (const res of Object.values(Resources)) {
  loader.addResource(res);
}

export const Sprites = {
  // tiles
  selected: Resources.tiles_selected.toSprite(),
  veiled: Resources.tiles_veiled.toSprite(),
  empty: Resources.tiles_empty.toSprite(),
  emptyDormant: Resources.tiles_empty.toSprite(),
  meadow: Resources.tiles_meadow.toSprite(),
  meadowDormant: Resources.tiles_meadow_dormant.toSprite(),
  water: Resources.tiles_water.toSprite(),
  waterDormant: Resources.tiles_water_dormant.toSprite(),
  mountain: Resources.tiles_mountain.toSprite(),
  mountainDormant: Resources.tiles_mountain_dormant.toSprite(),
  forest: Resources.tiles_forest.toSprite(),
  forestDormant: Resources.tiles_forest_dormant.toSprite(),
  ruins: Resources.tiles_ruins.toSprite(),
  ruinsDormant: Resources.tiles_ruins_dormant.toSprite(),
  fertilePlain: Resources.tiles_fertile_plain.toSprite(),
  fertilePlainDormant: Resources.tiles_fertile_plain_dormant.toSprite(),
  sacredGrove: Resources.tiles_sacred_grove.toSprite(),
  sacredGroveDormant: Resources.tiles_sacred_grove_dormant.toSprite(),
  footHill: Resources.tiles_foothill.toSprite(),
  footHillDormant: Resources.tiles_foothill_dormant.toSprite(),
  hiddenTemple: Resources.tiles_hidden_temple.toSprite(),
  hiddenTempleDormant: Resources.tiles_hidden_temple_dormant.toSprite(),
  mill: Resources.tiles_mill.toSprite(),
  millDormant: Resources.tiles_mill_dormant.toSprite(),
  shrine: Resources.tiles_shrine.toSprite(),
  shrineDormant: Resources.tiles_shrine_dormant.toSprite(),
  tower: Resources.tiles_tower.toSprite(),
  towerDormant: Resources.tiles_tower_dormant.toSprite(),
  farm: Resources.tiles_farm.toSprite(),
  farmDormant: Resources.tiles_farm_dormant.toSprite(),
  // humans
  human: Resources.human.toSprite(),
  humanDormant: Resources.human_dormant.toSprite(),
  // creatures
  creatureStoneGiant: Resources.creature_stone_giant.toSprite(),
  creatureLuminousSwarm: Resources.creature_luminous_swarm.toSprite(),
  creatureSeaSerpent: Resources.creature_sea_serpent.toSprite(),
  creatureSkyWhale: Resources.creature_sky_whale.toSprite(),
  creatureDeer: Resources.creature_deer.toSprite(),
}
Sprites.selected.opacity = 0.5;
Sprites.veiled.opacity = 0.85;

// make dormant sprites grayer
const dormantTint = Color.DarkGray;
Sprites.emptyDormant.tint = dormantTint
Sprites.meadowDormant.tint = dormantTint
Sprites.waterDormant.tint = dormantTint
Sprites.mountainDormant.tint = dormantTint
Sprites.forestDormant.tint = dormantTint
Sprites.ruinsDormant.tint = dormantTint
Sprites.fertilePlainDormant.tint = dormantTint
Sprites.sacredGroveDormant.tint = dormantTint
Sprites.footHillDormant.tint = dormantTint
Sprites.hiddenTempleDormant.tint = dormantTint
Sprites.millDormant.tint = dormantTint
Sprites.shrineDormant.tint = dormantTint
Sprites.towerDormant.tint = dormantTint
Sprites.farmDormant.tint = dormantTint
// no tint, to recognize better against active human
// Sprites.humanDormant.tint = dormantTint

