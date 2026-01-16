import { test, expect } from '@playwright/test';

test.describe('Landing Page - Core Functionality', () => {
  test('should load and display main heading', async ({ page }) => {
    await page.goto('/');

    // Check main heading
    const heading = page.locator('h1');
    await expect(heading).toContainText('IterateLike A Pro');
  });

  test('should display all main sections', async ({ page }) => {
    await page.goto('/');

    // Hero section
    await expect(page.locator('text=How I Built This Page With AI')).toBeVisible();

    // Workflow section
    await expect(page.locator('text=The Workflow: PIV × PRP')).toBeVisible();

    // Prompt Patterns section
    await expect(page.locator('text=Prompt Patterns Deep-Dive')).toBeVisible();

    // Pro Tips section
    await expect(page.locator('text=Pro Tips & Gotchas')).toBeVisible();
  });

  test('should have correct color scheme', async ({ page }) => {
    await page.goto('/');

    // Check if deep slate background is applied
    const body = page.locator('body');
    const backgroundColor = await body.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );

    expect(backgroundColor).toBe('rgb(10, 14, 39)'); // #0a0e27
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check if main content is visible on mobile
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();

    // Take screenshot for visual regression
    await page.screenshot({ path: 'test-results/mobile-home.png' });
  });

  test('should be responsive on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    // Check that key sections exist
    await expect(page.locator('#workflow')).toBeVisible();
    await expect(page.locator('#prompts')).toBeVisible();
    await expect(page.locator('#tips')).toBeVisible();

    // Take screenshot for visual regression
    await page.screenshot({ path: 'test-results/desktop-home.png', fullPage: true });
  });

  test('should have smooth scroll behavior', async ({ page }) => {
    await page.goto('/');

    // Test smooth scroll to workflow section
    await page.locator('#workflow').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Check if workflow section is in view
    const workflowSection = page.locator('#workflow');
    await expect(workflowSection).toBeInViewport();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Check h1 exists (only one)
    const h1s = page.locator('h1');
    await expect(h1s).toHaveCount(1);

    // Check h2s exist for sections
    const h2s = page.locator('h2');
    await expect(h2s).toHaveCount(3); // Workflow, Prompts, Tips
  });

  test('should load without console errors', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');

    // Wait a bit for any async errors
    await page.waitForTimeout(2000);

    expect(errors).toHaveLength(0);
  });
});

test.describe('Landing Page - Accessibility', () => {
  test('should have accessible heading structure', async ({ page }) => {
    await page.goto('/');

    // Check for single h1
    const h1s = page.locator('h1');
    await expect(h1s).toHaveCount(1);

    // Check for h2s in sections
    const h2s = page.locator('h2');
    await expect(h2s).toHaveCount(3);
  });

  test('should have color contrast (basic check)', async ({ page }) => {
    await page.goto('/');

    const heading = page.locator('h1');
    const color = await heading.evaluate((el) =>
      window.getComputedStyle(el).color
    );

    // Should not be transparent or extremely light
    expect(color).not.toBe('rgba(0, 0, 0, 0)');
  });
});
