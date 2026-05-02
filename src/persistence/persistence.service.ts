import { Grid } from '../core/grid/grid.service';
import { HumansService } from '../core/humans/humans.service';
import { CreaturesService } from '../core/creatures/creatures.service';

/**
 * PersistenceService handles saving and loading game state from localStorage.
 * Decouples storage from game logic: Grid.toJSON() / Grid.fromJSON() are pure,
 * while PersistenceService handles localStorage details.
 */
export class PersistenceService {
    private readonly STORAGE_KEY = 'edenManagerGameState';
    private readonly HUMANS_STORAGE_KEY = 'edenManagerHumansState';
    private readonly CREATURES_STORAGE_KEY = 'edenManagerCreaturesState';

    /**
     * Save grid state to localStorage.
     * Serializes grid via Grid.toJSON() and stringifies to JSON.
     * Returns true if save succeeded, false otherwise.
     */
    saveGrid(grid: Grid): boolean {
        try {
            const data = grid.toJSON();
            const json = JSON.stringify(data);
            if (typeof localStorage === 'undefined') {
                // Environment doesn't support localStorage (e.g., Node.js tests)
                return false;
            }
            localStorage.setItem(this.STORAGE_KEY, json);
            return true;
        } catch (error) {
            console.error('Failed to save grid state:', error);
            return false;
        }
    }

    /**
     * Load grid state from localStorage.
     * Returns reconstructed Grid if data exists and is valid, null otherwise.
     */
    loadGrid(): Grid | null {
        try {
            if (typeof localStorage === 'undefined') {
                // Environment doesn't support localStorage (e.g., Node.js tests)
                return null;
            }
            const json = localStorage.getItem(this.STORAGE_KEY);
            if (!json) {
                return null;
            }

            const data = JSON.parse(json);
            return Grid.fromJSON(data);
        } catch (error) {
            console.error('Failed to load grid state:', error);
            return null;
        }
    }

    /**
     * Delete game state from localStorage.
     * Returns true if deletion succeeded, false otherwise.
     */
    deleteGameState(): boolean {
        try {
            if (typeof localStorage === 'undefined') {
                return false;
            }
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (error) {
            console.error('Failed to delete game state:', error);
            return false;
        }
    }

    /**
     * Check if saved game state exists in localStorage.
     */
    hasSavedGame(): boolean {
        try {
            if (typeof localStorage === 'undefined') {
                return false;
            }
            return localStorage.getItem(this.STORAGE_KEY) !== null;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get the storage key being used.
     * Useful for testing and debugging.
     */
    getStorageKey(): string {
        return this.STORAGE_KEY;
    }

    saveHumans(humans: HumansService): boolean {
        try {
            const json = JSON.stringify(humans.toJSON());
            if (typeof localStorage === 'undefined') return false;
            localStorage.setItem(this.HUMANS_STORAGE_KEY, json);
            return true;
        } catch (error) {
            console.error('Failed to save humans state:', error);
            return false;
        }
    }

    loadHumans(grid: Grid): HumansService | null {
        try {
            if (typeof localStorage === 'undefined') return null;
            const json = localStorage.getItem(this.HUMANS_STORAGE_KEY);
            if (!json) return null;
            return HumansService.fromJSON(JSON.parse(json), grid);
        } catch (error) {
            console.error('Failed to load humans state:', error);
            return null;
        }
    }

    saveCreatures(creatures: CreaturesService): boolean {
        try {
            const json = JSON.stringify(creatures.toJSON());
            if (typeof localStorage === 'undefined') return false;
            localStorage.setItem(this.CREATURES_STORAGE_KEY, json);
            return true;
        } catch (error) {
            console.error('Failed to save creatures state:', error);
            return false;
        }
    }

    loadCreatures(grid: Grid): CreaturesService | null {
        try {
            if (typeof localStorage === 'undefined') return null;
            const json = localStorage.getItem(this.CREATURES_STORAGE_KEY);
            if (!json) return null;
            return CreaturesService.fromJSON(JSON.parse(json), grid);
        } catch (error) {
            console.error('Failed to load creatures state:', error);
            return null;
        }
    }
}