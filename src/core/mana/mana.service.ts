import { ManaState } from './mana.model';

/**
 * Mana service manages the player's mana resource.
 */
export class ManaService {
    private state: ManaState;
    private listeners: Set<(state: ManaState) => void> = new Set();

    constructor(initialCurrent: number = 50, max: number = 100, regenerationPerPulse: number = 10) {
        this.state = {
            current: Math.min(initialCurrent, max),
            max,
            regenerationPerPulse,
        };
    }

    /**
     * Get current mana amount
     */
    getCurrent(): number {
        return this.state.current;
    }

    /**
     * Get maximum mana capacity
     */
    getMax(): number {
        return this.state.max;
    }

    /**
     * Get mana regeneration per pulse
     */
    getRegenerationPerPulse(): number {
        return this.state.regenerationPerPulse;
    }

    /**
     * Check if player has enough mana for a cost
     */
    hasEnough(cost: number): boolean {
        return this.state.current >= cost;
    }

    /**
     * Deduct mana for an action (returns true if successful)
     */
    spend(cost: number): boolean {
        if (!this.hasEnough(cost)) {
            return false;
        }
        this.state.current -= cost;
        this.notifyListeners();
        return true;
    }

    /**
     * Regenerate mana at end of pulse
     */
    regenerate(): void {
        this.state.current = Math.min(this.state.current + this.state.regenerationPerPulse, this.state.max);
        this.notifyListeners();
    }

    /**
     * Get full state
     */
    getState(): ManaState {
        return { ...this.state };
    }

    /**
     * Register a listener for mana state changes
     */
    onManaChanged(callback: (state: ManaState) => void): void {
        this.listeners.add(callback);
    }

    /**
     * Notify all listeners of state change
     */
    private notifyListeners(): void {
        this.listeners.forEach(cb => cb({ ...this.state }));
    }
}