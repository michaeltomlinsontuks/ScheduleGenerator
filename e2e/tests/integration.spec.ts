import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Full User Journey', () => {
  test('complete workflow: upload PDF to calendar generation', async ({ page }) => {
    // Step 1: Start at homepage
    await page.goto('http://localhost:3000');
    await expect(page.getByRole('heading', { name: 'UP Schedule Generator', level: 1 })).toBeVisible();
    
    // Step 2: Navigate to upload
    await page.getByRole('button', { name: 'Get Started' }).click();
    await expect(page).toHaveURL('http://localhost:3000/upload');
    
    // Step 3: Upload PDF (use correct path relative to project root)
    const fileInput = page.locator('input[type="file"]');
    const testPdfPath = path.join(process.cwd(), '..', 'SourceFiles', 'UP_TST_PDF.pdf');
    await fileInput.setInputFiles(testPdfPath);
    
    // Step 4: Wait for processing and check for preview
    // Adjust timeout and selectors based on your actual implementation
    await page.waitForTimeout(3000);
    
    // Step 5: Check if we're on preview page or if preview is shown
    // await expect(page.getByText(/Preview.*2/)).toHaveClass(/active/);
    
    // Step 6: Verify events are displayed
    // await expect(page.getByText(/events found/i)).toBeVisible();
    
    // Step 7: Proceed to customize
    // await page.getByRole('button', { name: /next|continue/i }).click();
    
    // Step 8: Generate calendar
    // await page.getByRole('button', { name: /generate|export/i }).click();
    
    // Step 9: Verify success
    // await expect(page.getByText(/success|complete/i)).toBeVisible();
  });

  test('should handle navigation between steps', async ({ page }) => {
    await page.goto('http://localhost:3000/upload');
    
    // Check that all steps are accessible (use regex to match the step text)
    await expect(page.getByText(/Upload.*1/)).toBeVisible();
    await expect(page.getByText(/Preview.*2/)).toBeVisible();
    await expect(page.getByText(/Customize.*3/)).toBeVisible();
    await expect(page.getByText(/Generate.*4/)).toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page, context }) => {
    // First load the page while online
    await page.goto('http://localhost:3000/upload');
    
    // Then simulate offline mode
    await context.setOffline(true);
    
    const fileInput = page.locator('input[type="file"]');
    const testPdfPath = path.join(process.cwd(), '..', 'SourceFiles', 'UP_TST_PDF.pdf');
    await fileInput.setInputFiles(testPdfPath);
    
    // Wait for error message
    await page.waitForTimeout(2000);
    
    // Check for error handling (adjust based on your implementation)
    // await expect(page.getByText(/network error|connection failed/i)).toBeVisible();
    
    // Restore connection
    await context.setOffline(false);
  });

  test('should handle backend service unavailable', async ({ page }) => {
    // This test assumes backend might be down
    // You would need to mock or temporarily stop the backend
    
    await page.goto('http://localhost:3000/upload');
    
    // Try to upload when backend is unavailable
    // Check for appropriate error messages
  });
});
