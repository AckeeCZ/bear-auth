import type { authenticateInner } from './authenticate.ts';
import type { BearAuth } from './create.ts';
import type { getAccessTokenInner } from './getAccessToken.ts';
import type { FetchAuthInfoHook } from './hooks/setFetchAuthInfoHook.ts';
import type { LogoutHook } from './hooks/setLogoutHook.ts';
import type { RefreshTokenHook } from './hooks/setRefreshTokenHook.ts';
import type { retrieveAuthSessionInner } from './retrieveAuthSession.ts';

type Tasks<AuthInfo> = Readonly<{
    logout: LogoutHook<AuthInfo>['action'];
    triggerRefreshToken: RefreshTokenHook<AuthInfo>['action'];
    fetchAuthInfo: FetchAuthInfoHook<AuthInfo>['action'];
    retrieveAuthSession: typeof retrieveAuthSessionInner<AuthInfo>;
    authenticate: typeof authenticateInner<AuthInfo>;
    getAccessToken: typeof getAccessTokenInner;
}>;

type TaskIds = keyof Tasks<unknown>;
type InstanceId = BearAuth<unknown>['id'];
type GenericCallback = Promise<unknown>;

const instanceTasks = new Map<InstanceId, Map<TaskIds, GenericCallback>>();

export function getInstanceTasks(id: InstanceId) {
    const tasks = instanceTasks.get(id) ?? new Map<TaskIds, GenericCallback>();

    instanceTasks.set(id, tasks);

    return tasks;
}

/**
 * Handle mutliple calls of async functions.
 * E.g. when the `logout` method is called multiple times, it's internally called only once per instance, then it returns the same promise.
 * The same applies for the `refreshToken`, `fetchAuthInfo`, etc.
 */
export function registerTask<AuthInfo, TaskId extends keyof Tasks<AuthInfo>, Callback extends Tasks<AuthInfo>[TaskId]>(
    id: BearAuth<AuthInfo>['id'],
    taskId: TaskId,
    callback: Callback,
) {
    const tasks = getInstanceTasks(id);

    function runTask(...args: Parameters<Callback>) {
        if (tasks.has(taskId)) {
            return tasks.get(taskId)!;
        }

        const task = (async () => {
            try {
                // @ts-expect-error – generics aren't preserved when passing the callback around
                return await callback(...args);
            } finally {
                tasks.delete(taskId);
            }
        })();

        tasks.set(taskId, task);

        return task;
    }

    return runTask as Callback;
}

export function allTasksSettled(id: InstanceId) {
    const tasks = getInstanceTasks(id);

    return Promise.allSettled(Array.from(tasks.values()));
}

export function deleteInstanceTasks(id: InstanceId) {
    instanceTasks.delete(id);
}
