# Implementation Output: v0.20 — Human Necessity Rules

## Files changed

| File | Change |
|---|---|
| `src/core/humans/humans.model.ts` | Added `HumanStatus` type and `status` field to `Human` interface |
| `src/core/grid/grid.service.ts` | Added `getCellsInRadius(x, y, radius)` method |
| `src/core/humans/humans.service.ts` | Extended `EventEmitter`; added necessity check, event emission, console logging |
| `src/scenes/game.scene.ts` | Subscribed to `humanStatusChanged`; updated `addEntityOverlays` for dormant sprite |

## Files created

| File | Description |
|---|---|
| `src/core/humans/humans.service.test.ts` | Unit tests for `HumansService.update()` and event emission |

## Phase 1: Human survival model & spatial query

### `src/core/humans/humans.model.ts`

Added `HumanStatus = 'Active' | 'Dormant'` type and `status: HumanStatus` field to `Human`.
New humans default to `'Active'` in `addHuman()`.
`toJSON`/`fromJSON` carry the field automatically (spread copy); `fromJSON` defaults to `'Active'` for legacy save data missing the field.

### `src/core/grid/grid.service.ts` — `getCellsInRadius`

```typescript
getCellsInRadius(x: number, y: number, radius: number): Cell[]
```

Iterates the square `[x-r .. x+r] × [y-r .. y+r]`, delegates each coordinate to `getCell`, and collects only non-null results. This is pure Chebyshev (all cells with `Math.max(|dx|,|dy|) <= radius`), so radius 0 = 1 cell, radius 1 = up to 9, radius 2 = up to 25. Out-of-bounds positions are excluded automatically via `getCell`'s null return.

### Tests for `getCellsInRadius` (added to `grid.service.test.ts`)

- Radius 0 → exactly 1 cell (the center)
- Radius 1 → 9 cells at interior position
- Radius 2 → 25 cells at interior position
- All four corner positions → only in-bounds cells returned, correct counts
- Top and left edge positions → correct reduced counts
- Center cell always included
- Returned references are the live `Cell` objects (not copies)

---

## Phase 2: Necessity check & event emission

### `src/core/humans/humans.service.ts`

`HumansService` now extends `EventEmitter`.  
The grid reference is stored as `private grid: Grid` (previously discarded).

**`update()`** iterates all humans and calls `checkNecessities(human)` for each.

**`checkNecessities(human)`** calls `computeStatus`, compares with current status; on change:
- mutates `human.status`
- logs `Human <id> at (<x>, <y>) → <status>` to `console.log`
- emits `humanStatusChanged` with payload `{ id, x, y, status }`

**`computeStatus(human)`** performs two radius searches:
- Water: `getCellsInRadius(x, y, 3)` — needs at least one `Active` `'Water'` cell
- Food: `getCellsInRadius(x, y, 2)` — needs at least one `Active` `'Meadow'` or `'Fertile Plain'` cell

Returns `'Active'` if both pass, `'Dormant'` otherwise.

### New `HumanStatusChangedPayload` interface (exported from `humans.service.ts`)

```typescript
export interface HumanStatusChangedPayload {
    id: string;
    x: number;
    y: number;
    status: 'Active' | 'Dormant';
}
```

### Tests (`src/core/humans/humans.service.test.ts`)

Coverage:
- `addHuman` sets `status: 'Active'`
- Active Water + Active Meadow → remains Active
- Missing water → Dormant
- Missing food → Dormant
- Missing both → Dormant
- Dormant Water cell not counted as water source
- Dormant Meadow cell not counted as food source
- Active Fertile Plain counts as food
- Human standing on own Active Meadow (distance 0) satisfies food
- Water at radius 4 (outside radius 3) does not satisfy
- `humanStatusChanged` emitted with correct payload on Active→Dormant
- `humanStatusChanged` emitted with correct payload on Dormant→Active
- No event when status unchanged between pulses
- No event for Dormant human remaining Dormant
- `toJSON`/`fromJSON` round-trip preserves `status`
- Legacy data without `status` defaults to `'Active'`

**Test run result:** 111 tests passed (74 grid + 37 humans service), 0 failures.

---

## Phase 3: Visual feedback

### `src/scenes/game.scene.ts`

**`subscribeToHumansEvents(humans: HumansService)`** — new private method.  
Called in `onInitialize` after the `GameEngine` is created, subscribing to `humanStatusChanged`.  
On each event, retrieves the tile at `(payload.x, payload.y)` and calls `setComposedGraphic` to redraw it, which internally calls `addEntityOverlays` with the updated human state.

**`addEntityOverlays`** — updated sprite selection.  
Previously always used `Sprites.human`; now finds the human at the cell and selects:
- `Sprites.humanDormant` when `human.status === 'Dormant'`
- `Sprites.human` otherwise

`Sprites.humanDormant` already existed in `resources.ts` with `DarkGray` tint applied.

---

## Acceptance criteria checklist

### Phase 1
- [x] `Human` interface has `status: 'Active' | 'Dormant'`
- [x] `addHuman()` sets `status: 'Active'` on every new human
- [x] `getCellsInRadius(x, y, 0)` returns exactly the cell at `(x, y)`
- [x] `getCellsInRadius(x, y, 1)` returns up to 9 cells
- [x] `getCellsInRadius(x, y, 2)` returns up to 25 cells
- [x] `getCellsInRadius` at corner positions returns only in-bounds cells
- [x] `getCellsInRadius` at edge positions returns only in-bounds cells
- [x] Existing serialisation includes `status` field

### Phase 2
- [x] `HumansService` extends `EventEmitter`
- [x] Active Water ≤ 3 cells away and Active food ≤ 2 cells away → `status: 'Active'`
- [x] Missing Active Water within radius 3 → `status: 'Dormant'`
- [x] Missing Active food terrain within radius 2 → `status: 'Dormant'`
- [x] Dormant Water cell not counted as water source
- [x] Dormant Meadow cell not counted as food source
- [x] Active→Dormant transition emits `humanStatusChanged` with correct payload
- [x] Dormant→Active transition emits `humanStatusChanged` with correct payload
- [x] No event emitted when status does not change
- [x] Transition logged to `console.log`
- [x] Human on own Active Meadow (distance 0) satisfies food

### Phase 3
- [x] Dormant human renders with gray dormant sprite
- [x] Active human renders with full-color sprite
- [x] Dormant→Active transition redraws tile on same pulse
- [x] Active→Dormant transition redraws tile on same pulse
- [x] Freshly placed humans (Active) always render with full-color sprite
