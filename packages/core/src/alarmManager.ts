import type { BearAuth } from './create.ts';
import { getInstance } from './instances.js';

export type AlarmId = number | string;

export type AlarmCallback = () => Promise<void> | void;

export type AlarmManager = {
    /**
     * Create a new alarm.
     * @param callback - The callback to execute when the alarm triggers.
     * @param delay - The delay in milliseconds before the alarm triggers.
     * @returns The alarm ID.
     */
    createAlarm: (callback: AlarmCallback, delay: number) => Promise<AlarmId> | AlarmId;

    /**
     * Clear an alarm.
     * @param id - The alarm ID.
     * @param callback - The callback executed when the alarm triggered.
     */
    clearAlarm: (id: AlarmId, callback: AlarmCallback) => Promise<void> | void;
};

export function setAlarmManager(id: BearAuth<unknown>['id'], alarmManager: AlarmManager) {
    const { logger } = getInstance(id);

    logger.debug('[setAlarmManager]', 'Setting custom alarm manager...');

    getInstance(id).alarmManager = alarmManager;
}

export function createDefaultAlarmManager(): AlarmManager {
    return {
        createAlarm(callback, delay) {
            return globalThis.setTimeout(callback, delay) as unknown as number;
        },
        clearAlarm(id) {
            globalThis.clearTimeout(id);
        },
    };
}
