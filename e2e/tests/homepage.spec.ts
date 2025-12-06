import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check page title
    await expect(page).toHaveTitle('Tuks Schedule Generator');

    // Check main heading
    await expect(page.getByRole('heading', { name: 'Tuks Schedule Generator', level: 1 })).toBeVisible();

    // Check hero description
    await expect(page.getByText(/Transform your Tuks PDF schedule/)).toBeVisible();

    // Check Get Started button (use first() to handle multiple matches)
    await expect(page.getByRole('link', { name: 'Get Started' }).first()).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check navigation links
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Upload' })).toBeVisible();

    // Test navigation to upload page
    await page.getByRole('link', { name: 'Upload' }).click();
    await expect(page).toHaveURL('http://localhost:3000/upload');
  });

  test('should display "How It Works" section', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check section heading
    await expect(page.getByRole('heading', { name: 'How It Works', level: 2 })).toBeVisible();

    // Check all three steps
    await expect(page.getByRole('heading', { name: 'Upload PDF', level: 3 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Preview Events', level: 3 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Export Calendar', level: 3 })).toBeVisible();
  });

  test('should have theme toggle', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check theme toggle exists (it's in the DOM but may be visually hidden)
    const themeToggle = page.getByRole('checkbox', { name: 'Toggle theme' });
    await expect(themeToggle).toBeAttached();
  });

  test('should have footer with correct information', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check footer content (use more specific selectors to avoid duplicates)
    const footer = page.getByRole('contentinfo');
    await expect(footer.getByText('Tuks Schedule Generator')).toBeVisible();
    await expect(footer.getByText('Convert your Tuks PDF schedule to calendar events')).toBeVisible();
    await expect(footer.getByText(/© 2025 All rights reserved/)).toBeVisible();
  });

  test('Get Started button should navigate to upload page', async ({ page }) => {
    await page.goto('http://localhost:3000');

    await page.getByRole('button', { name: 'Get Started' }).click();
    await expect(page).toHaveURL('http://localhost:3000/upload');
  });
});
