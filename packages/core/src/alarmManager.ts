import type { BearAuth } from './create.ts';
import { getInstance } from './instances.js';

export type AlarmId = number | string;

export type AlarmManager = {
    /**
     * Create a new alarm.
     * @returns The alarm ID.
     */
    createAlarm: (callback: () => Promise<void> | void, delay: number) => Promise<AlarmId> | AlarmId;

    /**
     * Clear an alarm.
     * @param id - The alarm ID.
     */
    clearAlarm: (id: AlarmId) => Promise<void> | void;
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
