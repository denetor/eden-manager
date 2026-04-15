# Phase 2: State Mutations & Events — Completion Report

**Status**: ✅ **COMPLETE**

**Date**: 2026-04-15

**Test Results**: 45 tests passed (19 from Phase 1 + 26 new)

---

## Summary

Phase 2 extends the Grid class with a complete event system and three mutation methods. Grid now extends `EventEmitter` and emits `cellChanged` events whenever cells are modified. Dirty cell tracking is implemented internally, enabling efficient synergy checks in later phases.

## What Was Implemented

### 1. EventEmitter Integration

- Grid extends Node.js `EventEmitter` (via `import { EventEmitter } from 'events'`)
- Properly calls `super()` in constructor
- All mutations emit events synchronously

### 2. Mutation Methods

**`reshape(x, y, terrainType: TerrainType): void`**
- Updates cell's `terrainType` property
- Marks cell as dirty
- Emits `cellChanged` event with payload `{ x, y, cell }`
- Safe for out-of-bounds coordinates (no-op)
- Idempotent (can be called multiple times safely)

**`unveil(x, y): void`**
- Changes cell state from `Veiled` → `Dormant`
- Marks cell as dirty
- Emits `cellChanged` event
- Idempotent: only emits if cell is currently `Veiled`
- Safe for out-of-bounds coordinates (no-op)

**`awaken(x, y): void`**
- Changes cell state from `Dormant` → `Active`
- Marks cell as dirty
- Emits `cellChanged` event
- Idempotent: only emits if cell is currently `Dormant`
- Safe for out-of-bounds coordinates (no-op)

### 3. Dirty Tracking

**`getDirtyCells(): Array<{ x: number; y: number }>`**
- Returns array of dirty cell coordinates
- Returns empty array if no dirty cells (no null checks needed in callers)
- Used by SynergyEngine to determine which cells need synergy checks

**`clearDirty(): void`**
- Clears all dirty flags
- Called at end of Divine Pulse sequence
- Prepares grid for next pulse cycle

**`private markDirty(x, y): void`**
- Internal method marking cell as dirty
- Uses Set-based storage keyed by "x,y" string
- Prevents duplicate entries

### 4. Event Payload

**`CellChangedPayload` interface**
```typescript
{
    x: number;
    y: number;
    cell: Cell;  // Reference to the actual Cell object
}
```

Listeners receive the actual Cell object (not a copy), allowing them to inspect all cell properties.

## Test Coverage

### New Test Suites (26 tests)

**reshape (6 tests)**
- ✓ Updates terrainType and emits cellChanged
- ✓ Marks cell as dirty
- ✓ Handles all terrain types
- ✓ Idempotent (safe multiple calls)
- ✓ No-op for out-of-bounds
- ✓ Correct event payload structure

**unveil (5 tests)**
- ✓ Changes state Veiled → Dormant
- ✓ Emits cellChanged event
- ✓ Marks cell as dirty
- ✓ Idempotent behavior
- ✓ No-op for out-of-bounds

**awaken (6 tests)**
- ✓ Changes state Dormant → Active
- ✓ Emits cellChanged event
- ✓ Marks cell as dirty
- ✓ Idempotent behavior
- ✓ No-op for Veiled cells
- ✓ No-op for out-of-bounds

**dirty tracking (5 tests)**
- ✓ Tracks dirty cells after reshape
- ✓ Returns empty array when clean
- ✓ No duplicate entries for same cell
- ✓ clearDirty removes all flags
- ✓ Tracks dirty from unveil and awaken

**event listeners (4 tests)**
- ✓ Multiple listeners on cellChanged
- ✓ Listener removal
- ✓ Correct payload passed to listeners
- ✓ Event fires immediately on mutation

### Phase 1 Tests Still Pass

All 19 Phase 1 tests continue to pass:
- Constructor & initialization (4 tests)
- getCell boundary conditions (4 tests)
- setCell mutations (8 tests)
- Grid dimensions (3 tests)

## Architecture Notes

### Separation of Concerns

- **Grid**: Stores state, tracks dirty, emits events
- **Event listeners**: Rendering, SynergyEngine, HUD listen to events
- **No circular dependencies**: Grid doesn't import or know about listeners

### Idempotency Design

State transition methods are idempotent:
- `unveil()` on a Dormant or Active cell = no-op
- `awaken()` on a Veiled or Active cell = no-op

This simplifies caller logic and prevents cascading side effects from duplicate calls.

### Dirty Tracking Efficiency

For large grids (32×32 to 128×128):
- Only modified cells tracked (not all cells)
- O(k) space where k = number of modified cells
- SynergyEngine can check only dirty + neighbors, not all cells

## Build Status

✅ **TypeScript compilation**: Passes
✅ **Vite bundling**: Succeeds (495.57 kB)
✅ **All tests**: 45 pass
✅ **Type safety**: No `any` types, full strict mode

## Integration Points (Used by Later Phases)

### Phase 3 will depend on:
- `getDirtyCells()` to identify cells for synergy checks
- `clearDirty()` at end of Divine Pulse

### Phase 9 will depend on:
- `cellChanged` event to update TileMapRenderer
- Event payload containing Cell reference

## Files Modified

- `src/core/grid/grid.service.ts` — Added EventEmitter, mutation methods, dirty tracking
- `src/core/grid/grid.service.test.ts` — Added 26 new tests (now 45 total)
- `tsconfig.json` — Excludes test files from compilation (from Phase 1)
- `jest.config.js` — Jest configuration (from Phase 1)
- `package.json` — Unit test scripts (from Phase 1)

## Next Phase

**Phase 3: Dirty Flagging & Batch Operations**

Will implement:
- `reshapeBatch(changes: Array<{x, y, terrain}>)` for atomic multi-cell updates
- Single `batchChanged` event for batch operations
- Efficiency optimization for Divine Powers affecting 3×3 or 5×5 areas

---

**Acceptance Criteria Checklist**: ✅ All passed