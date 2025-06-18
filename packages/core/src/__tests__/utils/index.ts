export function getTestInstanceId(): string {
    return `test-instance-${Math.random().toString(36).substring(2, 15)}`;
}
