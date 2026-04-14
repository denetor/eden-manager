# Game Design Document: Eden Manager

---

## 1. Overview / Vision Statement

### Title
**Eden Manager**

### Genre
God Game / Environmental Puzzle (Meditative, Relaxation-Focused)

### Target Platform
Web (Excalibur.js)

### Target Tone
Peaceful, contemplative, gently rewarding. No urgency, no failure states.

### High Concept Pitch
You are a slumbering deity awakening a world lost to time and mist. Armed with divine mana, you reshape the land cell by cell,
watching as humanity gradually returns and flourishes. This is not a game about combat or conquest—it's about nurturing an 
ecosystem and discovering the emergent harmony that arises from thoughtful intervention.

### Unique Selling Point (USP)
Unlike traditional god games where the player *commands* civilizations, **Eden Manager** inverts the relationship: 
you *sculpt the environment*, and humans respond organically to what you create. No menus, no orders, no punishment—only 
observation and gentle influence. The satisfaction comes from understanding *how* the world works, not from fast reflexes 
or strategic dominance.

---

## 2. Gameplay Core Loop

### The Divine Pulse
Time in Eden Manager is not measured in turns or real-time seconds. Instead, the world progresses 
through **Divine Pulses**—rhythmic moments when the world "breathes," creatures move, and mana regenerates.

### The Three-Phase Loop

#### Phase 1: Observation & Intention
- You observe the current state of your territory.
- You identify areas of harmony or stagnation.
- You spot human desires (visualization icons) expressing their unmet needs.

#### Phase 2: Divine Intervention
- Spend accumulated mana to modify the land.
- **Unveil**: Dispel fog to reveal dormant terrain.
- **Awaken**: Activate inert cells, revealing their true nature.
- **Reshape**: Transform one terrain type into another (costs more mana, but unlocks new possibilities).

#### Phase 3: Emergence
- A Divine Pulse occurs. The world "ticks."
- Humans sense changes in their environment and automatically construct improvements based on adjacency rules.
- Creatures move according to their nature, possibly triggering chain reactions.
- Your mana regenerates based on established human structures and natural harmony.

### Core Loop Example
1. You observe a barren zone with dormant humans.
2. You spend mana to create a **Freshwater Spring** on high ground nearby.
3. You spend more mana to shift the adjacent **Barren Field** into **Fertile Plain**.
4. A Divine Pulse occurs.
5. Humans detect water and fertile soil, automatically building a **Mill** and **Farmland**.
6. The farmland generates passive mana for you.
7. Your mana pool regenerates, allowing further intervention.

---

## 3. Game Mechanics

### 3.1 The Mana System

#### Mana as Divine Energy
Mana is the only currency in the game. It represents your connection to the world and your capacity to reshape it.

#### Mana Generation
- **Passive Regeneration**: A small amount each Divine Pulse (baseline).
- **Human Offerings**: Each human structure generates mana continuously. Examples:
  - **Mill** (built on water + fertile land): 2 mana per pulse.
  - **Observatory** (built on ruins): 3 mana per pulse + reveals hidden terrains nearby.
  - **Sacred Grove** (enchanted forest): 1 mana per pulse + attracts legendary creatures.
- **Divine Monuments**: When humanity reaches high contentment in a region, they spontaneously build altars that generate mana bursts.
- **Memory Fragments**: Rare discoveries that grant permanent mana-generation bonuses.

#### Mana Costs
- **Unveil Fog** (reveal a hidden cell): 5 mana.
- **Awaken Terrain** (activate a dormant cell): 10 mana.
- **Reshape Terrain** (transform one terrain into another): 15–25 mana (varies by target terrain rarity).
- **Invoke Divine Power** (special active powers): 20–40 mana.

#### Mana Pool Mechanic
You have a **Maximum Mana** cap. Mana regenerates over Divine Pulses toward this cap. Early in the game, max mana is 
low (~50); as you build more human structures, your cap increases passively (max mana = 50 + 2 × number of human structures). 
This creates natural progression without pressure: if you run out of mana, you simply observe the world evolve until 
regeneration fills your pool again.

---

### 3.2 The Cell System

#### Cell States
Every cell on the map can exist in one of three primary states:

##### 1. Veiled (Mist-Covered)
- Appearance: Gray, featureless fog.
- Properties: You cannot interact with it; you don't know what lies beneath.
- Action: Spend 5 mana to **Unveil** and move it to the Dormant state.

##### 2. Dormant (Awakened but Inert)
- Appearance: Desaturated version of the true terrain type (faded green for a meadow, muted brown for soil).
- Properties: The terrain exists but produces no resources, attracts no creatures, and exerts minimal influence.
- Action: Spend 10 mana to **Awaken** and activate it fully.

##### 3. Active (Thriving)
- Appearance: Vivid, saturated colors with subtle animations (growth, glow, shimmer).
- Properties: 
  - Generates resources or mana.
  - Influences adjacent cells based on adjacency rules.
  - Attracts creatures and human development.
  - Can be reshaped via mana expenditure.

#### Terrain Types (Base Palette)

| Terrain | Visual | Base Properties | Human Affinity | Notes |
|---------|--------|-----------------|-----------------|-------|
| **Meadow** | Bright green grass | Neutral terrain, low influence | Moderate; prefer adjacent water | Baseline for human settlement |
| **Forest** | Dense green trees | Increases fertility of adjacent cells | High; attracts woodcutters | Creates forest barriers if too prevalent |
| **Freshwater** | Blue flowing water | Hydrates adjacent cells, critical for life | Very High; humans build mills and farms adjacent | Spreads influence +2 radius |
| **Mountain** | Gray rocky peaks | Blocks movement/influence, creates rain shadow | Low for direct settlement; loved for observatories | Alters wind patterns (see Advanced Mechanics) |
| **Grassland** | Pale yellow dry grass | Low fertility without water | Low; humans avoid unless adjacent to water | Burns easily; recovers from fires |
| **Ancient Ruins** | Crumbled stone, overgrown | Mysterious, generates history | High (curiosity driven); triggers research structures | Unique: Unveiling doubles its influence radius for one pulse |
| **Sacred Grove** | Glowing, ethereal trees | Spiritually potent; attracts creatures | Very High; humans revere it | Generates memory fragments; attracts legendary creatures |
| **Fertile Plain** | Rich brown soil + green shoots | High fertility, supports large populations | Very High; humans build multiple farms | Enhanced by adjacent meadows and water |
| **Dormant Spring** | Hidden water source (dormant state only) | Potential water source, low influence when dormant | N/A (must awaken) | When awakened, becomes Freshwater with boosted generation |
| **Volcanic Ash** | Black, glowing terrain | Rare, highly fertile but dangerous if excessive | Low short-term, High long-term | Decays over time unless reshaped intentionally |

---

### 3.3 Adjacency & Synergy System ("Resonance")

Every Divine Pulse, active cells examine their neighbors (4-directional or 8-directional; design choice). Based on 
adjacency patterns, **Resonance** effects occur—automatic transformations or bonuses that reward thoughtful placement.

#### Synergy Table

| Pattern | Result | Human Reaction | Mana Bonus |
|---------|--------|-----------------|------------|
| **Water + Meadow** | Meadow becomes Fertile Plain | Build farm (generates 2 mana/pulse) | +1 mana/pulse |
| **Fertile Plain + Fertile Plain** | Both become Super-Fertile (visual upgrade) | Build granary (stores excess food, generates 3 mana/pulse) | +2 mana/pulse |
| **Forest + Forest + Forest** (3+ contiguous) | Becomes Sacred Grove | Build shrine (generates 3 mana/pulse + attracts creatures) | +2 mana/pulse |
| **Mountain + Meadow** | Meadow becomes Foothill | Build guard tower / observation post (generates 1 mana/pulse, reveals fog in wider radius) | +0.5 mana/pulse |
| **Ruins + Forest** | Ruins become Hidden Temple | Build research lab (unlocks hybrid terrain types for reshaping) | +2 mana/pulse |
| **Water + Volcanic Ash** | Ash becomes Fertile Obsidian (rare) | Build blacksmith / forge (crafts rare resources, attracts specialized workers) | +3 mana/pulse |
| **Grassland + Water** | Creates Wetland (intermediate) | Build fishing village (generates 1.5 mana/pulse) | +0.5 mana/pulse |
| **Sacred Grove + Sacred Grove** (adjacent) | Forms Sanctuary | Build grand temple (legendary human structure, generates 5 mana/pulse, extremely rare) | +4 mana/pulse |

#### No "Wrong" Combinations
Importantly, no adjacency creates a *negative* outcome. An excess of forests doesn't burn the world; it just means humans 
have fewer places to farm. The constraint is spatial, not punitive—part of the meditative puzzle.

---

### 3.4 Divine Powers (Active Abilities)

Beyond reshaping terrain, the player can invoke powerful (but mana-expensive) effects. These are optional tools for 
breaking deadlocks or creating cascades.

#### Power List

| Power | Cost | Effect | Cooldown | Strategic Use |
|-------|------|--------|----------|-----------------|
| **Blessed Rain** | 25 mana | Hydrate a 3×3 area; any grassland or ash becomes meadow or fertile plain. | 2 pulses | Break drought; accelerate village growth |
| **Divine Wind** | 20 mana | Move one creature or fog token in a chosen direction by 1–3 cells. | 1 pulse | Guide creatures toward your goals; clear strategic fog |
| **Fertility Bloom** | 30 mana | Choose one cell; it immediately triggers all adjacent synergies as if a Divine Pulse occurred. | 3 pulses | Create chain reactions without waiting |
| **Veil of Forgetting** | 20 mana | Revert a reshaped cell back to its original dormant state; refund 50% of the reshaping cost. | 1 pulse | Experiment freely; "undo" poor choices with a cost |
| **Whisper of Memory** | 15 mana | Reveal the location and nature of all hidden ruins in a 5×5 area. | 5 pulses | Guide exploration; uncover story elements (optional) |

---

### 3.5 Human Behavior & Emergence

Humans in Eden Manager are **not puppets**. They follow simple, emergent rules that create surprisingly complex behaviors.

#### Human AI Principles

1. **Necessity (Survival):**
   - Humans require water within a 3-cell radius.
   - Humans require food-producing cells (meadows, fertile plains) within a 2-cell radius.
   - If unmet, humans enter "Dormancy"—they stop building and stop generating mana (but don't die or leave).
   - Meeting a need "wakes" them, resuming building and mana generation.

2. **Opportunity (Growth):**
   - When basic needs are met, humans examine all cells within a 4-cell radius for synergy opportunities.
   - Each terrain type has a "preferred construction" if adjacent conditions are met.
   - Humans build autonomously; you observe, you don't command.

3. **Desire (Aspiration):**
   - Periodically, human communities generate a **Desire Icon**—a floating, glowing symbol expressing an unmet wish.
   - Desires are purely *suggestions*, not requirements. Ignoring them incurs no penalty.
   - Fulfilling a desire grants a **Memory Fragment**—a permanent, transferable bonus (e.g., "All mills generate +1 mana," or "Forests spread +1 cell per pulse").

#### Human Desire Icons

Desires are visual-only; no text clutters the interface. Examples:

| Icon | Interpretation | How to Satisfy |
|------|-----------------|-----------------|
| **Snowflake** | "We wish for cool breezes" | Place mountain or high-altitude terrain nearby |
| **Golden Wheat** | "We dream of fertility" | Create or expand adjacent fertile plains |
| **Open Eye** | "We are curious" | Reveal nearby ruins or create hybrid terrains |
| **Flame** | "We seek warmth" (in cold areas) or "We need to clear land" (in forests) | Place volcanic ash or create sunlit glades |
| **Bell** | "We long for community" | Create a second human settlement within 4 cells |
| **Book** | "We seek knowledge" | Create or nearby advanced structures like labs or observatories |

---

### 3.6 Creatures & Legendary Entities

Creatures are "catalysts of beauty"—they respond to environmental states without being controlled. They have no combat 
role; instead, they act as mobile blessings or dynamic elements.

#### Creature Behavior Rules

- Creatures only spawn in environments matching their nature.
- Once active, they move according to simple deterministic or pseudo-random rules each Divine Pulse.
- Where they move, they may trigger cascading effects (e.g., a Fire Spirit passing through grassland might accelerate its transformation, or a Water Serpent hydrating nearby drylands).

#### Placeholder Creature List

*(Note: Exact creatures TBD. Below are examples to establish pattern.)*

| Creature | Habitat | Movement Pattern | Effect | Rarity |
|----------|---------|------------------|--------|--------|
| **Stone Colossus** | Mountains | Wanders mountain chains, occasionally "levels" peaks into buildable plateaus | Transforms mountain cells into foothills or meadows, creating human settlement space | Rare |
| **Luminous Swarm** (fireflies) | Forests + night | Drawn to high-harmony cells; glows beautifully | Any cell a swarm rests on for a full pulse receives a permanent +1 mana generation bonus | Rare |
| **Water Serpent** | Rivers + wetlands | Flows downstream; spreads hydration influence wider than normal | Extends water influence +1 radius; attracts humans to adjacent cells | Uncommon |
| **Sky Whale** | High altitudes (mountains + clouds) | Migrates across the map; rare and majestic | Any cell it passes receives a temporary fertility boost; visiting it is a bucket-list moment for humanity | Legendary |
| **Verdant Deer Herd** | Forests + meadows | Grazes on meadows; attracted to lush areas | Enhances meadow fertility; marks territory with seasonal color shifts | Common |

---

## 4. Content Structure

### 4.1 Map Progression

The game supports **multiple map sizes**, scaling from 16×16 (early game, ~1 hour per session) to 128×128 (long-term, hundreds of hours). 
Maps are **not procedurally generated per session**; instead, each map is a distinct "world" that persists between play sessions via local storage.

#### Level Design Philosophy

Rather than discrete "levels," Eden Manager presents a continuous, scalable sandbox:

- **Map Size Scaling:**
  - **Tier 1 (16×16):** A small valley. Teaches core mechanics. Goal: awaken 50% of the map and achieve 100 mana/pulse in passive generation.
  - **Tier 2 (32×32):** A larger continent. Introduces distant landmarks and legend opportunities. Goal: similar targets, but larger scale.
  - **Tier 3 (64×64):** A sprawling world with multiple biome zones. Long-term commitment.
  - **Tier 4 (128×128):** Theoretically infinite play. The player chases emergent goals (e.g., "Create 10 Sacred Groves," "Attract all 8 legendary creatures").

#### Map Boundaries & Wrapping
Maps have hard edges (no wrapping). This creates natural "frontiers" where players push outward to expand.

#### Win Condition
There is **no "game over."** However, when the player awakens 100% of the map *and* achieves a combined mana generation 
equal to 50% of the maximum theoretical output (all cells optimized), the game notifies: *"You have awakened the world. 
Eden Manager is restored."* The player may continue indefinitely, pursuing optional goals (e.g., attracting all 
legendary creatures, achieving specific aesthetic patterns).

---

### 4.2 Content Milestones (Progression Markers)

To provide subtle direction without pressure, the game tracks and announces milestones:

| Milestone | Trigger | Notification |
|-----------|---------|--------------|
| **First Pulse** | Awaken your first cell | "The world stirs..." |
| **First Human Settlement** | Humans build first structure | "Life returns." |
| **First Sacred Grove** | Create 3+ adjacent forests | "A sanctuary emerges." |
| **First Creature Sighting** | Spot a legendary creature | "An old power awakens." |
| **Golden Harmony** | Achieve 50 mana/pulse generation | "The world hums with vitality." |
| **Full Awakening** | Reveal 100% of the map | "Eden Manager is restored!" |
| **Collector's Triumph** | Encounter all legendary creatures (design TBD; assume 5–8) | "The ancient ones dance upon your realm." |

---

## 5. Characters

### Player (The Deity)
You have no visible form, but you are a presence: the will that shapes the world. Your only "story" is the question 
you ask yourself: *How do I want this world to look?*

### Humans (Collective)
Humans are not characters but a **living system**. They are unified by simple rules, creating emergent intelligence without 
individual personalities. The joy comes from discovering how they'll respond to your choices.

### Legendary Creatures (TBD)
To be defined during development, but the concept is fixed: these are optional encounters, visual rewards, 
and ecosystem engineers. They are not narrative characters; they are *phenomena*.

---

## 6. Story and Narrative

### Design Philosophy: Environmental Narrative
Eden Manager has **minimal explicit narrative**. There is no script, no dialogue, no authored plot.

Instead, the **story emerges from the landscape you create**. Discovering that humans are drawn to waterfalls might 
inspire the player to intentionally create scenic routes. Finding that certain terrains attract creatures could prompt 
them to "build a shrine in the wilderness just to watch." The narrative is *yours*.

### Optional Elements
- **Discovered Ruins**: Unveiling an Ancient Ruin might include a brief, wordless visual flourish (e.g., ghostly figures walking through the ruins before fading). No text; only atmosphere.
- **Memory Fragments**: When you fulfill human desires enough to collect several fragments, the UI could subtly shift in tone, suggesting that the world's "history" is being rewritten. Again, no explicit story; just a feeling.

### Tone, Not Plot
The world whispers, doesn't shout. You are a detective of emergence, not a consumer of narrative.

---

## 7. Art Direction

### Visual Style
**"Diorama Minimalism"** — A living, miniature world rendered in stylized, geometric forms. Inspired by:
- **Diorama craftsmanship** (miniature landscapes, intentional composition).
- **Paper cutouts** or **voxel-adjacent** aesthetics (simple, readable shapes).
- **Color theory**: Desaturated → Saturated as the world awakens. Mist gray, forest green, water blue, earth brown.

### Viewport & Perspective
- **Primary**: Isometric view (35° angle, approximately). Provides depth and visual appeal while remaining readable for a grid-based game.
- **Fallback for Development**: Top-down for debugging and initial prototyping.
- **Flexibility**: Coordinate system abstracted so perspective can swap without code rewrites.

### Color Palette

| State | Primary Colors | Emotion |
|-------|---|----------|
| **Veiled** | Gray (#AAAAAA) | Mystery, dormancy |
| **Dormant** | Desaturated base colors (e.g., muted green, muted blue) | Waiting, potential |
| **Active** | Saturated, vibrant (e.g., forest green #228B22, water blue #1E90FF) | Life, energy, completion |
| **Mana Glow** | Golden/amber (#FFD700) with light particles | Divine intervention, growth |

### Animation Principles
- **Subtle & Non-Intrusive**: Gentle pulsing, soft glows, slow particle drifts. Nothing flashes or demands attention.
- **Feedback Loop**: When you spend mana, the world visibly responds (terrain shift, glow, creature movement). No invisible actions.
- **Rhythm**: Animations sync to Divine Pulses; the world has a heartbeat.

### UI/HUD Integration
- **Minimal Onscreen Elements**: Only essential info (mana counter, current pulse count, optional milestone ticker).
- **Diegetic Markers**: Human desires appear as floating icons directly over settlements. No external HUD bars; all information is embedded in the world.
- **Accessibility**: High contrast, colorblind-friendly palette options.

---

## 8. Audio Design

### Musical Direction
**Ambient, generative, diorama-inspired.** The score evolves as the world awakens.

### Music Layers
1. **Foundation (Mist Phase)**: A single, lonely piano note; world-building string swells (cello, violin).
2. **Awakening (Early Development)**: Add soft flute, distant bells, subtle wind chimes.
3. **Flourishing (Mid-Game)**: Harp glissandos, choir hums, string orchestration grows richer.
4. **Thriving (Late Game)**: Full ensemble, harmonious, warm. A symphony of life.

### Sound Effects
- **Mana Expenditure**: Soft magical "chime" or resonant hum; pitch varies by action (higher for awakening, deeper for reshaping).
- **Human Construction**: Gentle wooden creaks, stone placements, building "magic" (satisfying and brief, <2 seconds).
- **Creature Appearance**: Unique ambient tone for each creature type (whale song, insect buzz, wind howl). Non-jarring.
- **Divine Pulse**: A subtle "breath"—in-out inhalation sound, barely noticeable but rhythmic, establishing the pulse.

### Voice Acting
None. The world is wordless. Communication is purely visual and sonic.

---

## 9. UI/UX

### Design Principles
- **Invisible When Possible**: The best UI is one the player doesn't think about.
- **Diegetic Information**: Data lives in the world (icons over settlements, glowing mana on structures).
- **Keyboard & Mouse Support**: Click to select terrain and spend mana. Arrow keys or WASD to pan camera.

### Main Screens

#### Playing Field (In-Game)
- **Viewport**: Isometric grid, centered on the map.
- **Mana Display** (top-left): Current / Max mana, regen rate. Simple numerics.
- **Pulse Counter** (top-center, optional): "Pulse #42" – for reference.
- **Milestone Ticker** (bottom-center, subtle): Transient messages ("Golden Harmony reached!").
- **Selection UI** (left sidebar): 
  - **Terrain Palette**: Available terrain types to shape into. 
  - **Divine Powers**: Buttons for active abilities (with cost + cooldown).
  - **Camera Controls** (optional): Zoom, pan (or use scroll/arrow keys).

#### Terrain Selection Panel
When the player wants to reshape a cell:
1. Click on the cell to select it (highlights with golden border).
2. Click on a terrain type in the left sidebar to preview the transformation.
3. Confirm with a second click on the cell or press Enter.
4. Mana deducted; transformation begins.

#### Divine Power Panel
Each power occupies a card slot:
- Icon + Name
- Cost (mana)
- Cooldown status (if active)
- Click to activate, then click target on the map (or auto-execute for area powers).

#### Pause Menu
- Resume Game
- Map Info (total cells awakened, current mana/pulse, creatures spotted, etc.)
- Settings (music volume, effects volume, colorblind mode, camera perspective)
- How to Play (minimalist tutorial)

#### Save/Load
Automatic saving to **Local Storage** (browser). The player never manually saves; the game state persists between 
sessions. Optional: a "New World" button to start a fresh map.

---

## 10. Target Audience & Monetization

### Target Audience
- **Age**: 13+
- **Profile**: Players seeking meditative, low-pressure gaming experiences. Fans of puzzle games, sandbox builders (Minecraft, Stardew Valley), and contemplative indie titles (Journey, Abzu).
- **Playstyle**: Patient, observant, creative. Enjoys emergent gameplay over prescribed objectives.

### Monetization Model
**Free-to-Play, No Monetization.** This is a passion project designed as a pure experience, not a commercial product. 
No ads, no in-app purchases, no premium content. The game exists to be experienced, not exploited.

*(Note: If distribution/hosting costs arise, consider optional "name your price" downloads or Patreon support.)*

---

## 11. Scope & Roadmap

### Version 1.0 (MVP)

#### Core Features (In Scope)
- ✅ 16×16 map with full cell mechanics (Veiled → Dormant → Active).
- ✅ Mana system with regeneration and spending.
- ✅ Adjacency & synergy rules (basic Resonance table).
- ✅ Human behavior system (Necessity + Opportunity).
- ✅ Divine Powers (Blessed Rain, Divine Wind, Fertility Bloom, Veil of Forgetting, Whisper of Memory).
- ✅ Creature system (2–3 placeholder creatures to test mechanics).
- ✅ UI/HUD (mana display, terrain selector, power buttons).
- ✅ Audio (ambient soundtrack, sound effects for actions).
- ✅ Isometric renderer (or top-down, depending on development pace).
- ✅ Persistence (Local Storage save).

#### Out of Scope (V1.0)
- ❌ Multiple map sizes (Tier 2, 3, 4). Start with 16×16.
- ❌ Full creature roster. Use simplified or placeholder creatures.
- ❌ Advanced narrative/ruins discovery system.
- ❌ Full memory fragment system (can ship a simplified version).
- ❌ Mobile optimization (desktop/browser first).
- ❌ Multiplayer or online leaderboards.

### Post-Launch Roadmap

#### Version 1.1
- Expand creature roster (aim for 5–8 distinct creatures).
- Refine synergy table based on player feedback.
- Add Map Size Tier 2 (32×32).

#### Version 1.2
- Memory Fragment system (full implementation).
- Advanced UI polish (accessibility, colorblind modes).
- Hints/tutorial system for new players.

#### Version 2.0 (Longer term)
- Map Tiers 3 & 4 (64×64, 128×128).
- Optional narrative layer (ruins, story fragments—still minimal, player-driven).
- Creature AI refinement.
- Possible mobile port.

---

## 12. Technical Notes

### Development Environment
- **Engine**: Excalibur.js (Web/TypeScript).
- **Rendering**: Canvas 2D or WebGL (Excalibur handles abstraction).
- **State Management**: Grounded in a central Game State object representing the map, creatures, humans, and player mana.
- **Coordinate System**: Abstract grid logic from rendering logic. Use helper functions `logicToScreen(x, y)` and `screenToLogic(screenX, screenY)` for perspective swapping.

### File Structure (Recommended)
```
/src
  /core
    - Grid.ts (map logic, cell states)
    - Mana.ts (resource management)
    - Synergy.ts (adjacency rules)
    - Creature.ts (creature behaviors)
    - Human.ts (human AI)
  /ui
    - HUD.ts (mana display, buttons)
    - TerrainSelector.ts (terrain palette)
  /graphics
    - CellRenderer.ts (Excalibur Actor for cells)
    - Viewport.ts (camera, isometric math)
  /audio
    - SoundManager.ts
    - MusicManager.ts
  /persistence
    - Storage.ts (LocalStorage wrapper)
  - Game.ts (main game loop, Excalibur scene)
  - index.ts (entry point)
```

### Performance Considerations
- **Large Maps**: A 128×128 map = 16,384 cells. Each cell is an Excalibur Actor. Consider pooling or optimizing rendering (quadtrees, culling) for large maps.
- **Synergy Calculation**: Adjacency checks every pulse. Optimize via dirty flagging or spatial partitioning.
- **Creature Movement**: Pathfinding for creatures should be lightweight (simple waypoint following, not A*).

### Browser Compatibility
Target modern browsers (Chrome, Firefox, Safari, Edge from 2021 onward). Fallbacks for older browsers not prioritized.

---

## Conclusion

**Eden Manager** is a meditative god game about emergence, patience, and the joy of creation without pressure. 
It inverts the traditional god-game genre by removing command-and-control in favor of environmental sculpting and observation. 
The goal is to create a space where players feel intelligent, creative, and at peace.

The document above serves as a north star for development. Mechanics, art, and audio all converge on a single emotional 
goal: *watching a gray world bloom into color through your gentle, thoughtful influence.*

---

**Document Version**: 1.0  
**Last Updated**: 2026-04-14  
**Status**: Foundation Design (Ready for Development)
