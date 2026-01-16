/**
 * Theme fixtures for Playwright tests
 * Provides design token values for testing
 */

import { test as base } from '@playwright/test';

export const expectedColors = {
  neonOrange: '#ff6b35',
  neonOrangeRgb: 'rgb(255, 107, 53)',
  teal: '#00d9c0',
  tealRgb: 'rgb(0, 217, 192)',
  deepSlate: '#0a0e27',
  deepSlateRgb: 'rgb(10, 14, 39)',
  slateDark: '#0f1529',
  slateDarkRgb: 'rgb(15, 21, 41)',
  slateLight: '#1a2133',
  slateLightRgb: 'rgb(26, 33, 51)',
};

export const expectedBreakpoints = {
  mobile: 375,
  tablet: 768,
  desktop: 1920,
};

export const test = base.extend({
  cyberpunkTheme: async ({ page }, use) => {
    await page.goto('/');

    // Verify theme colors are present
    const hasOrange = await page.locator('text=Iterate').isVisible();
    const hasDeepSlate = await page.evaluate(() => {
      const body = window.getComputedStyle(document.body);
      return body.backgroundColor === 'rgb(10, 14, 39)' ||
             body.backgroundColor === 'rgb(15, 21, 41)';
    });

    await use({
      colors: expectedColors,
      breakpoints: expectedBreakpoints,
      isApplied: hasOrange && hasDeepSlate,
    });
  },

  landingPage: async ({ page }, use) => {
    const LandingPage = (await import('../pages/LandingPage.js')).default;
    await use(new LandingPage(page));
  },
});

export const expect = test.expect;
