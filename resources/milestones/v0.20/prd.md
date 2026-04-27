## Problem Statement

Human settlements currently exist on the map but have no survival requirements — they persist regardless of their environment. This makes the god-game loop hollow: the player can place humans anywhere with no consequences, and the world does not feel like a living ecosystem where terrain choices matter. Humans need to respond to their environment, entering dormancy when basic resources are absent and thriving when they are met.

## Solution

Each divine pulse, the game checks whether each human group has access to sufficient water and food within a defined radius. If either resource is absent, the human group becomes Dormant (visually grayed out). If both are present, the group is Active (full color). The player must shape and awaken the terrain around settlements to keep their people alive — connecting divine action to human fate.

## User Stories

1. As a player, I want humans to require water nearby so that terrain decisions around settlements have meaningful consequences.
2. As a player, I want humans to require food nearby so that I must cultivate life-sustaining terrain to support settlements.
3. As a player, I want humans to go visually gray (dormant) when their needs are unmet so that I can immediately see which settlements are struggling.
4. As a player, I want humans to return to full color (active) when their needs are met so that I get positive feedback from improving their environment.
5. As a player, I want dormancy to be resolved on the very next pulse after I provide resources so that the feedback loop feels immediate and satisfying.
6. As a player, I want dormancy to trigger on the very next pulse after resources disappear so that the consequences of neglect are prompt and clear.
7. As a player, I want newly placed humans to start as Active so that placement feels rewarding before the first pulse runs.
8. As a player, I want only Active terrain cells to count as resources so that awakening cells has strategic value for human survival.
9. As a player, I want the water search radius (3 cells) to be larger than the food search radius (2 cells) so that I can place water sources slightly farther away than food.
10. As a player, I want dormancy transitions logged to the console so that I can follow the game's internal logic during development.

## Implementation Decisions

### Human data model
- Add a `status` field to the `Human` interface with values `'Active'` or `'Dormant'`.
- This field is separate from the existing `state` field (`'idle' | 'moving' | 'settled'`), which tracks movement behaviour and is reserved for future use in v0.21+.
- New humans are initialised with `status: 'Active'`.

### Terrain: water necessity
- The `'Water'` terrain type satisfies the water necessity check.
- No new `'Freshwater'` terrain type is introduced; "Freshwater" in the milestone description is a label, not a distinct type.

### Terrain: food necessity
- `'Meadow'` and `'Fertile Plain'` terrain types satisfy the food necessity check.

### Cell state requirement
- Only cells in the `Active` state count as valid water or food sources.
- Veiled and Dormant cells with the correct terrain type do **not** satisfy needs.

### Radius calculation
- Radius is measured using **Chebyshev distance**: `Math.max(|dx|, |dy|) <= radius`.
- Water must be within Chebyshev radius 3 (a 7×7 area centred on the human).
- Food must be within Chebyshev radius 2 (a 5×5 area centred on the human).
- The human's own cell is included (distance 0), so a human standing on an Active Meadow has food by definition.

### Spatial query on Grid
- A new method `getCellsInRadius(x, y, radius)` is added to `Grid`.
- It returns all cells within the given Chebyshev radius, excluding out-of-bounds positions.
- This method is general-purpose and reusable by future systems (creatures, divine powers).

### Transition timing
- Transitions are **immediate**: one pulse without a resource → Dormant; one pulse with both resources → Active.
- No resilience buffer or grace period is implemented in this version.

### Event emission
- `HumansService` is extended to emit events (via the existing `EventEmitter` base class already used by `Grid`).
- On each status transition, it emits a `humanStatusChanged` event with payload `{ id: string, x: number, y: number, status: 'Active' | 'Dormant' }`.
- Events are only emitted when the status actually changes (not on every pulse for unchanged humans).
- Console logging of the transition also happens inside `HumansService`, alongside the event emit.

### Visual rendering
- The scene listens to `humanStatusChanged` and triggers a tile refresh for the affected cell `(x, y)`.
- The `addEntityOverlays` method selects `Sprites.human` for Active humans and `Sprites.humanDormant` for Dormant humans, using the human's `status` field.
- `Sprites.humanDormant` already exists with a gray tint applied in `resources.ts`; no new asset is needed.

### Game engine integration
- `GameEngine.divinePulse()` already calls `this.humans.update()`; no changes to the engine are required.
- `HumansService.update()` is given a reference to the `Grid` (already available via the constructor) to perform the radius lookups.

## Testing Decisions

Good tests verify **external, observable behaviour** — what goes in and what comes out — without asserting on internal implementation details such as private fields, loop structures, or internal method calls.

### Modules to test

**`Grid.getCellsInRadius()`**
- Returns the correct set of cells for a given radius (verify count and coordinates).
- Handles edge and corner positions correctly (no out-of-bounds cells returned).
- Radius 0 returns only the cell itself.
- Uses the existing `Grid` unit test pattern (see `grid.service.test.ts`).

**`HumansService.update()`**
- Human with Active Water within radius 3 and Active Meadow within radius 2 → remains/becomes Active.
- Human with Active Water but no food within radius 2 → becomes Dormant.
- Human with food but no Active Water within radius 3 → becomes Dormant.
- Human with Dormant Water cell nearby (wrong state) → becomes Dormant (terrain state matters).
- Human with neither water nor food → becomes Dormant.
- Status transition from Active → Dormant emits `humanStatusChanged` event with correct payload.
- Status transition from Dormant → Active emits `humanStatusChanged` event with correct payload.
- No event is emitted when status does not change between pulses.
- Human on their own Active Meadow cell (distance 0) counts food as satisfied.

### Prior art
- `grid.service.test.ts` — unit tests for `Grid` spatial methods; follow the same pattern for `getCellsInRadius`.
- `game-engine.service.test.ts` and `synergy.service.test.ts` — pattern for wiring services and asserting on effects after a pulse.

## Out of Scope

- **Resilience / grace period**: humans do not tolerate N pulses without resources before going dormant.
- **Partial needs**: no distinction between "low food" and "no food"; the check is binary.
- **Human movement toward resources**: humans do not migrate toward food or water (deferred to v0.21+).
- **Human death**: dormant humans do not die or disappear; they merely become inactive.
- **Population growth or decline**: no demographic effects from sustained dormancy or activity.
- **Freshwater terrain type**: the `'Water'` terrain type is reused; no new terrain is introduced.
- **Human desire icons**: floated desire icons are deferred to v0.30.
- **Persistence of `status`**: serialisation of the new `status` field is handled if `toJSON`/`fromJSON` already mirrors the `Human` interface; no special persistence work is planned.

## Further Notes

- The Chebyshev radius search is deliberately simple and cheap for a 16×16 grid. Performance is not a concern at this scale.
- The decision to require `Active` terrain cells (not just any cell with the right terrain type) reinforces the core god-game loop: the player must awaken terrain to make it useful, which costs mana and creates strategic decisions.
- Future systems (creatures in v0.22, divine powers in v0.25) will also benefit from `getCellsInRadius` on `Grid`, making it a genuinely deep module worth the extraction.