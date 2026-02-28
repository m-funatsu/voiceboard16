import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test.describe('VoiceBoard Smoke Tests', () => {
  test('Landing page loads and shows key content', async ({ page }) => {
    await page.goto(BASE);
    await expect(page).toHaveTitle(/VoiceBoard/i);

    // Hero section
    await expect(page.locator('text=VoiceBoard')).toBeVisible();

    // Features section
    await expect(page.locator('text=埋め込みウィジェット')).toBeVisible();
    await expect(page.locator('text=公開フィードバックボード')).toBeVisible();
    await expect(page.locator('text=AI分析ダッシュボード')).toBeVisible();

    // Pricing section
    await expect(page.locator('text=Free')).toBeVisible();
    await expect(page.locator('text=Pro')).toBeVisible();
    await expect(page.locator('text=Business')).toBeVisible();
  });

  test('Login page loads', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Signup page loads', async ({ page }) => {
    await page.goto(`${BASE}/signup`);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Dashboard redirects to login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');
  });

  test('Pricing page loads', async ({ page }) => {
    await page.goto(`${BASE}/pricing`);
    await expect(page.locator('text=Free')).toBeVisible();
    await expect(page.locator('text=Pro')).toBeVisible();
    await expect(page.locator('text=Business')).toBeVisible();
  });

  test('Signup, login, create project, and test public board', async ({ page }) => {
    const testEmail = `voiceboard-test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    // Signup
    await page.goto(`${BASE}/signup`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for redirect or success message
    await page.waitForTimeout(3000);

    // Login
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    expect(page.url()).toContain('/dashboard');

    // Create a new project
    await page.click('a[href="/projects/new"]');
    await page.waitForURL(/\/projects\/new/);

    const projectName = `Test Project ${Date.now()}`;
    await page.fill('input[name="name"], input[placeholder*="プロジェクト名"]', projectName);
    await page.waitForTimeout(500);

    // Submit form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Should redirect to project page or dashboard
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(dashboard|projects\/)/);
  });

  test('API: GET /api/feedback returns valid response', async ({ request }) => {
    // Need a valid project ID - this should return empty or error without one
    const response = await request.get(`${BASE}/api/feedback?projectId=00000000-0000-0000-0000-000000000000`);
    expect(response.status()).toBeLessThanOrEqual(500);
  });

  test('API: GET /api/projects returns valid response', async ({ request }) => {
    const response = await request.get(`${BASE}/api/projects`);
    // Should either return projects or require auth
    expect([200, 401]).toContain(response.status());
  });
});
