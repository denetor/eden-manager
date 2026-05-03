# Eden Manager — Development Roadmap

Progress from Excalibur demo → v1.0 Release. Each version adds 1–4 small features with visual/console verification.

**Philosophy:** Build foundations first (Grid → States → Adjacency), then visualization, then interaction, then complex systems. Keep dependencies clean; avoid feature creep.

---

## Phase 1: Grid Foundation & Isometric Rendering (v0.1 – v0.5)

### v0.1 — Grid Creation & Basic Structure
**Goal:** Create the logical grid data structure.

- [x] `Grid` class: 16×16 2D array of Cell objects
- [x] `Cell` class: stores position (x, y), type (terrain), basic properties
- [x] Initialize with default terrain (all Meadow)
- [x] **Verification:** Log grid to console; print dimensions and sample cells

**Files to create:**
- `src/core/Grid.ts` — Grid management
- `src/core/Cell.ts` — Cell data structure

**Estimated complexity:** Low

---

### v0.2 — Isometric Coordinate System & IsometricMap Integration
**Goal:** Implement isometric rendering with coordinate abstraction and camera controls.

- [x] `CoordinateSystem` interface:
  - `logicToScreen(logicX, logicY): {screenX, screenY}`
  - `screenToLogic(screenX, screenY): {logicX, logicY}`
- [x] `TopDownCoordinateSystem` implementation (current; simple multiplication)
- [] `IsometricCoordinateSystem` implementation (full 35° isometric math):
  - Tile size: 32px (base for both logic and screen)
  - Account for camera offset
- [x] Replace `TileMap` with `IsometricMap` from Excalibur API
  - Configure with 16×16 grid, 32px tile dimensions
  - Populate tiles with colored rectangles (same color logic as before)
- [x] Update input handling:
  - `screenToGridCoordinates` now uses `IsometricCoordinateSystem.screenToLogic()`
  - Support click-to-select on isometric tiles
- [x] Camera & pan/zoom support:
  - Arrow keys or WASD to pan camera
  - Mouse wheel (or +/- keys) to zoom in/out (1.0x to 2.0x range)
  - Keep camera bounds within map
- [x] Update visual actors:
  - `HighlightedCell` uses `IsometricCoordinateSystem` for positioning
  - `GridBackground` updated for isometric (or deferred to v0.8)
- [x] **Verification:** 
  - Launch game; see 16×16 grid rendered in isometric (35° angle)
  - Click cells in isometric view; selection works correctly
  - Pan with arrow keys; zoom with +/- keys
  - Coordinate transform verified in console (`logicToScreen` / `screenToLogic`)

**Files to create:**
- `src/graphics/coordinate-system.ts` — CoordinateSystem interface
- `src/graphics/topdown-coordinate-system.ts` — TopDown implementation
- `src/graphics/isometric-coordinate-system.ts` — Isometric implementation with IsometricMap integration
- `src/input/camera-controller.ts` — Pan/zoom logic

**Files to update:**
- `src/scenes/game.scene.ts` — Replace TileMap with IsometricMap; integrate CoordinateSystem
- `src/ui/grid/highlighted-cell.ts` — Use CoordinateSystem for positioning
- `src/graphics/tilemap-renderer.service.ts` — Use CoordinateSystem for tile positioning
- `src/main.ts` — Adjust viewport if needed (may stay 800×600)

**Estimated complexity:** High (isometric math + Excalibur IsometricMap API + camera system)

---

### v0.3 — Cell States (Veiled, Dormant, Active)
**Goal:** Implement the three cell states and state transitions.

- [x] `CellState` enum: VEILED, DORMANT, ACTIVE
- [x] Add `state` property to Cell
- [x] Add `setState(newState)` method with validation
- [x] Track state-dependent properties (e.g., inert cells have no influence)
- [x] **Verification:** Log cell state transitions to console; verify state changes are valid

**Files to update:**
- `src/core/grid/grid.model.ts` — Add state property and transitions
- `src/core/grid/grid.service.ts` — Add state management helpers

**Estimated complexity:** Low

---

### v0.4 — Adjacency Calculation
**Goal:** Implement core adjacency engine (foundation for synergies).

- [x] `AdjacencyEngine` class: calculate neighbors (4-directional; 8-directional optional)
- [x] `getActiveNeighbors(cell)` method — return only ACTIVE neighbors
- [x] `getAdjacentTerrains(cell)` method — return terrain types nearby
- [x] Handle map boundaries gracefully (no wrapping)
- [x] **Verification:** Query neighbors of a cell in console; print surrounding terrain types

**Files to create:**
- `src/core/adjacency/adjacency.service.ts` — Adjacency logic

**Files to update:**
- `src/core/grid/grid.service.ts` — Integrate adjacency engine

**Estimated complexity:** Medium (grid math)

---

### v0.5 — Synergy System (Resonance)
**Goal:** Define and calculate cell synergies (no triggering yet, just calculation).

- [x] `SynergyEngine` class: match adjacency patterns against synergy table
- [x] `checkSynergies(cell)` method — return matching synergies for a cell
- [x] Synergy data structure: pattern matcher + result (terrain transform, mana bonus)
- [x] Implement 3–5 core synergies (e.g., Water + Meadow → Fertile Plain)
- [x] **Verification:** Call `checkSynergies()` on various cells; log matching patterns to console

**Files to create:**
- `src/core/synergy/synergy.model.ts` — Synergy data structure
- `src/core/synergy/synergy.table.ts` — Synergy definitions (JSON-like)

**Files to update:**
- `src/core/synergy/synergy.service.ts` — Integrate synergy matching logic
- `src/core/grid/grid.service.ts` — Integrate SynergyEngine

**Estimated complexity:** Medium (pattern matching logic)

---

## Phase 2: Visualization Layer (v0.6 – v0.8)

### v0.6 — Cell State Visualization
**Goal:** Visually distinguish cell states (opacity, saturation, overlay) in isometric view.

- [x] Update IsometricMap tile rendering to show state via visual cues:
  - VEILED = gray, low opacity (0.3)
  - DORMANT = desaturated color (0.5 saturation)
  - ACTIVE = full color, full opacity (1.0)
- [x] Add subtle glow/border for ACTIVE cells in isometric
- [x] **Verification:** Log grid with mixed states; see state transitions reflected on isometric screen

**Files to update:**
- `src/graphics/isometric-coordinate-system.ts` — Add state-based tile styling
- `src/graphics/tilemap-renderer.service.ts` — Update tile colors for states

**Estimated complexity:** Low

---

### v0.7 — Grid Background Overlay (Isometric) (will not do)
**Goal:** Render optional grid background/grid lines for isometric view.

- [x] Update `GridBackground` actor to work with isometric coordinates
- [x] Draw subtle grid lines or checker pattern in isometric perspective
- [x] Optional: toggle grid on/off with key (e.g., 'G')
- [x] **Verification:** See isometric grid pattern on screen; verify no visual clipping with tiles

**Files to update:**
- `src/ui/grid/grid-background.ts` — Support isometric rendering

**Estimated complexity:** Low

---

### v0.8 — Highlighted Cell in Isometric
**Goal:** Ensure HighlightedCell selection indicator works correctly in isometric.

- [x] `HighlightedCell` repositioned using `IsometricCoordinateSystem`
- [x] Highlight border/glow adapts to isometric tile shape
- [x] Visual feedback remains clear in isometric view
- [x] **Verification:** Click cells; highlight appears in correct isometric position

**Files to update:**
- `src/ui/grid/highlighted-cell.ts` — Use IsometricCoordinateSystem for positioning
- `src/scenes/game.scene.ts` — Pass CoordinateSystem reference to HighlightedCell

**Estimated complexity:** Low

---

## Phase 3: Player Interaction (v0.9 – v0.10)

### v0.9 — Click to Select Cell (Isometric)
**Goal:** Allow player to click cells in isometric view; track selection.

- [x] Add pointer event handlers to IsometricMap tiles
- [x] `SelectedCell` state (track currently selected cell)
- [x] Visual feedback: highlight selected cell in isometric view
- [x] Deselect when clicking empty area or outside map
- [x] **Verification:** Click isometric cells; see highlight change; log selected position to console

**Files to create:**
- `src/input/cell-selector.ts` — Click-to-select logic (updated for isometric)

**Files to update:**
- `src/graphics/isometric-coordinate-system.ts` — Support pointer-to-logic conversion
- `src/scenes/game.scene.ts` — Integrate CellSelector

**Estimated complexity:** Low–Medium

---

### v0.10 — Selection Info Panel (Isometric)
**Goal:** Display info about selected cell in UI (unchanged from old v0.9, now on isometric).

- [x] Create simple UI panel (top-left, 200×200px):
  - Position (x, y)
  - Terrain type
  - Current state
  - Terrain properties (mana generation, fertility, etc.)
- [x] Update in real-time as selection changes
- [x] Use Excalibur's built-in text rendering or HTML overlay
- [x] **Verification:** Click different isometric cells; see info panel update

**Files to update:**
- `src/ui/hud/cell-info.ts` — Already exists; verify it works with new CoordinateSystem
- `src/scenes/game.scene.ts` — Already integrated

**Estimated complexity:** Low

---

## Phase 4: Mana System (v0.11 – v0.13)

### v0.11 — Mana Pool & Display
**Goal:** Implement mana resource and display.

- [x] `ManaService` class: tracks current mana, max mana (likely already exists)
- [x] Initialize with 50 base mana, 100 max
- [x] `spend(amount)` method — deduct mana, prevent overspend
- [x] `add(amount)` method — gain mana, cap at max
- [x] Mana display widget (top-left): "Mana: 50/100"
- [x] **Verification:** Log mana spend/add to console; see widget update

**Files to update:**
- `src/core/mana/mana.service.ts` — Already exists; verify interface
- `src/ui/hud/mana-display.ts` — Already exists; verify it works

**Estimated complexity:** Low

---

### v0.12 — Test Mana Spending (Unveil Mock)
**Goal:** Wire mana spending to an action (no actual effect yet, just deduction).

- [x] Add "Unveil" action to cell (keyboard: Space, or via scene.attemptUnveil)
- [x] Click/press → `manaService.spend(10)` if state is VEILED
- [x] Display feedback message if insufficient mana
- [x] **Verification:** Unveil repeatedly; see mana decrease; error message on insufficient mana

**Files to update:**
- `src/scenes/game.scene.ts` — Already has attemptUnveil method
- `src/ui/feedback-message.ts` — Already exists for feedback

**Estimated complexity:** Low

---

### v0.13 — Mana Regeneration (Divine Pulse Loop)
**Goal:** Implement the pulse system; regenerate mana over time.

- [x] `GameEngine` class: manages pulse timing and game state (likely exists)
- [x] Emit `onPulse` event every ~500ms interval
- [x] On pulse: regenerate mana based on formula
- [x] Display pulse counter in console (will not do)
- [x] Log each pulse to console with mana regen amount (will not do)
- [x] **Verification:** Watch mana regenerate continuously; pulse events firing

**Files to update:**
- `src/core/game-engine.service.ts` — Already exists; verify pulse logic
- `src/scenes/game.scene.ts` — Trigger divinePulse (already has triggerDivinePulse method)

**Estimated complexity:** Medium (event system)

---

## Phase 5: Terrain Manipulation (v0.14 – v0.16)

### v0.14 — Unveil Mechanic
**Goal:** Implement actual Unveil action (reveal hidden cells).

- [x] "Unveil" action (Space key, or attemptUnveil in scene)
- [x] Press/call → spend 10 mana + set cell state to DORMANT
- [x] Visual feedback: cell color changes from gray to desaturated in isometric view
- [x] **Verification:** Unveil a cell; see state change; mana decrease

**Files to update:**
- `src/scenes/game.scene.ts` — Already has attemptUnveil method
- `src/core/grid/grid.service.ts` — Add/verify `unveilCell()` method
- `src/graphics/isometric-coordinate-system.ts` — Ensure state-based coloring reflects unveil

**Estimated complexity:** Low

---

### v0.15 — Awaken Mechanic
**Goal:** Implement Awaken action (activate dormant cells).

- [x] "Awaken" action (keyboard: 'A', or via scene)
- [x] Press → spend 10 mana + set cell state to ACTIVE
- [x] Visual feedback: cell becomes vivid, full color in isometric
- [x] Trigger synergy check on awakened cell (log to console) (will not do, activated cell is marked dirty and synergy checked next pulse)
- [x] **Verification:** Awaken a cell; see color change; check console for synergy matches; mana decrease

**Files to update:**
- `src/scenes/game.scene.ts` — Add keyboard binding for awaken
- `src/core/grid/grid.service.ts` — Add/verify `awakenCell()` method
- `src/core/game-engine.service.ts` — Trigger synergy check

**Estimated complexity:** Medium

---

### v0.16 — Reshape Mechanic
**Goal:** Allow terrain transformation; wire to scene input.

- [x] Reshape action (keyboard: R for Forest, W for Water, M for Mountain, etc.)
- [x] Press → spend 10 mana + change cell terrain type
- [x] Visual feedback: cell color changes in isometric view
- [x] **Verification:** Press R/W/M; see cell terrain change; mana decreases

**Files to update:**
- `src/scenes/game.scene.ts` — Already has keyboard bindings for reshape
- `src/core/grid/grid.service.ts` — Add/verify `reshapeCell()` method

**Estimated complexity:** Medium

---

## Phase 6: Synergy & Automation (v0.17 – v0.18)

### v0.17 — Divine Pulse Triggers Synergies
**Goal:** On each pulse, check and apply synergies.

- [x] On `gameEngine.divinePulse()`, iterate all ACTIVE cells
- [x] For each cell: run `synergyEngine.checkSynergies()`
- [x] If synergies match: apply transformation (e.g., Meadow → Fertile Plain)
- [x] Log synergy triggers to console
- [x] **Verification:** Arrange Water + Meadow adjacently, awaken both, trigger pulse; see Meadow transform; console logs synergy

**Files to update:**
- `src/core/synergy/synergy.service.ts` — Return detailed synergy match info
- `src/core/game-engine.service.ts` — Call synergy check on pulse
- `src/graphics/tilemap-renderer.service.ts` — Re-render after synergy application

**Estimated complexity:** Medium

---

### v0.18 — Mana Generation from Terrain
**Goal:** Certain terrains generate mana passively.

- [x] Terrain properties: `manaGeneration` (default 0 for most)
- [x] Fertile Plain = 1 mana/pulse, Sacred Grove = 2 mana/pulse, etc.
- [x] On each pulse: sum mana generation from all ACTIVE cells
- [x] Add to ManaService
- [x] Display in ManaDisplay (if already showing regen rate)
- [x] **Verification:** Create Fertile Plain cells; watch mana regen increase; console logs breakdown

**Files to update:**
- `src/core/grid/grid.model.ts` — Add `manaGeneration` property
- `src/core/mana/mana.service.ts` — Calculate total regen
- `src/ui/hud/mana-display.ts` — Show regen sources
- `src/core/game-engine.service.ts` — Trigger terrain mana regen on pulse

**Estimated complexity:** Low–Medium

---

## Phase 7: Human System Foundation (v0.19 – v0.21)

### v0.19 — Human Settlement Placement
**Goal:** Place human communities on cells; track population.

- [x] `HumansService` class (already exists): stores positions, needs (water, food), status
- [x] "Place Humans" keyboard action (e.g., 'H') to spawn on selected active cell
- [x] Visual: small icon or dot on cell to indicate humans present (in isometric)
- [x] **Verification:** Place humans on multiple cells; see icons; log to console

**Files to update:**
- `src/core/humans/humans.service.ts` — Already exists; verify settlement logic
- `src/scenes/game.scene.ts` — Add keyboard binding for placing humans
- Any human renderer — Update for isometric view

**Estimated complexity:** Medium

---

### v0.20 — Human Necessity Rules
**Goal:** Humans require water & food; enter dormancy if unmet.

- [x] On each pulse: for each human group, check:
  - Water within 3-cell radius (Freshwater terrain)
  - Food within 2-cell radius (Meadow, Fertile Plain)
- [x] If unmet: set status to Dormant (visual: grayed out)
- [x] If met: set status to Active (visual: full color)
- [x] Log human status changes to console

**Files to update:**
- `src/core/humans/humans.service.ts` — Implement necessity check
- `src/core/game-engine.service.ts` — Trigger human update on pulse
- Human visual rendering — Update dormant vs active state

**Estimated complexity:** Medium

---

### v0.21 — Human Auto-Building
**Goal:** Humans automatically build structures based on surroundings.

- [x] Define human structures: Farm, Mill, Shrine, Tower, etc.
- [x] Trigger conditions (e.g., "If Fertile Plain + humans + Active, build Farm")
- [x] On pulse: check all human groups; apply building rules
- [x] Each structure has mana generation bonus
- [x] Visual: place structure marker on cell in isometric

**Files to update:**
- `src/core/humans/humans.service.ts` — Implement building logic
- `src/core/game-engine.service.ts` — Trigger building check on pulse
- Human visual rendering — Show structures in isometric

**Estimated complexity:** Medium

---

## Phase 8: Creatures (v0.22 – v0.23)

### v0.22 — Creature Spawning
**Goal:** Legendary creatures spawn in matching habitats.

- [x] `CreaturesService` class (already exists): track creatures, spawn conditions
- [x] Define 2–3 creatures with spawn conditions:
  - Stone Colossus: spawn in cells with 3+ adjacent Mountains
  - Luminous Swarm: spawn in Sacred Groves
  - Water Serpent: spawn in cells with Water
- [x] On each pulse: check spawn conditions; create creatures
- [x] Visual: creature icons in isometric view
- [x] **Verification:** Create matching habitat; observe creature spawn on pulse; log to console

**Files to update:**
- `src/core/creatures/creatures.service.ts` — Already exists; verify spawn logic
- `src/core/game-engine.service.ts` — Trigger creature spawn on pulse
- Creature visual rendering — Display creatures in isometric

**Estimated complexity:** Medium

---

### v0.23 — Creature Movement & Effects
**Goal:** Creatures move each pulse; trigger passive effects.

- [ ] On each pulse: move creatures according to simple rules (random walk, drift toward high-harmony)
- [ ] Define creature effects:
  - Stone Colossus: transforms Mountain to Foothill
  - Water Serpent: hydrates adjacent cells
  - Luminous Swarm: increases mana generation on resting cell
- [ ] Apply effects on destination cell
- [ ] Log creature movement to console
- [ ] **Verification:** Watch creatures move in isometric; see effects trigger; console logs

**Files to update:**
- `src/core/creatures/creatures.service.ts` — Add movement and effects
- `src/core/game-engine.service.ts` — Trigger creature update on pulse
- Creature visual rendering — Animate movement in isometric

**Estimated complexity:** Medium–High

---

## Phase 9: Divine Powers (v0.24 – v0.29)

### v0.24 — Divine Powers UI
**Goal:** UI panel to select and cast divine powers.

- [ ] Powers UI (sidebar or menu):
  - Display 5 powers: Blessed Rain, Divine Wind, Fertility Bloom, Veil of Forgetting, Whisper of Memory
  - Show cost and cooldown status
- [ ] Keyboard shortcuts for powers (1–5 keys)
- [ ] **Verification:** Press keys 1–5; see power selection; log to console

**Files to update:**
- Any existing powers UI infrastructure
- `src/scenes/game.scene.ts` — Wire keyboard bindings for powers

**Estimated complexity:** Low–Medium

---

### v0.25 — Blessed Rain Power
**Goal:** Implement first divine power (hydrate 3×3 area).

- [ ] Press 1 (or power key) → select target cell
- [ ] On target: hydrate 3×3 area (set grassland/ash to meadow/fertile plain)
- [ ] Cost: 25 mana
- [ ] Cooldown: 2 pulses
- [ ] **Verification:** Cast power; see 3×3 area transform in isometric; mana decrease; cooldown active

**Files to create:**
- `src/core/powers/blessed-rain.ts` — Power implementation (if not exists)

**Files to update:**
- `src/core/game-engine.service.ts` — Register and execute power
- `src/scenes/game.scene.ts` — Handle power targeting

**Estimated complexity:** Medium

---

### v0.26 — Divine Wind Power
**Goal:** Implement second power (move creature or fog).

- [ ] Press 2 → select target creature/fog → select direction
- [ ] Move target 1–3 cells in direction
- [ ] Cost: 20 mana
- [ ] Cooldown: 1 pulse
- [ ] **Verification:** Cast power; see creature/fog move in isometric; mana decrease

**Files to update:**
- `src/core/game-engine.service.ts`
- `src/core/creatures/creatures.service.ts` — Allow manual creature movement
- `src/scenes/game.scene.ts` — Handle power targeting

**Estimated complexity:** Medium

---

### v0.27 — Fertility Bloom Power
**Goal:** Implement third power (trigger synergies immediately).

- [ ] Press 3 → select target cell
- [ ] Immediately trigger all synergies as if a pulse occurred
- [ ] Cost: 30 mana
- [ ] Cooldown: 3 pulses
- [ ] **Verification:** Cast power; see synergies apply instantly in isometric; mana decrease; console logs

**Files to update:**
- `src/core/game-engine.service.ts`
- `src/core/synergy/synergy.service.ts` — Expose trigger method
- `src/scenes/game.scene.ts` — Handle power targeting

**Estimated complexity:** Low

---

### v0.28 — Veil of Forgetting Power
**Goal:** Implement fourth power (undo reshape).

- [ ] Press 4 → select target cell
- [ ] Revert cell to original dormant state
- [ ] Cost: 20 mana
- [ ] Cooldown: 1 pulse
- [ ] **Verification:** Cast power; see cell revert in isometric; mana decrease

**Files to update:**
- `src/core/game-engine.service.ts`
- `src/core/grid/grid.service.ts` — Add cell history/revert logic
- `src/scenes/game.scene.ts` — Handle power targeting

**Estimated complexity:** Low–Medium

---

### v0.29 — Whisper of Memory Power
**Goal:** Implement fifth power (reveal ruins in area).

- [ ] Press 5 → select target area (5×5)
- [ ] Reveal all hidden ruins in area
- [ ] Cost: 15 mana
- [ ] Cooldown: 5 pulses
- [ ] **Verification:** Cast power; see ruins reveal in isometric; mana decrease

**Files to update:**
- `src/core/game-engine.service.ts`
- `src/core/grid/grid.service.ts` — Add terrain-specific operations
- `src/scenes/game.scene.ts` — Handle power targeting

**Estimated complexity:** Low

---

## Phase 10: Human Desires (v0.30 – v0.31)

### v0.30 — Desire Icon System
**Goal:** Humans express desires; floating icons appear in isometric.

- [ ] Define desire types: Snowflake, Golden Wheat, Open Eye, Flame, Bell, Book
- [ ] On pulse: randomly (or based on conditions) assign desire to human group
- [ ] Visual: small icon floats above human group in isometric
- [ ] Icon persists for N pulses or until fulfilled
- [ ] **Verification:** Wait for desires to appear above humans; see icons float in isometric; log desire assignment

**Files to update:**
- `src/core/humans/humans.service.ts` — Assign desires on pulse
- Any human/desire visual rendering — Update for isometric

**Estimated complexity:** Medium

---

### v0.31 — Desire Fulfillment & Memory Fragments
**Goal:** Fulfill desires; earn Memory Fragments (upgrades).

- [ ] Define fulfillment conditions for each desire
- [ ] On pulse: check if conditions met for active desires
- [ ] If fulfilled: remove desire + award Memory Fragment
- [ ] Memory Fragment = permanent passive bonus
- [ ] Display collected fragments in UI
- [ ] **Verification:** Arrange to fulfill desire; watch it disappear on pulse; see fragment awarded; log bonus

**Files to update:**
- `src/core/humans/humans.service.ts` — Check fulfillment conditions on pulse
- `src/core/mana/mana.service.ts` — Apply fragment bonuses
- Any memory fragment UI

**Estimated complexity:** Medium–High

---

## Phase 11: Persistence (v0.32 – v0.33)

### v0.32 — Save/Load to LocalStorage
**Goal:** Save and load complete game state.

- [ ] `PersistenceService` class (already exists): serialize/deserialize all game state
- [ ] Auto-save on each pulse (already in place)
- [ ] On-page-reload, game auto-loads last save
- [ ] **Verification:** Play, close browser, reopen; game state restored (mana, cells, creatures, humans)

**Files to update:**
- `src/persistence/persistence.service.ts` — Already exists; verify serialization includes isometric camera state

**Estimated complexity:** Low

---

### v0.33 — Auto-Save Indicator
**Goal:** Show save status UI feedback.

- [ ] Subtle "saved" indicator on screen (fades after 1 second)
- [ ] Auto-save interval: every 5 pulses
- [ ] **Verification:** Play; see save indicators appear; check LocalStorage persists data

**Files to update:**
- `src/persistence/persistence.service.ts` — Emit save event
- `src/scenes/game.scene.ts` — Display save indicator

**Estimated complexity:** Low

---

## Phase 12: Polish & Release (v0.34 – v1.0)

### v0.34 — Ambient Soundtrack Layer System
**Goal:** Implement evolving soundtrack (music grows richer as world awakes in isometric).

- [ ] 4–5 audio layers (piano base, strings, flute, choir, percussion)
- [ ] Each layer adds/fades based on world state (awakened cells %, mana generation rate)
- [ ] Seamless looping; no jarring transitions
- [ ] **Verification:** Play game in isometric; hear music layers add gradually; listen to evolution

**Files to update:**
- `src/audio/audio.service.ts` — Layer mixing & fade logic
- `src/core/game-engine.service.ts` — Trigger music updates on pulse

**Estimated complexity:** Medium

---

### v0.35 — Sound Effects & Polish
**Goal:** Add sfx for key actions (mana spend, synergy trigger, creature spawn, building).

- [ ] Mana spend: soft chime (pitch varies by cost)
- [ ] Synergy trigger: harmonic hum
- [ ] Creature spawn: ambient tone (unique per creature type)
- [ ] Building: construction creaks + magic sparkle
- [ ] Divine Power cast: dramatic whoosh
- [ ] **Verification:** Perform actions; hear corresponding sfx

**Files to update:**
- `src/audio/audio.service.ts` — SFX playback
- All event systems — call audio service on key events

**Estimated complexity:** Medium

---

### v0.36 — Animation & Particle Effects (Isometric)
**Goal:** Add visual polish (terrain glow on transform, particles on synergy, creature glow in isometric).

- [ ] Terrain transform: flash or color transition in isometric
- [ ] Synergy trigger: particle burst at center
- [ ] Creature glow: subtle pulsing halo in isometric
- [ ] Divine Power cast: visual effect at target in isometric
- [ ] Human building: small construction particles in isometric
- [ ] **Verification:** Perform actions in isometric; see animations & particles; game feels alive

**Files to update:**
- `src/graphics/particles.system.ts` — Particle integration
- `src/graphics/tilemap-renderer.service.ts` — Trigger animations
- All event systems — emit animation events

**Estimated complexity:** Medium

---

### v0.37 — UI Polish & Accessibility
**Goal:** Refine UI; add colorblind mode; improve readability (works with isometric).

- [ ] High contrast mode toggle
- [ ] Colorblind-friendly palette (deuteranopia, protanopia variants)
- [ ] Larger font option
- [ ] Improved tooltips (hover to see help text)
- [ ] Keyboard shortcuts verification (arrow keys to pan in isometric, +/- to zoom, etc.)
- [ ] **Verification:** Toggle modes; verify readability in isometric; test keyboard controls

**Files to update:**
- `src/graphics/isometric-coordinate-system.ts` — Colorblind palette support
- `src/input/camera-controller.ts` — Verify pan/zoom accessibility
- Any settings UI

**Estimated complexity:** Medium

---

### v0.38 — Tutorial & Help System (Isometric)
**Goal:** Guide new players through core mechanics in isometric perspective.

- [ ] Interactive tutorial (first 5 minutes):
  - Explain isometric grid, cells, states
  - Teach Unveil / Awaken / Reshape in isometric
  - Show pan/zoom with arrow keys and +/-
  - Introduce mana and pulse
- [ ] Help panel accessible from pause menu
- [ ] Contextual hints
- [ ] **Verification:** New player completes tutorial; understands isometric core loop

**Files to update:**
- Any existing tutorial system
- Documentation on isometric controls

**Estimated complexity:** Medium–High

---

### v0.39 — Release Candidate & Testing (Isometric)
**Goal:** Final polish, bug fixes, edge case testing in isometric view.

- [ ] Full playtest: 16×16 map in isometric, progression from start to 100% awakening
- [ ] Verify all features work in isometric (mana, synergies, humans, creatures, powers, desires, fragments, saves)
- [ ] Performance: no lag on 16×16 grid in isometric with full activity
- [ ] Camera: pan/zoom works smoothly, no edge-case glitches
- [ ] Accessibility: colorblind modes readable, keyboard shortcuts work, UI responsive
- [ ] Audio: all sfx and music work correctly with isometric gameplay
- [ ] **Verification:** Complete full playthrough in isometric; all systems functioning

**Estimated complexity:** High (comprehensive testing)

---

## v1.0 — Release
**Goal:** Public launch of Eden Manager (base game with isometric perspective).

- [ ] All features from v0.1 to v0.39 complete and polished
- [ ] 16×16 isometric map fully playable
- [ ] No critical bugs
- [ ] Documentation complete (README, How to Play, Isometric Controls, etc.)
- [ ] Deployed to web (itch.io, personal site, or equivalent)
- [ ] **Verification:** Players can enjoy a complete, meditative, bug-free experience in isometric

**Estimated complexity:** Final release gate (all previous work validated)

---

## Post-Launch Roadmap (Future)

### v1.1 — Map Tier 2 (32×32)
- Larger isometric map, more complex scenarios
- All v1.0 systems scale smoothly

### v1.2 — Memory Fragment System Expansion
- More fragments, more diverse bonuses
- Stacking effects

### v1.3 — Larger Maps & Creature Roster
- 64×64 & 128×128 isometric maps
- 5–8 legendary creatures
- Optional narrative layer (ruins discovery, story fragments)



---

## Notes for Implementation

**Keep in mind:**
- Each version should be **playable/testable** after completion (visual or console verification)
- **Dependencies flow top-down**: Grid → States → Adjacency → Synergy → Mana → **Isometric Rendering (v0.2)** → Interaction
- **Decouple early**: CoordinateSystem (v0.2), PersistenceService (v0.32) are abstraction layers that prevent future refactoring
- **Test regularly**: Write simple Playwright tests for critical paths (isometric clicks, mana spend, synergy trigger, save/load)
- **No feature creep**: Stick to 1–4 features per version; don't add "nice-to-haves" mid-version
- **Isometric Impact**: v0.2 is now foundational; all subsequent rendering and interaction depends on it

---

**Total Versions:** v0.1 → v0.39 + v1.0 = **40 milestones**

**Estimated Development Timeline (rough):**
- Phase 1 (v0.1–v0.5): 3–4 weeks (grid foundation + isometric rendering with camera control)
- Phases 2–3 (v0.6–v0.10): 2 weeks (visualization polish + interaction in isometric)
- Phases 4–6 (v0.11–v0.18): 2–3 weeks (mana + terrain manipulation + synergy in isometric)
- Phases 7–9 (v0.19–v0.29): 3–4 weeks (humans + creatures + powers in isometric)
- Phases 10–12 (v0.30–v1.0): 2–3 weeks (desires + persistence + polish + release)
- **Total: 12–17 weeks** (assuming ~10–15 hours/week)

**Note:** Isometric implementation (v0.2) is front-loaded to ensure all subsequent systems work seamlessly with the isometric perspective and coordinate abstraction.

*(Timeline is speculative; adjust based on actual development pace)*

---

**Document Version:** 2.0  
**Last Updated:** 2026-04-16  
**Status:** Updated for Isometric Perspective (Ready for Development)