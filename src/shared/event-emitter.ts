/**
 * Simple browser-compatible EventEmitter implementation.
 * Provides on() and emit() without Node.js dependencies.
 */
export class EventEmitter {
    private listeners: Map<string, Array<(...args: any[]) => void>> = new Map();

    /**
     * Subscribe to an event.
     */
    on(eventName: string, callback: (...args: any[]) => void): this {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }
        this.listeners.get(eventName)!.push(callback);
        return this;
    }

    /**
     * Emit an event to all listeners.
     */
    emit(eventName: string, ...args: any[]): boolean {
        const callbacks = this.listeners.get(eventName);
        if (!callbacks) {
            return false;
        }
        callbacks.forEach((callback) => callback(...args));
        return true;
    }

    /**
     * Remove a listener for an event.
     */
    off(eventName: string, callback: (...args: any[]) => void): this {
        const callbacks = this.listeners.get(eventName);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        }
        return this;
    }

    /**
     * Remove all listeners for an event (or all events if no event specified).
     */
    removeAllListeners(eventName?: string): this {
        if (eventName) {
            this.listeners.delete(eventName);
        } else {
            this.listeners.clear();
        }
        return this;
    }
}