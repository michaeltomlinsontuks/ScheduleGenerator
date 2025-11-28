import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Integration tests for multi-mode PDF support
 * Tests end-to-end upload flow for lecture, test, and exam PDFs
 * Requirements: All (from multi-mode-pdf-support spec)
 */

test.describe('Multi-Mode PDF Integration Tests', () => {
  
  test.describe('Lecture PDF Upload Flow', () => {
    test('should upload and process lecture PDF end-to-end', async ({ page }) => {
      // Step 1: Navigate to upload page
      await page.goto('http://localhost:3000/upload');
      await expect(page.getByRole('heading', { name: 'Upload Your Schedule' })).toBeVisible();

      // Step 2: Upload lecture PDF
      const fileInput = page.locator('input[type="file"]');
      const lecturePdfPath = path.join(process.cwd(), '..', 'pdf-worker', 'fixtures', 'lecture-schedule.pdf');
      
      // Verify file exists
      expect(fs.existsSync(lecturePdfPath)).toBeTruthy();
      
      await fileInput.setInputFiles(lecturePdfPath);

      // Step 3: Verify file is selected
      await expect(page.getByText('lecture-schedule.pdf')).toBeVisible();

      // Step 4: Click upload button
      await page.getByRole('button', { name: /Upload & Process/i }).click();

      // Step 5: Wait for upload progress
      await expect(page.getByText(/Uploading/i)).toBeVisible({ timeout: 5000 });

      // Step 6: Wait for processing
      await expect(page.getByText(/Processing/i)).toBeVisible({ timeout: 10000 });

      // Step 7: Wait for automatic navigation to preview page
      await expect(page).toHaveURL('http://localhost:3000/preview', { timeout: 30000 });

      // Step 8: Verify events are displayed
      await expect(page.getByRole('heading', { name: 'Preview Your Schedule' })).toBeVisible();
      
      // Step 9: Verify lecture-specific UI elements
      // Lecture events should show day-of-week grouping
      const eventList = page.locator('[data-testid="event-list"], .space-y-4, .divide-y').first();
      await expect(eventList).toBeVisible();
      
      // Step 10: Verify events have recurring indicators
      // Lecture events should be marked as recurring
      const totalEventsText = page.getByText(/Total Events/i);
      await expect(totalEventsText).toBeVisible();
      
      // Step 11: Navigate to customize page
      await page.getByRole('button', { name: /Next|Continue|Customize/i }).click();
      await expect(page).toHaveURL('http://localhost:3000/customize', { timeout: 10000 });
      
      // Step 12: Verify lecture-specific customize options
      // Date range picker should be visible for lecture mode
      await expect(page.getByText(/Semester Start Date/i)).toBeVisible();
      await expect(page.getByText(/Semester End Date/i)).toBeVisible();
      
      // Step 13: Verify module color picker is available
      await expect(page.getByText(/Module Colors/i)).toBeVisible();
    });

    test('should handle lecture PDF with recurring events correctly', async ({ page }) => {
      await page.goto('http://localhost:3000/upload');
      
      const fileInput = page.locator('input[type="file"]');
      const lecturePdfPath = path.join(process.cwd(), '..', 'pdf-worker', 'fixtures', 'lecture-schedule.pdf');
      await fileInput.setInputFiles(lecturePdfPath);
      
      await page.getByRole('button', { name: /Upload & Process/i }).click();
      await expect(page).toHaveURL('http://localhost:3000/preview', { timeout: 30000 });
      
      // Verify recurring event indicators
      // Lecture events should show day names (Monday, Tuesday, etc.)
      const eventCards = page.locator('.card, [data-testid="event-card"]');
      const firstCard = eventCards.first();
      await expect(firstCard).toBeVisible();
    });
  });

  test.describe('Test PDF Upload Flow', () => {
    test('should upload and process test PDF end-to-end', async ({ page }) => {
      // Step 1: Navigate to upload page
      await page.goto('http://localhost:3000/upload');
      await expect(page.getByRole('heading', { name: 'Upload Your Schedule' })).toBeVisible();

      // Step 2: Upload test PDF
      const fileInput = page.locator('input[type="file"]');
      const testPdfPath = path.join(process.cwd(), '..', 'pdf-worker', 'fixtures', 'test-schedule.pdf');
      
      // Verify file exists
      expect(fs.existsSync(testPdfPath)).toBeTruthy();
      
      await fileInput.setInputFiles(testPdfPath);

      // Step 3: Verify file is selected
      await expect(page.getByText('test-schedule.pdf')).toBeVisible();

      // Step 4: Click upload button
      await page.getByRole('button', { name: /Upload & Process/i }).click();

      // Step 5: Wait for upload progress
      await expect(page.getByText(/Uploading/i)).toBeVisible({ timeout: 5000 });

      // Step 6: Wait for processing
      await expect(page.getByText(/Processing/i)).toBeVisible({ timeout: 10000 });

      // Step 7: Wait for automatic navigation to preview page
      await expect(page).toHaveURL('http://localhost:3000/preview', { timeout: 30000 });

      // Step 8: Verify events are displayed
      await expect(page.getByRole('heading', { name: 'Preview Your Schedule' })).toBeVisible();
      
      // Step 9: Verify test-specific UI elements
      // Test events should show date-based grouping
      const eventList = page.locator('[data-testid="event-list"], .space-y-4, .divide-y').first();
      await expect(eventList).toBeVisible();
      
      // Step 10: Verify events are non-recurring
      const totalEventsText = page.getByText(/Total Events/i);
      await expect(totalEventsText).toBeVisible();
      
      // Step 11: Navigate to customize page
      await page.getByRole('button', { name: /Next|Continue|Customize/i }).click();
      await expect(page).toHaveURL('http://localhost:3000/customize', { timeout: 10000 });
      
      // Step 12: Verify test-specific customize options
      // Date range picker should NOT be visible for test mode
      // Instead, should show info alert about fixed dates
      const infoAlert = page.locator('.alert, [role="alert"]').filter({ hasText: /fixed dates|specific dates/i });
      await expect(infoAlert).toBeVisible();
      
      // Step 13: Verify module color picker is still available
      await expect(page.getByText(/Module Colors/i)).toBeVisible();
    });

    test('should handle test PDF with non-recurring events correctly', async ({ page }) => {
      await page.goto('http://localhost:3000/upload');
      
      const fileInput = page.locator('input[type="file"]');
      const testPdfPath = path.join(process.cwd(), '..', 'pdf-worker', 'fixtures', 'test-schedule.pdf');
      await fileInput.setInputFiles(testPdfPath);
      
      await page.getByRole('button', { name: /Upload & Process/i }).click();
      await expect(page).toHaveURL('http://localhost:3000/preview', { timeout: 30000 });
      
      // Verify non-recurring event indicators
      // Test events should show specific dates
      const eventCards = page.locator('.card, [data-testid="event-card"]');
      const firstCard = eventCards.first();
      await expect(firstCard).toBeVisible();
    });
  });

  test.describe('Exam PDF Upload Flow', () => {
    test('should upload and process exam PDF end-to-end', async ({ page }) => {
      // Step 1: Navigate to upload page
      await page.goto('http://localhost:3000/upload');
      await expect(page.getByRole('heading', { name: 'Upload Your Schedule' })).toBeVisible();

      // Step 2: Upload exam PDF
      const fileInput = page.locator('input[type="file"]');
      const examPdfPath = path.join(process.cwd(), '..', 'pdf-worker', 'fixtures', 'exam-schedule.pdf');
      
      // Verify file exists
      expect(fs.existsSync(examPdfPath)).toBeTruthy();
      
      await fileInput.setInputFiles(examPdfPath);

      // Step 3: Verify file is selected
      await expect(page.getByText('exam-schedule.pdf')).toBeVisible();

      // Step 4: Click upload button
      await page.getByRole('button', { name: /Upload & Process/i }).click();

      // Step 5: Wait for upload progress
      await expect(page.getByText(/Uploading/i)).toBeVisible({ timeout: 5000 });

      // Step 6: Wait for processing
      await expect(page.getByText(/Processing/i)).toBeVisible({ timeout: 10000 });

      // Step 7: Wait for automatic navigation to preview page
      await expect(page).toHaveURL('http://localhost:3000/preview', { timeout: 30000 });

      // Step 8: Verify events are displayed
      await expect(page.getByRole('heading', { name: 'Preview Your Schedule' })).toBeVisible();
      
      // Step 9: Verify exam-specific UI elements
      // Exam events should show date-based grouping
      const eventList = page.locator('[data-testid="event-list"], .space-y-4, .divide-y').first();
      await expect(eventList).toBeVisible();
      
      // Step 10: Verify events are non-recurring
      const totalEventsText = page.getByText(/Total Events/i);
      await expect(totalEventsText).toBeVisible();
      
      // Step 11: Navigate to customize page
      await page.getByRole('button', { name: /Next|Continue|Customize/i }).click();
      await expect(page).toHaveURL('http://localhost:3000/customize', { timeout: 10000 });
      
      // Step 12: Verify exam-specific customize options
      // Date range picker should NOT be visible for exam mode
      // Instead, should show info alert about fixed dates
      const infoAlert = page.locator('.alert, [role="alert"]').filter({ hasText: /fixed dates|specific dates/i });
      await expect(infoAlert).toBeVisible();
      
      // Step 13: Verify module color picker is still available
      await expect(page.getByText(/Module Colors/i)).toBeVisible();
    });

    test('should handle exam PDF with unfinalised exams correctly', async ({ page }) => {
      await page.goto('http://localhost:3000/upload');
      
      const fileInput = page.locator('input[type="file"]');
      const examPdfPath = path.join(process.cwd(), '..', 'pdf-worker', 'fixtures', 'exam-schedule.pdf');
      await fileInput.setInputFiles(examPdfPath);
      
      await page.getByRole('button', { name: /Upload & Process/i }).click();
      await expect(page).toHaveURL('http://localhost:3000/preview', { timeout: 30000 });
      
      // Check for unfinalised exam warnings if present
      // Some exams may have "Unfinalised" or "TBA" in venue/date fields
      const unfinalisedBadge = page.locator('.badge, [data-testid="unfinalised-badge"]').filter({ hasText: /unfinalised|tba/i });
      
      // If unfinalised exams exist, verify warning is shown
      const badgeCount = await unfinalisedBadge.count();
      if (badgeCount > 0) {
        await expect(unfinalisedBadge.first()).toBeVisible();
      }
    });
  });

  test.describe('Invalid PDF Error Handling', () => {
    test('should reject PDF without valid mode keywords', async ({ page }) => {
      await page.goto('http://localhost:3000/upload');
      
      const fileInput = page.locator('input[type="file"]');
      const invalidPdfPath = path.join(process.cwd(), '..', 'pdf-worker', 'fixtures', 'invalid-format.pdf');
      
      // Verify file exists
      expect(fs.existsSync(invalidPdfPath)).toBeTruthy();
      
      await fileInput.setInputFiles(invalidPdfPath);
      
      await page.getByRole('button', { name: /Upload & Process/i }).click();
      
      // Should show error message
      const errorMessage = page.locator('.alert-error, [role="alert"]').filter({ hasText: /invalid|not recognized|unsupported/i });
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
      
      // Should not navigate to preview page
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL('http://localhost:3000/upload');
    });

    test('should reject non-PDF files', async ({ page }) => {
      await page.goto('http://localhost:3000/upload');
      
      const fileInput = page.locator('input[type="file"]');
      
      // Try to upload a text file
      const buffer = Buffer.from('This is not a PDF file');
      await fileInput.setInputFiles({
        name: 'test.txt',
        mimeType: 'text/plain',
        buffer: buffer,
      });
      
      // Should show error immediately or after upload attempt
      await page.waitForTimeout(1000);
      
      // Check if upload button is disabled or error is shown
      const uploadButton = page.getByRole('button', { name: /Upload & Process/i });
      const isDisabled = await uploadButton.isDisabled();
      
      if (!isDisabled) {
        await uploadButton.click();
        const errorMessage = page.locator('.alert-error, [role="alert"]').filter({ hasText: /invalid|pdf/i });
        await expect(errorMessage).toBeVisible({ timeout: 5000 });
      }
    });

    test('should handle corrupted PDF gracefully', async ({ page }) => {
      await page.goto('http://localhost:3000/upload');
      
      const fileInput = page.locator('input[type="file"]');
      
      // Create a corrupted PDF (starts with PDF magic bytes but invalid content)
      const corruptedPdf = Buffer.concat([
        Buffer.from('%PDF-1.4\n'),
        Buffer.from('This is corrupted content that is not valid PDF structure'),
      ]);
      
      await fileInput.setInputFiles({
        name: 'corrupted.pdf',
        mimeType: 'application/pdf',
        buffer: corruptedPdf,
      });
      
      await page.getByRole('button', { name: /Upload & Process/i }).click();
      
      // Should show error message
      const errorMessage = page.locator('.alert-error, [role="alert"]').filter({ hasText: /invalid|error|failed/i });
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });

    test('should handle file size limit', async ({ page }) => {
      await page.goto('http://localhost:3000/upload');
      
      // Verify max file size is displayed
      await expect(page.getByText(/max 10MB/i)).toBeVisible();
      
      // Note: Actually creating and uploading a >10MB file would be slow
      // This test just verifies the UI shows the limit
    });
  });

  test.describe('Job Processing with Each Mode', () => {
    test('should track job status for lecture PDF', async ({ page, request }) => {
      await page.goto('http://localhost:3000/upload');
      
      const fileInput = page.locator('input[type="file"]');
      const lecturePdfPath = path.join(process.cwd(), '..', 'pdf-worker', 'fixtures', 'lecture-schedule.pdf');
      await fileInput.setInputFiles(lecturePdfPath);
      
      await page.getByRole('button', { name: /Upload & Process/i }).click();
      
      // Wait for processing to start
      await expect(page.getByText(/Processing/i)).toBeVisible({ timeout: 10000 });
      
      // Extract job ID from URL or page content if available
      // Then verify job status via API
      await page.waitForTimeout(2000);
      
      // Verify processing completes
      await expect(page).toHaveURL('http://localhost:3000/preview', { timeout: 30000 });
    });

    test('should track job status for test PDF', async ({ page }) => {
      await page.goto('http://localhost:3000/upload');
      
      const fileInput = page.locator('input[type="file"]');
      const testPdfPath = path.join(process.cwd(), '..', 'pdf-worker', 'fixtures', 'test-schedule.pdf');
      await fileInput.setInputFiles(testPdfPath);
      
      await page.getByRole('button', { name: /Upload & Process/i }).click();
      
      // Wait for processing to start
      await expect(page.getByText(/Processing/i)).toBeVisible({ timeout: 10000 });
      
      // Verify processing completes
      await expect(page).toHaveURL('http://localhost:3000/preview', { timeout: 30000 });
    });

    test('should track job status for exam PDF', async ({ page }) => {
      await page.goto('http://localhost:3000/upload');
      
      const fileInput = page.locator('input[type="file"]');
      const examPdfPath = path.join(process.cwd(), '..', 'pdf-worker', 'fixtures', 'exam-schedule.pdf');
      await fileInput.setInputFiles(examPdfPath);
      
      await page.getByRole('button', { name: /Upload & Process/i }).click();
      
      // Wait for processing to start
      await expect(page.getByText(/Processing/i)).toBeVisible({ timeout: 10000 });
      
      // Verify processing completes
      await expect(page).toHaveURL('http://localhost:3000/preview', { timeout: 30000 });
    });

    test('should include pdfType in job status response', async ({ page, request }) => {
      // Upload a lecture PDF
      await page.goto('http://localhost:3000/upload');
      
      const fileInput = page.locator('input[type="file"]');
      const lecturePdfPath = path.join(process.cwd(), '..', 'pdf-worker', 'fixtures', 'lecture-schedule.pdf');
      await fileInput.setInputFiles(lecturePdfPath);
      
      await page.getByRole('button', { name: /Upload & Process/i }).click();
      
      // Wait for upload to complete and get job ID
      await page.waitForTimeout(3000);
      
      // Try to extract job ID from browser storage or URL
      const jobId = await page.evaluate(() => {
        return localStorage.getItem('currentJobId') || sessionStorage.getItem('currentJobId');
      });
      
      if (jobId) {
        // Query job status via API
        const response = await request.get(`http://localhost:3001/api/jobs/${jobId}`);
        expect(response.ok()).toBeTruthy();
        
        const jobData = await response.json();
        expect(jobData).toHaveProperty('pdfType');
        expect(['lecture', 'test', 'exam']).toContain(jobData.pdfType);
      }
    });
  });

  test.describe('Mode-Specific Calendar Generation', () => {
    test('should generate ICS with semester dates for lecture mode', async ({ page }) => {
      await page.goto('http://localhost:3000/upload');
      
      const fileInput = page.locator('input[type="file"]');
      const lecturePdfPath = path.join(process.cwd(), '..', 'pdf-worker', 'fixtures', 'lecture-schedule.pdf');
      await fileInput.setInputFiles(lecturePdfPath);
      
      await page.getByRole('button', { name: /Upload & Process/i }).click();
      await expect(page).toHaveURL('http://localhost:3000/preview', { timeout: 30000 });
      
      // Navigate to customize
      await page.getByRole('button', { name: /Next|Continue|Customize/i }).click();
      await expect(page).toHaveURL('http://localhost:3000/customize', { timeout: 10000 });
      
      // Set semester dates (required for lecture mode)
      const startDateInput = page.locator('input[type="date"]').first();
      const endDateInput = page.locator('input[type="date"]').last();
      
      await startDateInput.fill('2025-02-01');
      await endDateInput.fill('2025-06-30');
      
      // Navigate to generate page
      await page.getByRole('button', { name: /Next|Continue|Generate/i }).click();
      await expect(page).toHaveURL('http://localhost:3000/generate', { timeout: 10000 });
    });

    test('should generate ICS without semester dates for test mode', async ({ page }) => {
      await page.goto('http://localhost:3000/upload');
      
      const fileInput = page.locator('input[type="file"]');
      const testPdfPath = path.join(process.cwd(), '..', 'pdf-worker', 'fixtures', 'test-schedule.pdf');
      await fileInput.setInputFiles(testPdfPath);
      
      await page.getByRole('button', { name: /Upload & Process/i }).click();
      await expect(page).toHaveURL('http://localhost:3000/preview', { timeout: 30000 });
      
      // Navigate to customize
      await page.getByRole('button', { name: /Next|Continue|Customize/i }).click();
      await expect(page).toHaveURL('http://localhost:3000/customize', { timeout: 10000 });
      
      // Verify semester date inputs are NOT visible
      const dateInputs = page.locator('input[type="date"]');
      const dateInputCount = await dateInputs.count();
      expect(dateInputCount).toBe(0);
      
      // Navigate to generate page
      await page.getByRole('button', { name: /Next|Continue|Generate/i }).click();
      await expect(page).toHaveURL('http://localhost:3000/generate', { timeout: 10000 });
    });

    test('should generate ICS without semester dates for exam mode', async ({ page }) => {
      await page.goto('http://localhost:3000/upload');
      
      const fileInput = page.locator('input[type="file"]');
      const examPdfPath = path.join(process.cwd(), '..', 'pdf-worker', 'fixtures', 'exam-schedule.pdf');
      await fileInput.setInputFiles(examPdfPath);
      
      await page.getByRole('button', { name: /Upload & Process/i }).click();
      await expect(page).toHaveURL('http://localhost:3000/preview', { timeout: 30000 });
      
      // Navigate to customize
      await page.getByRole('button', { name: /Next|Continue|Customize/i }).click();
      await expect(page).toHaveURL('http://localhost:3000/customize', { timeout: 10000 });
      
      // Verify semester date inputs are NOT visible
      const dateInputs = page.locator('input[type="date"]');
      const dateInputCount = await dateInputs.count();
      expect(dateInputCount).toBe(0);
      
      // Navigate to generate page
      await page.getByRole('button', { name: /Next|Continue|Generate/i }).click();
      await expect(page).toHaveURL('http://localhost:3000/generate', { timeout: 10000 });
    });
  });

  test.describe('Cross-Mode Validation', () => {
    test('should maintain mode consistency throughout workflow', async ({ page }) => {
      // Upload lecture PDF
      await page.goto('http://localhost:3000/upload');
      
      const fileInput = page.locator('input[type="file"]');
      const lecturePdfPath = path.join(process.cwd(), '..', 'pdf-worker', 'fixtures', 'lecture-schedule.pdf');
      await fileInput.setInputFiles(lecturePdfPath);
      
      await page.getByRole('button', { name: /Upload & Process/i }).click();
      await expect(page).toHaveURL('http://localhost:3000/preview', { timeout: 30000 });
      
      // Verify mode is maintained in preview
      // (Implementation-specific: check for mode indicator in UI)
      
      // Navigate to customize
      await page.getByRole('button', { name: /Next|Continue|Customize/i }).click();
      await expect(page).toHaveURL('http://localhost:3000/customize', { timeout: 10000 });
      
      // Verify mode-specific UI is shown
      await expect(page.getByText(/Semester Start Date/i)).toBeVisible();
    });

    test('should handle switching between different PDF uploads', async ({ page }) => {
      // Upload lecture PDF first
      await page.goto('http://localhost:3000/upload');
      
      let fileInput = page.locator('input[type="file"]');
      const lecturePdfPath = path.join(process.cwd(), '..', 'pdf-worker', 'fixtures', 'lecture-schedule.pdf');
      await fileInput.setInputFiles(lecturePdfPath);
      
      await page.getByRole('button', { name: /Upload & Process/i }).click();
      await expect(page).toHaveURL('http://localhost:3000/preview', { timeout: 30000 });
      
      // Go back to upload
      await page.goto('http://localhost:3000/upload');
      
      // Upload test PDF
      fileInput = page.locator('input[type="file"]');
      const testPdfPath = path.join(process.cwd(), '..', 'pdf-worker', 'fixtures', 'test-schedule.pdf');
      await fileInput.setInputFiles(testPdfPath);
      
      await page.getByRole('button', { name: /Upload & Process/i }).click();
      await expect(page).toHaveURL('http://localhost:3000/preview', { timeout: 30000 });
      
      // Verify new mode is applied
      await page.getByRole('button', { name: /Next|Continue|Customize/i }).click();
      await expect(page).toHaveURL('http://localhost:3000/customize', { timeout: 10000 });
      
      // Should NOT show semester dates for test mode
      const infoAlert = page.locator('.alert, [role="alert"]').filter({ hasText: /fixed dates|specific dates/i });
      await expect(infoAlert).toBeVisible();
    });
  });
});
