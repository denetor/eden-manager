# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Eden Manager** is a meditative god game built with [Excalibur.js](https://excaliburjs.com/) and TypeScript. The game centers on a deity awakening 
a mist-covered world cell-by-cell, manipulating terrain through divine mana, and observing humans respond 
organically to environmental changes.

The complete game design is documented in `/resources/gdd.md`, which should be consulted for gameplay mechanics, 
content structure, and design philosophy.

**Current State (Early Development):**
- Framework scaffolding in place (Excalibur engine, Vite build, Playwright tests)
- GDD written and finalized
- Core game systems not yet implemented; codebase is a template stage

---

## Documentation
### Game design document
Game design document can be found at this file: `resources/gdd.md`

### Milestones
You can find the milestones list in the file `resources/milestones.md`.

Detailed documentation for each milestone lies in `resources/milestones/` filder. Each milestone has a directory called after the milestone version number. Example: `resources/milestones/v0.1`.

Each milestone detail folder contains:
- `grill-me-out.md` with the decisions made during the grill-me interview
- `prd.md` with the PRD specific for the version name

---

## Common Development Commands

### Development
```bash
docker-compose up      # Run dev server in isolated Docker container (port 5173)
docker-compose down    # Stop container
```

### Building & Testing
Run after entering the running Docker container
```bash
npm run build          # TypeScript compile + Vite bundle (outputs to dist/)
npm run serve          # Preview production build locally (http://localhost:4173)
npm test               # Full test suite: build + Playwright end-to-end tests
npm run test:integration-update  # Update Playwright snapshot tests
```

---

## Code Architecture

### High-Level Structure

```
/src
    /core                    # Logica di gioco principale                                                                                                                                                                                                                                                          
      /grid                  # Sistema griglia e celle                                                                                                                                                                                                                                                             
        grid.system.ts                                                                                                                                                                                                                                                                                             
        grid.model.ts                                                                                                                                                                                                                                                                                              
        grid.service.ts                        
      /mana                  # Sistema mana                                                                                                                                                                                                                                                                        
        mana.system.ts                                                                                                                                                                                                                                                                                             
        mana.model.ts
        mana.service.ts                                                                                                                                                                                                                                                                                            
      /synergy               # Motore di sinergia celle-a-celle
        synergy.system.ts                                                                                                                                                                                                                                                                                          
        synergy.service.ts
      /creatures             # Creature leggendarie                                                                                                                                                                                                                                                                
        creature.actor.ts                                                                                                                                                                                                                                                                                          
        creature.model.ts
        creatures.system.ts                                                                                                                                                                                                                                                                                        
      /humans                # Sistema AI umani
        human.actor.ts                                                                                                                                                                                                                                                                                             
        human.model.ts
        humans.system.ts                                                                                                                                                                                                                                                                                           
    /ui                      # Componenti UI e HUD
      /hud                   # Head-up display
        mana-display.ts                                                                                                                                                                                                                                                                                            
        cell-info.ts
      /menus                 # Menu e dialoghi                                                                                                                                                                                                                                                                     
        main-menu.scene.ts                                                                                                                                                                                                                                                                                         
        pause-menu.scene.ts
    /graphics                # Rendering e coordinate                                                                                                                                                                                                                                                              
      coordinate-helper.ts   # logicToScreen(), screenToLogic()
      perspective.ts         # Top-down vs isometric swap                                                                                                                                                                                                                                                          
      particles.system.ts                      
    /audio                   # Audio e musica  
      audio.service.ts                                                                                                                                                                                                                                                                                             
      ambience-manager.ts                      
    /persistence             # Save/load
      save.service.ts                                                                                                                                                                                                                                                                                              
      load.service.ts                          
    /shared                  # Utility e helper condivisi                                                                                                                                                                                                                                                          
      /models
        entity.model.ts                                                                                                                                                                                                                                                                                            
      /utils                                   
        math-utils.ts
        grid-utils.ts
      constants.ts
    /components          # ECS components
    /systems             # ECS systems  
    /scenes              # Scene principali
      game.scene.ts          # Scena di gioco principale   
    /actors              # Actor globali
    main.ts              # Engine initialization (minimal, as designed)
    resources.ts         # Asset loader (images, sounds, etc.)
    vite-env.d.ts        # Vite type definitions
    files.d.ts           # Custom type definitions
/public                # Game assets
  /images              # Sprite assets
/tests                 # Playwright integration tests
/resources             # Project documentation (do not put code or assets here)
```

### Build & Bundling

- **Build Tool:** Vite 6.4.2 with Rollup backend
- **TypeScript:** ESNext target, strict mode enabled
- **Special Handling:**
  - **Tiled Maps:** Vite config includes a plugin to prevent `.tsx` tileset files from being interpreted as React components
  - **Excalibur CommonJS:** OptimizeDeps excludes Excalibur to prevent ESM/CommonJS bundling issues
  - **Production Builds:** UMD format with relative asset paths (configured for itch.io distribution)
  - **Source Maps:** Enabled in both dev and prod for debugging

### Scene & Actor Patterns

The codebase follows Excalibur conventions:

1. **Scene Management:** Scenes inherit from `Scene` and define lifecycle hooks:
   - `onInitialize()` — Composition & setup (add actors here)
   - `onActivate()` / `onDeactivate()` — Transition logic
   - `onPreUpdate()` / `onPostUpdate()` — Frame update hooks
   - `onPreDraw()` / `onPostDraw()` — Render hooks

2. **Actors:** Inherit from `Actor` and define behavior via:
   - `onInitialize()` — Lazy setup (graphics, event listeners)
   - `onPreUpdate()` / `onPostUpdate()` — Per-frame logic
   - Collision lifecycle hooks — For physics interactions

3. **Resources:** Centralized in `resources.ts`. Add new assets by extending the `Resources` object and adding them to the loader.

### Coordinate System & Perspective

The game will support both **top-down** and **isometric** perspectives. The current architecture uses Excalibur's 
built-in coordinate system; future implementation should:

- Keep **logical grid coordinates** (cell position) separate from **screen coordinates** (rendering position)
- Use helper functions like `logicToScreen(x, y)` to enable perspective swaps without refactoring game logic
- See vite.config.js for Tiled map support (useful for designing maps visually)

---

## Testing Strategy

Tests use [Playwright](https://playwright.dev/docs/intro) for end-to-end testing:

- **Config:** `playwright.config.ts` — Runs against `npm run serve` (production build preview)
- **Test Directory:** `/tests`
- **Test Format:** Playwright test syntax (similar to Jest)

**Running Tests:**
```bash
npm test                           # Build + run all tests
npm test -- --grep "pattern"       # Run specific test by name pattern
npm run test:integration-update    # Update visual regression snapshots
```

The web server times out after 240 seconds to accommodate slow CI environments.

---

## Future Architecture Goals

According to the GDD, the game will eventually have these core systems:

1. **Grid & Cell System** — Manage a mutable 2D grid (16×16 to 128×128 cells)
2. **Mana System** — Track player resources, regeneration, and spending
3. **Adjacency Engine** — Calculate cell-to-cell synergy effects each pulse
4. **Human AI** — Autonomous settlement system responding to environment
5. **Creature System** — Legendary creatures with movement and effects
6. **Divine Powers** — Player-activated abilities (Blessed Rain, Divine Wind, etc.)
7. **Persistence** — LocalStorage-based save state
8. **Audio & Visuals** — Ambient soundtrack layers, particle effects, color transitions

**Recommended File Organization for Growth:**
```
/src/core/          # Game logic (grid, mana, synergy, creatures, humans)
/src/ui/            # UI components & HUD
/src/graphics/      # Rendering & coordinate systems
/src/audio/         # Sound & music management
/src/persistence/   # Save/load system
```

---

## Key Technical Decisions

1. **No Physics Enabled:** Physics systems are commented out in main.ts; the game uses simpler movement via Excalibur Actions
2. **Pixel Art Mode:** Enabled for crisp rendering without artifacts
3. **Fixed Asset Dimensions:** Game runs at 800×600 logical pixels with FitScreenAndFill display mode (responsive scaling)
4. **SourceMap in Production:** Intentional for debugging post-release issues
5. **External Excalibur:** Kept external in build to avoid ESM/CommonJS conflicts

---

## Development Notes

- **TypeScript Strict Mode:** Enabled; `noUnusedLocals` enforced
- **Excalibur DevTools:** Available as browser extensions (Chrome & Firefox) for in-game debugging
- **Vite HMR:** Runs with `--host` flag for Docker / remote development support
- **Tiled Map Editor:** Supported via vite.config.js plugin; use for designing maps (`.tmx` files)

---

## Deployment

- **Target:** Web browser (modern Chrome, Firefox, Safari, Edge from 2021+)
- **Distribution:** Relative paths configured for static hosting (e.g., itch.io)
- **Build Output:** `dist/` directory contains bundled game

```bash
npm run build  # Outputs to dist/
# Deploy dist/ to your hosting
```

---

## Debugging Tips

1. **Console Logging:** Standard `console.log()` works; Excalibur logs at startup
2. **Dev Tools Extension:** Install Excalibur DevTools for browser to inspect actors, scenes, and physics in real-time
3. **Source Maps:** Both dev and prod builds include source maps for breakpoint debugging
4. **Test Screenshots:** Playwright captures visual diffs on test failure (see reports in `test-results/` after running tests)

---

**Last Updated:** 2026-04-15  
**Excalibur Version:** 0.32.0  
**TypeScript Version:** 5.9.3  
**Node Version:** 24+ (Docker image: node:24)