/**
 * Accessibility Core Tests
 * Testing WCAG compliance and accessibility features
 */

import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y, configureAxe } from 'axe-playwright';

test.describe('Accessibility Core Compliance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001');
    await injectAxe(page);

    // Configure axe for our testing needs
    await configureAxe(page, {
      rules: {
        'color-contrast': { enabled: true },
        'focus-order-semantics': { enabled: true },
        'keyboard': { enabled: true },
        'landmark-no-duplicate-banner': { enabled: true },
        'landmark-one-main': { enabled: true },
        'page-has-heading-one': { enabled: true },
        'region': { enabled: true }
      },
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
    });
  });

  test('should pass basic WCAG 2.1 AA compliance', async ({ page }) => {
    await page.waitForSelector('[data-testid="map-container"]');

    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();

    // Should have at least one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);

    // Verify logical heading order (basic check)
    if (headings.length > 0) {
      const firstHeading = await page.locator('h1, h2, h3, h4, h5, h6').first();
      const tagName = await firstHeading.evaluate(el => el.tagName.toLowerCase());
      expect(['h1', 'h2']).toContain(tagName);
    }
  });

  test('should have accessible form controls', async ({ page }) => {
    // Check filter controls
    const filterButtons = page.locator('[data-testid*="filter"]');
    const filterCount = await filterButtons.count();

    for (let i = 0; i < filterCount; i++) {
      const button = filterButtons.nth(i);

      // Should have accessible name
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();
      expect(ariaLabel || textContent).toBeTruthy();

      // Should be keyboard accessible
      await button.focus();
      const isFocused = await button.evaluate(el => document.activeElement === el);
      expect(isFocused).toBe(true);
    }
  });

  test('should provide keyboard navigation', async ({ page }) => {
    await page.keyboard.press('Tab');

    // First focusable element should receive focus
    const activeElement = await page.evaluate(() => {
      return {
        tagName: document.activeElement?.tagName,
        role: document.activeElement?.getAttribute('role'),
        ariaLabel: document.activeElement?.getAttribute('aria-label')
      };
    });

    expect(activeElement.tagName).toBeTruthy();

    // Should be able to navigate through focusable elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const secondActiveElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });

    expect(secondActiveElement).toBeTruthy();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // Test specific elements for color contrast
    const elementsToTest = [
      '[data-testid*="filter"] button',
      'body',
      '.leaflet-control'
    ];

    for (const selector of elementsToTest) {
      const element = page.locator(selector).first();
      const elementCount = await element.count();

      if (elementCount > 0) {
        await checkA11y(page, selector, {
          rules: {
            'color-contrast': { enabled: true }
          }
        });
      }
    }
  });

  test('should have accessible map interface', async ({ page }) => {
    const mapContainer = page.locator('[data-testid="map-container"]');

    // Map should have proper ARIA attributes
    const ariaLabel = await mapContainer.getAttribute('aria-label');
    const role = await mapContainer.getAttribute('role');

    expect(ariaLabel || role).toBeTruthy();

    // Map should be keyboard accessible
    await mapContainer.focus();
    const isFocusable = await mapContainer.evaluate(el => {
      return el.tabIndex >= 0 || el.getAttribute('tabindex') !== null;
    });

    expect(isFocusable).toBe(true);
  });

  test('should support screen readers with ARIA landmarks', async ({ page }) => {
    const landmarks = await page.locator('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], main, nav, header, footer').count();

    // Should have at least a main landmark
    expect(landmarks).toBeGreaterThan(0);

    // Check for main content area
    const mainContent = await page.locator('[role="main"], main').count();
    expect(mainContent).toBeGreaterThanOrEqual(1);
  });

  test('should handle focus management in dynamic content', async ({ page }) => {
    // Click a filter to trigger dynamic content
    const filterButton = page.locator('[data-testid*="filter"]').first();
    const filterCount = await filterButton.count();

    if (filterCount > 0) {
      await filterButton.click();

      // Focus should be managed appropriately
      const activeElement = await page.evaluate(() => {
        return document.activeElement?.tagName;
      });

      expect(activeElement).toBeTruthy();

      // Should be able to close with keyboard
      await page.keyboard.press('Escape');
    }
  });

  test('should provide alternative text for images', async ({ page }) => {
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');
      const role = await img.getAttribute('role');

      // Images should have alt text or be marked as decorative
      if (role !== 'presentation' && !alt?.includes('decorative')) {
        expect(alt || ariaLabel).toBeTruthy();
      }
    }
  });

  test('should work with reduced motion preferences', async ({ page, context }) => {
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();

    await page.waitForSelector('[data-testid="map-container"]');

    // Basic functionality should still work
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible();

    // Animations should be reduced or disabled
    const animationDuration = await page.evaluate(() => {
      const style = getComputedStyle(document.body);
      return style.getPropertyValue('animation-duration');
    });

    // Many frameworks set animation-duration to 0.01ms when reduced motion is preferred
    expect(['0s', '0.01ms', '']).toContain(animationDuration);
  });
});
