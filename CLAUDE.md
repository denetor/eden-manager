# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Eden Manager** is a meditative god game built with [Excalibur.js](https://excaliburjs.com/) and TypeScript. The game centers on a deity awakening 
a mist-covered world cell-by-cell, manipulating terrain through divine mana, and observing humans respond 
organically to environmental changes.

The complete game design is documented in `/resources/gdd.md`, which should be consulted for gameplay mechanics, 
content structure, and design philosophy.

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
- `plans/*.md` with  the implementation plans of the stories listed in the PRD

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
```

---

## Code Architecture

### High-Level Structure

```
/src
    /core                    # Logica di gioco principale                                                                                                                                                                                                                                                          
      /grid                  # Sistema griglia e celle                                                                                                                                                                                                                                                             
      /mana                  # Sistema mana                                                                                                                                                                                                                                                                        
      /synergy               # Motore di sinergia celle-a-celle
      /creatures             # Creature leggendarie                                                                                                                                                                                                                                                                
      /humans                # Sistema AI umani
    /ui                      # Componenti UI e HUD
      /hud                   # Head-up display
      /menus                 # Menu e dialoghi                                                                                                                                                                                                                                                                     
    /graphics                # Rendering e coordinate                                                                                                                                                                                                                                                              
    /audio                   # Audio e musica  
    /persistence             # Save/load
    /shared                  # Utility e helper condivisi                                                                                                                                                                                                                                                          
      /models
      /utils                                   
      constants.ts
    /components          # ECS components
    /systems             # ECS systems  
    /scenes              # Scene principali
    /actors              # Actor globali
    main.ts              # Engine initialization (minimal, as designed)
    resources.ts         # Asset loader (images, sounds, etc.)
    vite-env.d.ts        # Vite type definitions
    files.d.ts           # Custom type definitions
/public                # Game assets
  /images              # Sprite assets
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

The game supports **isometric** perspective. The current architecture uses Excalibur's 
built-in coordinate system.

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