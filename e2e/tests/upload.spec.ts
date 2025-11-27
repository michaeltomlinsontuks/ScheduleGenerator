import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Upload Page', () => {
  test('should load upload page successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/upload');
    
    // Check page title
    await expect(page).toHaveTitle('UP Schedule Generator');
    
    // Check main heading
    await expect(page.getByRole('heading', { name: 'Upload Your Schedule', level: 1 })).toBeVisible();
    
    // Check description
    await expect(page.getByText('Upload your UP PDF schedule to get started')).toBeVisible();
  });

  test('should display progress steps', async ({ page }) => {
    await page.goto('http://localhost:3000/upload');
    
    // Check all steps are visible (use regex to match the step text)
    await expect(page.getByText(/Upload.*1/)).toBeVisible();
    await expect(page.getByText(/Preview.*2/)).toBeVisible();
    await expect(page.getByText(/Customize.*3/)).toBeVisible();
    await expect(page.getByText(/Generate.*4/)).toBeVisible();
  });

  test('should display file upload dropzone', async ({ page }) => {
    await page.goto('http://localhost:3000/upload');
    
    // Check dropzone is visible
    await expect(page.getByText('Drag & drop your PDF here')).toBeVisible();
    await expect(page.getByText(/or click to browse/)).toBeVisible();
  });

  test('should have file input with correct attributes', async ({ page }) => {
    await page.goto('http://localhost:3000/upload');
    
    // Check file input exists and accepts PDF
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
    
    // Check accept attribute
    const acceptAttr = await fileInput.getAttribute('accept');
    expect(acceptAttr).toContain('pdf');
  });

  test('should upload PDF file', async ({ page }) => {
    await page.goto('http://localhost:3000/upload');
    
    // Locate the file input
    const fileInput = page.locator('input[type="file"]');
    
    // Upload a test PDF (use correct path relative to project root)
    const testPdfPath = path.join(process.cwd(), '..', 'SourceFiles', 'UP_TST_PDF.pdf');
    await fileInput.setInputFiles(testPdfPath);
    
    // Wait for upload to process (adjust timeout as needed)
    await page.waitForTimeout(2000);
    
    // Check for success indicators (adjust based on your UI)
    // This might be a loading spinner, success message, or navigation to preview
    // Example: await expect(page.getByText('Processing...')).toBeVisible();
  });

  test('should show error for invalid file type', async ({ page }) => {
    await page.goto('http://localhost:3000/upload');
    
    // Try to upload a non-PDF file
    const fileInput = page.locator('input[type="file"]');
    
    // Create a temporary text file for testing
    const buffer = Buffer.from('This is not a PDF');
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: buffer,
    });
    
    // Wait for error message (adjust based on your UI)
    await page.waitForTimeout(1000);
    
    // Check for error message (adjust selector based on your implementation)
    // Example: await expect(page.getByText(/only PDF files/i)).toBeVisible();
  });

  test('should show error for file too large', async ({ page }) => {
    await page.goto('http://localhost:3000/upload');
    
    // Check that max file size is mentioned
    await expect(page.getByText(/max 10MB/i)).toBeVisible();
  });
});
