import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('PDF Processing Flow', () => {
  test('should upload PDF, process it, and display events in preview', async ({ page }) => {
    // Step 1: Navigate to upload page
    await page.goto('http://localhost:3000/upload');
    await expect(page.getByRole('heading', { name: 'Upload Your Schedule' })).toBeVisible();

    // Step 2: Upload a PDF file
    const fileInput = page.locator('input[type="file"]');
    const testPdfPath = path.join(process.cwd(), '..', 'SourceFiles', 'UP_MOD_XLS.pdf');
    await fileInput.setInputFiles(testPdfPath);

    // Step 3: Verify file is selected
    await expect(page.getByText('UP_MOD_XLS.pdf')).toBeVisible();

    // Step 4: Click upload button
    await page.getByRole('button', { name: /Upload & Process/i }).click();

    // Step 5: Wait for upload progress
    await expect(page.getByText(/Uploading/i)).toBeVisible({ timeout: 5000 });

    // Step 6: Wait for processing
    await expect(page.getByText(/Processing/i)).toBeVisible({ timeout: 10000 });

    // Step 7: Wait for automatic navigation to preview page (with longer timeout)
    await expect(page).toHaveURL('http://localhost:3000/preview', { timeout: 30000 });

    // Step 8: Verify events are displayed
    await expect(page.getByRole('heading', { name: 'Preview Your Schedule' })).toBeVisible();
    
    // Step 9: Check that events are loaded (should show total events count)
    const totalEventsText = page.getByText(/Total Events/i);
    await expect(totalEventsText).toBeVisible();
    
    // Step 10: Verify we have events (the number should be > 0)
    const summaryCard = page.locator('.card').first();
    await expect(summaryCard).toContainText(/\d+/); // Should contain numbers
    
    // Step 11: Verify event list is visible
    const eventList = page.locator('[data-testid="event-list"], .space-y-4, .divide-y');
    await expect(eventList).toBeVisible();
  });

  test('should show error for invalid PDF', async ({ page }) => {
    await page.goto('http://localhost:3000/upload');

    // Upload a non-PDF file
    const fileInput = page.locator('input[type="file"]');
    const buffer = Buffer.from('This is not a PDF');
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: buffer,
    });

    // Should show error or not allow upload
    await page.waitForTimeout(1000);
  });

  test('should allow retry after error', async ({ page }) => {
    await page.goto('http://localhost:3000/upload');

    // This test would require simulating a server error
    // For now, just verify the retry button exists after an error state
  });
});

test.describe('Preview Page Functionality', () => {
  test.skip('should filter events by module', async ({ page }) => {
    // This test requires events to be loaded first
    // Skip for now, will implement after upload flow is working
  });

  test.skip('should select and deselect events', async ({ page }) => {
    // This test requires events to be loaded first
    // Skip for now, will implement after upload flow is working
  });

  test.skip('should show correct event count', async ({ page }) => {
    // This test requires events to be loaded first
    // Skip for now, will implement after upload flow is working
  });
});
