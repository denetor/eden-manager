# Plan: v0.20 — Human Necessity Rules

> Source PRD: `resources/milestones/v0.20/prd.md`

## Architectural decisions

- **Human survival status**: a new `status: 'Active' | 'Dormant'` field on the `Human` model, separate from the existing `state` field (which tracks movement behaviour for v0.21+).
- **Water source**: `'Water'` terrain type satisfies water necessity; no new terrain type introduced.
- **Food sources**: `'Meadow'` and `'Fertile Plain'` terrain types satisfy food necessity.
- **Resource cell requirement**: only cells in `Active` state count as valid sources.
- **Radius metric**: Chebyshev distance — `Math.max(|dx|, |dy|) <= radius`.
- **Water radius**: 3 cells. **Food radius**: 2 cells.
- **Transition timing**: immediate — one pulse without a resource → Dormant; one pulse with both → Active.
- **Event model**: `HumansService` extends the existing `EventEmitter` base; emits `humanStatusChanged` with payload `{ id, x, y, status }` only on actual transitions.
- **Initial status**: new humans start as `'Active'`.

---

## Phase 1: Human survival model & spatial query

**User stories**: 7 (newly placed humans start Active), 8 (only Active cells count as resources), 9 (water radius larger than food radius)

### What to build

Extend the `Human` data model with a `status` field defaulting to `'Active'`, so the concept of survival state exists independently of movement state. Add a general-purpose `getCellsInRadius(x, y, radius)` method to `Grid` that returns all in-bounds cells within a given Chebyshev distance. This method is the spatial primitive that the necessity check (Phase 2) will call; it is also reusable by future systems such as creatures and divine powers.

Unit-test `getCellsInRadius` in isolation: verify correct cell counts and coordinates for interior positions, edge positions, corner positions, and radius 0.

### Acceptance criteria

- [ ] `Human` interface has `status: 'Active' | 'Dormant'`
- [ ] `addHuman()` sets `status: 'Active'` on every new human
- [ ] `getCellsInRadius(x, y, 0)` returns exactly the cell at `(x, y)`
- [ ] `getCellsInRadius(x, y, 1)` returns up to 9 cells (same as surrounding 3×3 area)
- [ ] `getCellsInRadius(x, y, 2)` returns up to 25 cells (5×5 area)
- [ ] `getCellsInRadius` at a corner position returns only in-bounds cells (no out-of-bounds entries)
- [ ] `getCellsInRadius` at an edge position returns only in-bounds cells
- [ ] Existing `Human` serialisation (`toJSON` / `fromJSON`) includes the `status` field

---

## Phase 2: Necessity check & event emission

**User stories**: 1 (water requirement), 2 (food requirement), 5 (dormancy resolves next pulse), 6 (dormancy triggers next pulse), 8 (only Active terrain counts), 9 (different radii), 10 (console logging)

### What to build

`HumansService` extends `EventEmitter`. Its `update()` method iterates every human and runs the necessity check: scan `getCellsInRadius(x, y, 3)` for at least one `Active` `'Water'` cell; scan `getCellsInRadius(x, y, 2)` for at least one `Active` `'Meadow'` or `'Fertile Plain'` cell. If either check fails, the new status is `'Dormant'`; if both pass, the new status is `'Active'`. When the status changes, emit `humanStatusChanged` with payload `{ id, x, y, status }` and log the transition to the console. No event is emitted when the status is unchanged.

`HumansService` already receives a `Grid` reference via its constructor; it uses that reference to call `getCellsInRadius`.

`GameEngine.divinePulse()` already calls `this.humans.update()` — no changes to the engine are required.

Unit-test the necessity check covering: human with both resources → Active; human with water but no food → Dormant; human with food but no water → Dormant; human with neither → Dormant; Dormant terrain cell not counted as a resource; event emitted on Active→Dormant transition; event emitted on Dormant→Active transition; no event when status unchanged between pulses.

### Acceptance criteria

- [ ] `HumansService` extends `EventEmitter`
- [ ] Human with Active Water ≤ 3 cells away and Active Meadow/Fertile Plain ≤ 2 cells away → `status: 'Active'`
- [ ] Human missing Active Water within radius 3 → `status: 'Dormant'`
- [ ] Human missing Active food terrain within radius 2 → `status: 'Dormant'`
- [ ] A Dormant Water cell is not counted as a water source
- [ ] A Dormant Meadow cell is not counted as a food source
- [ ] Status transition from Active → Dormant emits `humanStatusChanged` with correct `{ id, x, y, status: 'Dormant' }`
- [ ] Status transition from Dormant → Active emits `humanStatusChanged` with correct `{ id, x, y, status: 'Active' }`
- [ ] No event emitted when status does not change
- [ ] Transition is logged to `console.log` inside `HumansService`
- [ ] A human standing on their own Active Meadow cell satisfies food (distance 0 is within radius 2)

---

## Phase 3: Visual feedback

**User stories**: 3 (humans go gray when dormant), 4 (humans return to full color when active)

### What to build

The scene subscribes to the `humanStatusChanged` event on `HumansService`. When the event fires, it triggers a tile refresh for the affected cell at `(x, y)`. The `addEntityOverlays` method already chooses which human sprite to render per tile; extend it to read `human.status` and select `Sprites.humanDormant` (already defined with a gray tint in `resources.ts`) for Dormant humans and `Sprites.human` for Active humans.

No new assets are needed. No new render path is needed — the existing tile-refresh mechanism used by other state transitions handles this.

### Acceptance criteria

- [ ] A human whose `status` is `'Dormant'` renders with the gray dormant sprite
- [ ] A human whose `status` is `'Active'` renders with the full-color sprite
- [ ] When a human transitions Dormant → Active, the tile updates visually on the same pulse
- [ ] When a human transitions Active → Dormant, the tile updates visually on the same pulse
- [ ] Humans placed fresh (status `'Active'`) always render with the full-color sprite