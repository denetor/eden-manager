# Eden Manager — Development Roadmap

Progress from Excalibur demo → v1.0 Release. Each version adds 1–4 small features with visual/console verification.

**Philosophy:** Build foundations first (Grid → States → Adjacency), then visualization, then interaction, then complex systems. Keep dependencies clean; avoid feature creep.

---

## Phase 1: Grid Foundation (v0.1 – v0.4)

### v0.1 — Grid Creation & Basic Structure
**Goal:** Create the logical grid data structure.

- [ ] `Grid` class: 16×16 2D array of Cell objects
- [ ] `Cell` class: stores position (x, y), type (terrain), basic properties
- [ ] Initialize with default terrain (all Meadow)
- [ ] **Verification:** Log grid to console; print dimensions and sample cells

**Files to create:**
- `src/core/Grid.ts` — Grid management
- `src/core/Cell.ts` — Cell data structure

**Estimated complexity:** Low

---

### v0.2 — Cell States (Veiled, Dormant, Active)
**Goal:** Implement the three cell states and state transitions.

- [ ] `CellState` enum: VEILED, DORMANT, ACTIVE
- [ ] Add `state` property to Cell
- [ ] Add `setState(newState)` method with validation
- [ ] Track state-dependent properties (e.g., inert cells have reduced influence)
- [ ] **Verification:** Log cell state transitions to console; verify state changes are valid

**Files to update:**
- `src/core/Cell.ts` — Add state property and transitions
- `src/core/Grid.ts` — Add state management helpers

**Estimated complexity:** Low

---

### v0.3 — Adjacency Calculation
**Goal:** Implement core adjacency engine (foundation for synergies).

- [ ] `AdjacencyEngine` class: calculate neighbors (4-directional; 8-directional optional)
- [ ] `getActiveNeighbors(cell)` method — return only ACTIVE neighbors
- [ ] `getAdjacentTerrains(cell)` method — return terrain types nearby
- [ ] Handle map boundaries gracefully (no wrapping)
- [ ] **Verification:** Query neighbors of a cell in console; print surrounding terrain types

**Files to create:**
- `src/core/AdjacencyEngine.ts` — Adjacency logic

**Files to update:**
- `src/core/Grid.ts` — Integrate AdjacencyEngine

**Estimated complexity:** Medium (grid math)

---

### v0.4 — Synergy System (Resonance)
**Goal:** Define and calculate cell synergies (no triggering yet, just calculation).

- [ ] `SynergyEngine` class: match adjacency patterns against synergy table
- [ ] `checkSynergies(cell)` method — return matching synergies for a cell
- [ ] Synergy data structure: pattern matcher + result (terrain transform, mana bonus)
- [ ] Implement 3–5 core synergies (e.g., Water + Meadow → Fertile Plain)
- [ ] **Verification:** Call `checkSynergies()` on various cells; log matching patterns to console

**Files to create:**
- `src/core/SynergyEngine.ts` — Synergy matching and data
- `src/core/SynergyTable.ts` — Synergy definitions (JSON-like)

**Files to update:**
- `src/core/Grid.ts` — Integrate SynergyEngine

**Estimated complexity:** Medium (pattern matching logic)

---

## Phase 2: Visualization Layer (v0.5 – v0.7)

### v0.5 — Simple Grid Renderer
**Goal:** Draw the grid on screen (top-down, minimal style).

- [ ] `GridRenderer` class: render grid to Excalibur canvas
- [ ] Each cell = square actor (50px × 50px for 16×16 to fit 800×600)
- [ ] Color-code terrain types (green = Meadow, blue = Water, brown = Mountain, etc.)
- [ ] Static render (no interactivity yet)
- [ ] **Verification:** Launch game; see 16×16 grid of colored squares on screen

**Files to create:**
- `src/graphics/GridRenderer.ts` — Grid rendering logic
- `src/graphics/TerrainColorMap.ts` — Terrain → color mapping

**Files to update:**
- `src/level.ts` — Instantiate GridRenderer in scene
- `src/main.ts` — Adjust viewport if needed

**Estimated complexity:** Medium

---

### v0.6 — Cell State Visualization
**Goal:** Visually distinguish cell states (opacity, saturation, overlay).

- [ ] Update GridRenderer to show state via visual cues:
  - VEILED = gray, low opacity (0.3)
  - DORMANT = desaturated color (0.5 saturation)
  - ACTIVE = full color, full opacity (1.0)
- [ ] Add subtle glow/border for ACTIVE cells
- [ ] **Verification:** Log grid with mixed states; see state transitions reflected on screen

**Files to update:**
- `src/graphics/GridRenderer.ts` — Add state-based styling
- `src/graphics/TerrainColorMap.ts` — Define desaturated variants

**Estimated complexity:** Low

---

### v0.7 — Coordinate System Abstraction Layer
**Goal:** Insert abstraction layer between logic and rendering (prepare for isometric swap).

- [ ] `CoordinateSystem` interface: 
  - `logicToScreen(logicX, logicY): {screenX, screenY}`
  - `screenToLogic(screenX, screenY): {logicX, logicY}`
- [ ] `TopDownCoordinateSystem` implementation (current; simple multiplication)
- [ ] Update GridRenderer to use CoordinateSystem (not direct grid positions)
- [ ] Skeleton for future `IsometricCoordinateSystem` (code stubs, math formulas in comments)
- [ ] **Verification:** Game looks identical to v0.6; coordinate transform works in console

**Files to create:**
- `src/graphics/CoordinateSystem.ts` — Interface & implementations
- `src/graphics/TopDownCoordinateSystem.ts` — Top-down implementation

**Files to update:**
- `src/graphics/GridRenderer.ts` — Use CoordinateSystem for positioning

**Estimated complexity:** Medium (abstraction layer)

---

## Phase 3: Player Interaction (v0.8 – v0.9)

### v0.8 — Click to Select Cell
**Goal:** Allow player to click cells; track selection.

- [ ] Add pointer event handlers to grid cells
- [ ] `SelectedCell` state (track currently selected cell)
- [ ] Visual feedback: highlight selected cell (brighter border, slight zoom)
- [ ] Deselect when clicking empty area
- [ ] **Verification:** Click cells; see highlight change; log selected position to console

**Files to create:**
- `src/input/CellSelector.ts` — Click-to-select logic

**Files to update:**
- `src/graphics/GridRenderer.ts` — Add pointer events to cell actors
- `src/level.ts` — Instantiate CellSelector

**Estimated complexity:** Low–Medium

---

### v0.9 — Selection Info Panel
**Goal:** Display info about selected cell in UI.

- [ ] Create simple UI panel (top-left, 200×200px):
  - Position (x, y)
  - Terrain type
  - Current state
  - Terrain properties (mana generation, fertility, etc.)
- [ ] Update in real-time as selection changes
- [ ] Use Excalibur's built-in text rendering or simple HTML overlay
- [ ] **Verification:** Click different cells; see info panel update

**Files to create:**
- `src/ui/SelectionPanel.ts` — UI for selected cell info

**Files to update:**
- `src/level.ts` — Add SelectionPanel to scene
- `src/input/CellSelector.ts` — Emit selection changed event

**Estimated complexity:** Low

---

## Phase 4: Mana System (v0.10 – v0.12)

### v0.10 — Mana Pool & Display
**Goal:** Implement mana resource and display.

- [ ] `ManaPool` class: tracks current mana, max mana
- [ ] Initialize with 50 base mana, 50 max
- [ ] `spend(amount)` method — deduct mana, prevent overspend
- [ ] `add(amount)` method — gain mana, cap at max
- [ ] Mana display widget (top-left, below selection panel): "Mana: 50/50"
- [ ] **Verification:** Log mana spend/add to console; see widget update

**Files to create:**
- `src/core/ManaPool.ts` — Mana management
- `src/ui/ManaDisplay.ts` — Mana widget

**Files to update:**
- `src/level.ts` — Instantiate ManaPool and ManaDisplay

**Estimated complexity:** Low

---

### v0.11 — Test Mana Spending (Unveil Mock)
**Goal:** Wire mana spending to an action (no actual effect yet, just deduction).

- [ ] Add button to SelectionPanel: "Unveil (costs 5 mana)"
- [ ] Click button → `manaPool.spend(5)` if state is VEILED
- [ ] Display error message if insufficient mana
- [ ] **Verification:** Click "Unveil" repeatedly; see mana decrease, then stop at 0; error message appears

**Files to update:**
- `src/ui/SelectionPanel.ts` — Add Unveil button
- `src/level.ts` — Wire button to mana spend

**Estimated complexity:** Low

---

### v0.12 — Mana Regeneration (Divine Pulse Loop)
**Goal:** Implement the pulse system; regenerate mana over time.

- [ ] `DivineHeart` class: manages pulse timing (configurable interval, default 2 seconds)
- [ ] Emit `onPulse` event every interval
- [ ] On pulse: regenerate 5 mana (or amount based on formula)
- [ ] Display pulse counter: "Pulse #42" (top-center)
- [ ] Log each pulse to console with mana regen amount
- [ ] **Verification:** Watch mana regenerate every 2 seconds; pulse counter increment; console logs

**Files to create:**
- `src/core/DivineHeart.ts` — Pulse timing and event

**Files to update:**
- `src/core/ManaPool.ts` — Integrate with DivineHeart for regen
- `src/ui/ManaDisplay.ts` — Show regen rate
- `src/level.ts` — Instantiate DivineHeart

**Estimated complexity:** Medium (event system)

---

## Phase 5: Terrain Manipulation (v0.13 – v0.15)

### v0.13 — Unveil Mechanic
**Goal:** Implement actual Unveil action (reveal hidden cells).

- [ ] "Unveil" button in SelectionPanel (if cell is VEILED)
- [ ] Click → spend 5 mana + set cell state to DORMANT
- [ ] Visual feedback: cell color changes from gray to desaturated
- [ ] Disable button if insufficient mana or already unveiled
- [ ] **Verification:** Click Unveil; see cell state change; mana decrease; button disable

**Files to update:**
- `src/ui/SelectionPanel.ts` — Wire Unveil to actual logic
- `src/core/Grid.ts` — Add `unveilCell()` method
- `src/graphics/GridRenderer.ts` — Update cell visuals on unveil

**Estimated complexity:** Low

---

### v0.14 — Awaken Mechanic
**Goal:** Implement Awaken action (activate dormant cells).

- [ ] "Awaken" button in SelectionPanel (if cell is DORMANT)
- [ ] Click → spend 10 mana + set cell state to ACTIVE
- [ ] Visual feedback: cell becomes vivid, full color
- [ ] Trigger synergy check on awakened cell (don't apply yet, just log)
- [ ] **Verification:** Awaken a cell; see color change; check console for synergy matches; mana decrease

**Files to update:**
- `src/ui/SelectionPanel.ts` — Add Awaken button
- `src/core/Grid.ts` — Add `awakenCell()` method
- `src/graphics/GridRenderer.ts` — Update cell visuals on awaken
- `src/core/DivineHeart.ts` — Trigger synergy check on pulse (optional early test)

**Estimated complexity:** Medium

---

### v0.15 — Reshape Mechanic & Terrain Palette
**Goal:** Allow terrain transformation; introduce terrain selection.

- [ ] Terrain palette UI (left sidebar): 6–8 terrain buttons (Meadow, Forest, Water, Mountain, Grassland, Ruins, etc.)
- [ ] Select a terrain type → shows preview or highlights button
- [ ] "Reshape" button in SelectionPanel: "Transform to [Selected Terrain] (costs 15 mana)"
- [ ] Click → spend mana + change cell terrain type
- [ ] Cost varies by target rarity (optional: Water = 15, Sacred Grove = 25)
- [ ] **Verification:** Select terrain; click Reshape; cell color changes; mana decreases

**Files to create:**
- `src/ui/TerrainPalette.ts` — Terrain selection buttons
- `src/core/TerrainCost.ts` — Reshape cost table

**Files to update:**
- `src/ui/SelectionPanel.ts` — Reshape button
- `src/core/Grid.ts` — Add `reshapeCell()` method
- `src/level.ts` — Instantiate TerrainPalette

**Estimated complexity:** Medium

---

## Phase 6: Synergy & Automation (v0.16 – v0.17)

### v0.16 — Divine Pulse Triggers Synergies
**Goal:** On each pulse, check and apply synergies.

- [ ] On `DivineHeart.onPulse`, iterate all ACTIVE cells
- [ ] For each cell: run `SynergyEngine.checkSynergies()`
- [ ] If synergies match: apply transformation (e.g., Meadow → Fertile Plain)
- [ ] Log synergy triggers to console
- [ ] **Verification:** Arrange Water + Meadow adjacently, awaken both, wait for pulse; see Meadow transform; console logs synergy

**Files to create:**
- `src/core/SynergyResolver.ts` — Apply synergy results

**Files to update:**
- `src/core/DivineHeart.ts` — Call synergy check on pulse
- `src/core/SynergyEngine.ts` — Return detailed synergy match info
- `src/graphics/GridRenderer.ts` — Re-render after synergy application

**Estimated complexity:** Medium

---

### v0.17 — Mana Generation from Terrain
**Goal:** Certain terrains generate mana passively.

- [ ] Terrain properties: `manaGeneration` (default 0 for most)
- [ ] Fertile Plain = 2 mana/pulse, Sacred Grove = 3 mana/pulse, etc.
- [ ] On each pulse: sum mana generation from all ACTIVE cells
- [ ] Add to ManaPool
- [ ] Display breakdown in ManaDisplay: "Regen: Base 5 + Terrain 7 = 12 mana/pulse"
- [ ] **Verification:** Create Fertile Plain cells; watch mana regen increase; console logs breakdown

**Files to update:**
- `src/core/Cell.ts` — Add `manaGeneration` property
- `src/core/ManaPool.ts` — Calculate total regen
- `src/ui/ManaDisplay.ts` — Show regen sources
- `src/core/DivineHeart.ts` — Trigger terrain mana regen on pulse

**Estimated complexity:** Low–Medium

---

## Phase 7: Human System Foundation (v0.18 – v0.20)

### v0.18 — Human Settlement Placement
**Goal:** Place human communities on cells; track population.

- [ ] `Human` class: stores position, needs (water, food), status (Active, Dormant)
- [ ] "Place Humans" button in SelectionPanel (cost: free for now, for testing)
- [ ] Click → spawn humans on selected cell
- [ ] Visual: small icon or dot on cell to indicate humans present
- [ ] **Verification:** Place humans on multiple cells; see icons; log to console

**Files to create:**
- `src/core/Human.ts` — Human data & behavior
- `src/core/HumanManager.ts` — Track all humans
- `src/graphics/HumanRenderer.ts` — Draw human indicators

**Files to update:**
- `src/level.ts` — Instantiate HumanManager and HumanRenderer
- `src/ui/SelectionPanel.ts` — Add "Place Humans" button
- `src/graphics/GridRenderer.ts` — Composite with HumanRenderer

**Estimated complexity:** Medium

---

### v0.19 — Human Necessity Rules
**Goal:** Humans require water & food; enter dormancy if unmet.

- [ ] On each pulse: for each human group, check:
  - Water within 3-cell radius (Freshwater terrain)
  - Food within 2-cell radius (Meadow, Fertile Plain)
- [ ] If unmet: set status to Dormant (visual: grayed out)
- [ ] If met: set status to Active (visual: full color)
- [ ] Log human status changes to console
- [ ] **Verification:** Place humans in desert; see them go dormant; place water nearby on pulse; see activate

**Files to update:**
- `src/core/HumanManager.ts` — Implement necessity check
- `src/core/DivineHeart.ts` — Trigger human update on pulse
- `src/graphics/HumanRenderer.ts` — Render dormant vs active state

**Estimated complexity:** Medium

---

### v0.20 — Human Auto-Building
**Goal:** Humans automatically build structures based on surroundings.

- [ ] Define human structures: Farm, Mill, Shrine, Tower, etc.
- [ ] Trigger conditions (e.g., "If Fertile Plain + humans + Active, build Farm")
- [ ] On pulse: check all human groups; apply building rules
- [ ] Each structure has mana generation bonus (e.g., Farm = +1 mana/pulse)
- [ ] Visual: place structure marker on cell or add to human group indicator
- [ ] Log building events to console
- [ ] **Verification:** Awaken Fertile Plain + Water + Meadow; place humans; watch them build on pulse; mana regen increases

**Files to create:**
- `src/core/HumanStructure.ts` — Structure data
- `src/core/BuildingRules.ts` — Trigger conditions for structures

**Files to update:**
- `src/core/HumanManager.ts` — Implement building logic
- `src/core/DivineHeart.ts` — Trigger building check on pulse
- `src/graphics/HumanRenderer.ts` — Show structures

**Estimated complexity:** Medium

---

## Phase 8: Creatures (v0.21 – v0.22)

### v0.21 — Creature Spawning
**Goal:** Legendary creatures spawn in matching habitats.

- [ ] `Creature` class: stores position, type (e.g., "Stone Colossus"), habitat requirement
- [ ] `CreatureManager` class: track creatures
- [ ] Define 2–3 creatures with spawn conditions:
  - Stone Colossus: spawn in cells with 3+ adjacent Mountains
  - Luminous Swarm: spawn in Sacred Groves
  - Water Serpent: spawn in cells with Water
- [ ] On each pulse: check spawn conditions; create creatures
- [ ] **Verification:** Create matching habitat; observe creature spawn on pulse; log to console

**Files to create:**
- `src/core/Creature.ts` — Creature data
- `src/core/CreatureManager.ts` — Manage creatures
- `src/core/CreatureSpawner.ts` — Spawn logic
- `src/graphics/CreatureRenderer.ts` — Draw creature indicators

**Files to update:**
- `src/level.ts` — Instantiate CreatureManager
- `src/core/DivineHeart.ts` — Trigger creature spawn on pulse
- `src/graphics/GridRenderer.ts` — Composite with CreatureRenderer

**Estimated complexity:** Medium

---

### v0.22 — Creature Movement & Effects
**Goal:** Creatures move each pulse; trigger passive effects.

- [ ] On each pulse: move creatures according to simple rules (e.g., random walk, drift toward high-harmony cells)
- [ ] Define creature effects:
  - Stone Colossus: transforms Mountain to Foothill (buildable)
  - Water Serpent: hydrates adjacent cells
  - Luminous Swarm: increases mana generation on resting cell
- [ ] Apply effects on destination cell
- [ ] Log creature movement to console
- [ ] **Verification:** Watch creatures move; see effects trigger (terrain transform, mana increase)

**Files to update:**
- `src/core/Creature.ts` — Add movement behavior
- `src/core/CreatureManager.ts` — Move creatures on pulse
- `src/core/DivineHeart.ts` — Trigger creature update on pulse
- `src/graphics/CreatureRenderer.ts` — Animate movement

**Estimated complexity:** Medium–High

---

## Phase 9: Divine Powers (v0.23 – v0.28)

### v0.23 — Divine Powers UI
**Goal:** UI panel to select and cast divine powers.

- [ ] Powers panel (left sidebar, below Terrain Palette):
  - 5 buttons: Blessed Rain, Divine Wind, Fertility Bloom, Veil of Forgetting, Whisper of Memory
  - Show cost, cooldown, and availability
- [ ] Select a power → highlight it
- [ ] Instructions in console or help text
- [ ] **Verification:** Click power button; see highlight; log selection to console

**Files to create:**
- `src/ui/PowersPanel.ts` — Power selection UI
- `src/core/DivinePowerManager.ts` — Track power state (cooldown, availability)

**Files to update:**
- `src/level.ts` — Instantiate PowersPanel and DivinePowerp
ageManager

**Estimated complexity:** Low–Medium

---

### v0.24 — Blessed Rain Power
**Goal:** Implement first divine power (hydrate 3×3 area).

- [ ] Select "Blessed Rain" → select target cell
- [ ] On target: hydrate 3×3 area (set grassland/ash to meadow/fertile plain)
- [ ] Cost: 25 mana
- [ ] Cooldown: 2 pulses
- [ ] **Verification:** Cast power; see 3×3 area transform; mana decrease; cooldown active

**Files to create:**
- `src/core/powers/BlessedRain.ts` — Power implementation

**Files to update:**
- `src/core/DivinePowerp
ageManager.ts` — Register power, track cooldown
- `src/input/CellSelector.ts` — Allow target selection for powers
- `src/ui/PowersPanel.ts` — Show power availability

**Estimated complexity:** Medium

---

### v0.25 — Divine Wind Power
**Goal:** Implement second power (move creature or fog).

- [ ] Select "Divine Wind" → select target creature/fog → select direction
- [ ] Move target 1–3 cells in direction
- [ ] Cost: 20 mana
- [ ] Cooldown: 1 pulse
- [ ] **Verification:** Cast power; see creature/fog move; mana decrease

**Files to create:**
- `src/core/powers/DivineWind.ts`

**Files to update:**
- `src/core/DivinePowerp
ageManager.ts`
- `src/core/CreatureManager.ts` — Allow manual creature movement
- `src/input/CellSelector.ts` — Handle direction input

**Estimated complexity:** Medium

---

### v0.26 — Fertility Bloom Power
**Goal:** Implement third power (trigger synergies immediately).

- [ ] Select "Fertility Bloom" → select target cell
- [ ] Immediately trigger all synergies as if a pulse occurred
- [ ] Cost: 30 mana
- [ ] Cooldown: 3 pulses
- [ ] **Verification:** Cast power; see synergies apply instantly; mana decrease; console logs synergies

**Files to create:**
- `src/core/powers/FertilityBloom.ts`

**Files to update:**
- `src/core/DivinePowerp
ageManager.ts`
- `src/core/SynergyResolver.ts` — Expose synergy trigger method

**Estimated complexity:** Low

---

### v0.27 — Veil of Forgetting Power
**Goal:** Implement fourth power (undo reshape).

- [ ] Select "Veil of Forgetting" → select target cell
- [ ] Revert cell to original dormant state; refund 50% of reshape cost (optional)
- [ ] Cost: 20 mana
- [ ] Cooldown: 1 pulse
- [ ] **Verification:** Cast power; see cell revert; mana decrease and gain (if refund enabled)

**Files to create:**
- `src/core/powers/VeilOfForgetting.ts`
- `src/core/CellHistory.ts` — Track original cell state

**Files to update:**
- `src/core/DivinePowerp
ageManager.ts`
- `src/core/Grid.ts` — Add `revertCell()` method

**Estimated complexity:** Low–Medium

---

### v0.28 — Whisper of Memory Power
**Goal:** Implement fifth power (reveal ruins in area).

- [ ] Select "Whisper of Memory" → select target area (5×5)
- [ ] Reveal all hidden ruins in area (transform VEILED Ruins to DORMANT Ruins)
- [ ] Cost: 15 mana
- [ ] Cooldown: 5 pulses
- [ ] **Verification:** Cast power; see ruins reveal in area; mana decrease

**Files to create:**
- `src/core/powers/WhisperOfMemory.ts`

**Files to update:**
- `src/core/DivinePowerp
ageManager.ts`
- `src/core/Grid.ts` — Add terrain-specific operations

**Estimated complexity:** Low

---

## Phase 10: Human Desires (v0.29 – v0.30)

### v0.29 — Desire Icon System
**Goal:** Humans express desires; floating icons appear.

- [ ] Define desire types: Snowflake, Golden Wheat, Open Eye, Flame, Bell, Book
- [ ] On pulse: randomly (or based on conditions) assign desire to human group
- [ ] Visual: small icon floats above human group
- [ ] Icon persists for N pulses or until fulfilled
- [ ] **Verification:** Wait for desires to appear above humans; see icons float; log desire assignment

**Files to create:**
- `src/core/HumanDesire.ts` — Desire data & logic
- `src/graphics/DesireRenderer.ts` — Draw desire icons

**Files to update:**
- `src/core/HumanManager.ts` — Assign desires on pulse
- `src/graphics/HumanRenderer.ts` — Composite with DesireRenderer
- `src/level.ts` — Register DesireRenderer

**Estimated complexity:** Medium

---

### v0.30 — Desire Fulfillment & Memory Fragments
**Goal:** Fulfill desires; earn Memory Fragments (upgrades).

- [ ] Define fulfillment conditions for each desire (e.g., "Snowflake" → place Mountain nearby)
- [ ] On pulse: check if conditions met for active desires
- [ ] If fulfilled: remove desire + award Memory Fragment
- [ ] Memory Fragment = permanent passive bonus (e.g., "+1 mana/pulse from mills" or "All forests spread +1 cell/pulse")
- [ ] Display collected fragments in UI (bottom-right panel)
- [ ] **Verification:** Arrange to fulfill desire; watch it disappear on pulse; see fragment awarded; log bonus applied

**Files to create:**
- `src/core/MemoryFragment.ts` — Fragment data & effects
- `src/core/MemoryFragmentManager.ts` — Track collected fragments
- `src/ui/MemoryFragmentPanel.ts` — Display fragments

**Files to update:**
- `src/core/HumanManager.ts` — Check fulfillment conditions on pulse
- `src/core/ManaPool.ts` — Apply fragment bonuses to regen
- `src/level.ts` — Instantiate MemoryFragmentManager and UI

**Estimated complexity:** Medium–High

---

## Phase 11: Persistence (v0.31 – v0.32)

### v0.31 — Save/Load to LocalStorage
**Goal:** Save and load complete game state.

- [ ] `StorageManager` class: serialize/deserialize grid, mana, creatures, humans, powers, fragments
- [ ] "Save" & "Load" buttons (optional: auto-save on each pulse)
- [ ] On "Save": store JSON in LocalStorage under key "eden-manager-save"
- [ ] On "Load": restore all state from storage
- [ ] **Verification:** Play, save, reload page, load game; verify all state restored (mana, cells, creatures, humans)

**Files to create:**
- `src/persistence/StorageManager.ts` — Save/load logic
- `src/ui/SaveLoadPanel.ts` — UI buttons

**Files to update:**
- `src/level.ts` — Wire Save/Load buttons
- All core classes (Grid, ManaPool, HumanManager, CreatureManager, etc.) — add `serialize()` / `deserialize()` methods

**Estimated complexity:** Medium

---

### v0.32 — Auto-Save on Pulse
**Goal:** Game saves automatically every N pulses.

- [ ] Auto-save interval: every 5 pulses (configurable)
- [ ] Silent save (no UI notification, or subtle "saved" message)
- [ ] On-page-reload, game auto-loads last save
- [ ] **Verification:** Play, close browser, reopen; game state restored; check console for save timestamps

**Files to update:**
- `src/persistence/StorageManager.ts` — Add auto-save scheduling
- `src/core/DivineHeart.ts` — Trigger auto-save every N pulses
- `src/ui/SaveLoadPanel.ts` — Show save indicator

**Estimated complexity:** Low

---

## Phase 12: Polish & Release (v0.33 – v1.0)

### v0.33 — Ambient Soundtrack Layer System
**Goal:** Implement evolving soundtrack (music grows richer as world awakes).

- [ ] 4–5 audio layers (piano base, strings, flute, choir, percussion)
- [ ] Each layer adds/fades based on world state (awakened cells %, mana generation rate)
- [ ] Seamless looping; no jarring transitions
- [ ] **Verification:** Play game; hear music layers add gradually as you develop world; listen to evolution

**Files to create:**
- `src/audio/MusicManager.ts` — Layer mixing & fade logic
- `src/audio/layers/` — Audio files (or placeholder silence for now)

**Files to update:**
- `src/level.ts` — Instantiate MusicManager
- `src/core/DivineHeart.ts` — Trigger music updates on pulse

**Estimated complexity:** Medium

---

### v0.34 — Sound Effects & Polish
**Goal:** Add sfx for key actions (mana spend, synergy trigger, creature spawn, building).

- [ ] Mana spend: soft chime (pitch varies by cost)
- [ ] Synergy trigger: harmonic hum
- [ ] Creature spawn: ambient tone (unique per creature type)
- [ ] Building: construction creaks + magic sparkle
- [ ] Divine Power cast: dramatic whoosh
- [ ] Toggle sfx on/off in settings
- [ ] **Verification:** Perform actions; hear corresponding sfx; adjust volume

**Files to create:**
- `src/audio/SoundEffectManager.ts` — SFX playback
- `src/ui/SettingsPanel.ts` — Audio toggles

**Files to update:**
- All systems — call SoundEffectManager on key events

**Estimated complexity:** Medium

---

### v0.35 — Animation & Particle Effects
**Goal:** Add visual polish (terrain glow on transform, particles on synergy, creature glow).

- [ ] Terrain transform: flash or color transition
- [ ] Synergy trigger: particle burst at center
- [ ] Creature glow: subtle pulsing halo
- [ ] Divine Power cast: visual effect at target
- [ ] Human building: small construction particles
- [ ] **Verification:** Perform actions; see animations & particles; game feels more alive

**Files to create:**
- `src/graphics/ParticleEffects.ts` — Particle system integration
- `src/graphics/Animations.ts` — Reusable animations

**Files to update:**
- `src/graphics/GridRenderer.ts` — Trigger animations on events
- `src/graphics/CreatureRenderer.ts` — Add creature glow
- All event systems — emit animation events

**Estimated complexity:** Medium

---

### v0.36 — UI Polish & Accessibility
**Goal:** Refine UI; add colorblind mode; improve readability.

- [ ] High contrast mode toggle
- [ ] Colorblind-friendly palette (deuteranopia, protanopia variants)
- [ ] Larger font option
- [ ] Improved button tooltips (hold to see help text)
- [ ] Keyboard shortcuts (arrow keys to pan, numbers 1–5 for terrain select, Space to cast selected power)
- [ ] **Verification:** Toggle modes; verify readability; test keyboard controls

**Files to update:**
- `src/graphics/TerrainColorMap.ts` — Colorblind palettes
- `src/ui/SettingsPanel.ts` — Accessibility options
- `src/input/InputManager.ts` — Keyboard shortcuts

**Estimated complexity:** Medium

---

### v0.37 — Tutorial & Help System
**Goal:** Guide new players through core mechanics.

- [ ] Interactive tutorial (first 5 minutes):
  - Explain grid, cells, states
  - Teach Unveil / Awaken / Reshape
  - Show how to place humans
  - Introduce mana and pulse
- [ ] Help panel accessible from pause menu
- [ ] Contextual hints (e.g., "Tip: Place water near humans to make them build farms")
- [ ] **Verification:** New player can complete tutorial without external help; understands core loop

**Files to create:**
- `src/ui/Tutorial.ts` — Tutorial system
- `src/ui/HelpPanel.ts` — Help reference

**Files to update:**
- `src/level.ts` — Integrate tutorial
- First-time-load detection (LocalStorage flag)

**Estimated complexity:** Medium–High (design-dependent)

---

### v0.38 — Release Candidate & Testing
**Goal:** Final polish, bug fixes, edge case testing.

- [ ] Full playtest: 16×16 map, progression from start to 100% awakening
- [ ] Verify all features work (mana, synergies, humans, creatures, powers, desires, fragments, saves)
- [ ] Performance: no lag on 16×16 grid with full activity
- [ ] Accessibility: colorblind modes readable, keyboard shortcuts work, UI responsive
- [ ] Audio: no clipping, smooth mixing, volume balanced
- [ ] **Verification:** Complete full playthrough; all systems functioning

**Estimated complexity:** High (comprehensive testing)

---

## v1.0 — Release
**Goal:** Public launch of Eden Manager (base game).

- [ ] All features from v0.1 to v0.38 complete and polished
- [ ] 16×16 map fully playable
- [ ] No critical bugs
- [ ] Documentation complete (README, How to Play, etc.)
- [ ] Deployed to web (itch.io, personal site, or equivalent)
- [ ] **Verification:** Players can enjoy a complete, meditative, bug-free experience

**Estimated complexity:** Final release gate (all previous work validated)

---

## Post-Launch Roadmap (Future)

### v1.1 — Isometric Perspective
- Swap renderer from top-down to isometric via coordinate system

### v1.2 — Map Tier 2 (32×32)
- Larger map, more complex scenarios
- All v1.0 systems scale smoothly

### v1.3 — Memory Fragment System Expansion
- More fragments, more diverse bonuses
- Stacking effects

### v1.4 — Larger Maps & Creature Roster
- 64×64 & 128×128 maps
- 5–8 legendary creatures
- Optional narrative layer (ruins discovery, story fragments)



---

## Notes for Implementation

**Keep in mind:**
- Each version should be **playable/testable** after completion (visual or console verification)
- **Dependencies flow top-down**: Grid → States → Adjacency → Synergy → Mana → Rendering → Interaction
- **Decouple early**: CoordinateSystem (v0.7), StorageManager (v0.31) are abstraction layers that prevent future refactoring
- **Test regularly**: Write simple Playwright tests for critical paths (mana spend, synergy trigger, save/load)
- **No feature creep**: Stick to 1–4 features per version; don't add "nice-to-haves" mid-version

---

**Total Versions:** v0.1 → v0.38 + v1.0 = **39 milestones**

**Estimated Development Timeline (rough):**
- Phases 1–3 (v0.1–v0.9): 2–3 weeks (foundation + visualization + interaction)
- Phases 4–6 (v0.10–v0.17): 2–3 weeks (mana + terrain + synergy)
- Phases 7–9 (v0.18–v0.28): 3–4 weeks (humans + creatures + powers)
- Phases 10–12 (v0.29–v1.0): 2–3 weeks (desires + persistence + polish)
- **Total: 9–13 weeks** (assuming ~10–15 hours/week)

*(Timeline is speculative; adjust based on actual development pace)*

---

**Document Version:** 1.0  
**Created:** 2026-04-15  
**Status:** Ready for Development