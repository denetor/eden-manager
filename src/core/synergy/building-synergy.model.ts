export type BuildingType = 'Farm' | 'Mill' | 'Shrine' | 'Tower';

export const BUILDING_MANA_YIELD: Record<BuildingType, number> = {
    'Farm': 2,
    'Mill': 3,
    'Shrine': 3,
    'Tower': 1,
};
