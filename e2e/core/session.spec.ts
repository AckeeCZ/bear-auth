import { expect, test } from '@playwright/test';

test('auth session (smoke test)', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await expect(page.getByTestId('auth-status')).toContainText('Status: unauthenticated');

    await page.getByTestId('authenticate-button').click();
    await expect(page.getByTestId('auth-status')).toContainText('Status: authenticated');

    await page.reload();
    await expect(page.getByTestId('auth-status')).toContainText('Status: authenticated');

    await page.getByTestId('logout-button').click();
    await expect(page.getByTestId('auth-status')).toContainText('Status: unauthenticated');
});
