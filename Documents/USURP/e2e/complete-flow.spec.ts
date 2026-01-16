import { test, expect } from '@playwright/test';

test.describe('Complete User Journey - E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page before each test
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should register identity and generate letter', async ({ page }) => {
    // 1. Navigate to registration page
    await page.click('button:has-text("Déclarer une identité")');
    await page.waitForLoadState('networkidle');
    
    // Verify we're on registration page
    await expect(page).toHaveTitle(/.*[Dd]éclaration|[Rr]egister/);

    // 2. Step 1: Personal Information
    await page.fill('input[name="first_name"], input[placeholder="Prénom"]', 'Jean');
    await page.fill('input[name="last_name"], input[placeholder="Nom"]', 'Dupont');
    await page.fill('input[name="date_of_birth"], input[type="date"]', '1990-01-15');
    await page.fill('input[name="official_id_number"], input[placeholder*="identité"]', 'E2E123456789');
    await page.fill('input[name="email"], input[type="email"]', 'jean.dupont@example.com');

    // 3. Step 2: Document Type
    const identityCardRadio = page.locator('input[type="radio"][value="identity_card"]');
    if (await identityCardRadio.isVisible()) {
      await identityCardRadio.check();
    }

    // 4. Step 3: GDPR Consent
    const gdprCheckbox = page.locator('input[name="gdpr_consent"], input[type="checkbox"]:has-text("RGPD")');
    if (await gdprCheckbox.first().isVisible()) {
      await gdprCheckbox.first().check();
    }

    // 5. Submit registration
    const submitButton = page.locator('button:has-text("Soumettre"), button:has-text("Enregistrer"), button:has-text("Valider")').first();
    await submitButton.click();
    
    // Wait for response
    await page.waitForLoadState('networkidle');

    // 6. Verify confirmation page
    const confirmationText = page.locator('text=/[Mm]erci|[Cc]onfirmation|[Ss]uccès/');
    await expect(confirmationText).toBeVisible();

    // 7. Attempt to generate letter (if available)
    const generateButton = page.locator('button:has-text("Générer"), button:has-text("Lettre")').first();
    if (await generateButton.isVisible()) {
      await generateButton.click();
      await page.waitForLoadState('networkidle');
      
      // Verify letter generation feedback
      const letterReady = page.locator('text=/[Ll]ettre|[Gé]nér/');
      await expect(letterReady).toBeVisible({ timeout: 10000 });
    }
  });

  test('should check if identity exists', async ({ page }) => {
    // 1. Navigate to identity check page
    await page.click('button:has-text("Vérifier"), button:has-text("Chercher")');
    await page.waitForLoadState('networkidle');

    // 2. Enter identity number
    const identityInput = page.locator('input[name="identity_number"], input[placeholder*="identité"], input[placeholder*="numero"]').first();
    await identityInput.fill('TEST123456');

    // 3. Submit search
    const searchButton = page.locator('button:has-text("Chercher"), button:has-text("Vérifier"), button:has-text("Rechercher")').first();
    await searchButton.click();
    
    await page.waitForLoadState('networkidle');

    // 4. Verify result message
    const resultText = page.locator('text=/[Nn]on trouvé|[Nn]on identifié|[Tt]rouvé/');
    await expect(resultText).toBeVisible();
  });

  test('should reject registration without GDPR consent', async ({ page }) => {
    // 1. Navigate to registration
    await page.click('button:has-text("Déclarer")');
    await page.waitForLoadState('networkidle');

    // 2. Fill form WITHOUT GDPR consent
    await page.fill('input[name="first_name"], input[placeholder="Prénom"]', 'NoGDPR');
    await page.fill('input[name="last_name"], input[placeholder="Nom"]', 'Test');
    await page.fill('input[name="date_of_birth"], input[type="date"]', '1995-06-20');
    await page.fill('input[name="official_id_number"], input[placeholder*="identité"]', 'NOGDPR123');
    await page.fill('input[name="email"], input[type="email"]', 'nogdpr@test.com');

    // 3. DO NOT check GDPR checkbox
    const gdprCheckbox = page.locator('input[name="gdpr_consent"]');
    if (await gdprCheckbox.isChecked()) {
      await gdprCheckbox.uncheck();
    }

    // 4. Try to submit
    const submitButton = page.locator('button:has-text("Soumettre"), button:has-text("Valider")').first();
    const isDisabled = await submitButton.isDisabled();
    
    if (!isDisabled) {
      await submitButton.click();
      await page.waitForLoadState('networkidle');
      
      // Should see error message
      const errorMessage = page.locator('text=/[Cc]onsentement|[Gg]dpr|[Rr]equis|[Oo]bligatoire/i');
      await expect(errorMessage).toBeVisible();
    } else {
      // Button is disabled - that's also correct behavior
      expect(isDisabled).toBe(true);
    }
  });

  test('should display error for invalid email format', async ({ page }) => {
    // 1. Navigate to registration
    await page.click('button:has-text("Déclarer")');
    await page.waitForLoadState('networkidle');

    // 2. Fill form with invalid email
    await page.fill('input[name="first_name"], input[placeholder="Prénom"]', 'Invalid');
    await page.fill('input[name="last_name"], input[placeholder="Nom"]', 'Email');
    await page.fill('input[name="date_of_birth"], input[type="date"]', '1988-03-10');
    await page.fill('input[name="official_id_number"], input[placeholder*="identité"]', 'INVALID123');
    await page.fill('input[name="email"], input[type="email"]', 'not-an-email');
    
    // 3. Check GDPR
    const gdprCheckbox = page.locator('input[name="gdpr_consent"]');
    await gdprCheckbox.check();

    // 4. Try to submit
    const submitButton = page.locator('button:has-text("Soumettre"), button:has-text("Valider")').first();
    
    // Check if validation happens
    const errorMsg = page.locator('text=/email|[Ff]ormat|invalide/i');
    const isDisabled = await submitButton.isDisabled();
    
    expect(isDisabled || await errorMsg.isVisible()).toBeTruthy();
  });

  test('should handle duplicate registration attempt', async ({ page }) => {
    const uniqueId = `DUP${Date.now()}`;
    
    // 1. First registration
    await page.click('button:has-text("Déclarer")');
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="first_name"], input[placeholder="Prénom"]', 'First');
    await page.fill('input[name="last_name"], input[placeholder="Nom"]', 'Attempt');
    await page.fill('input[name="date_of_birth"], input[type="date"]', '1992-08-25');
    await page.fill('input[name="official_id_number"], input[placeholder*="identité"]', uniqueId);
    await page.fill('input[name="email"], input[type="email"]', `first${Date.now()}@test.com`);
    
    const gdprCheckbox = page.locator('input[name="gdpr_consent"]');
    await gdprCheckbox.check();

    await page.click('button:has-text("Soumettre"), button:has-text("Valider")');
    await page.waitForLoadState('networkidle');

    // Should see confirmation
    await expect(page.locator('text=/[Cc]onfirmation|[Ss]uccès|[Mm]erci/')).toBeVisible();

    // 2. Try to register again with same ID
    await page.goto('/');
    await page.click('button:has-text("Déclarer")');
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="first_name"], input[placeholder="Prénom"]', 'Second');
    await page.fill('input[name="last_name"], input[placeholder="Nom"]', 'Attempt');
    await page.fill('input[name="date_of_birth"], input[type="date"]', '1992-08-25');
    await page.fill('input[name="official_id_number"], input[placeholder*="identité"]', uniqueId); // Same ID
    await page.fill('input[name="email"], input[type="email"]', `second${Date.now()}@test.com`);
    
    await gdprCheckbox.check();
    await page.click('button:has-text("Soumettre"), button:has-text("Valider")');
    await page.waitForLoadState('networkidle');

    // Should see duplicate error
    const duplicateError = page.locator('text=/[Dd]oublon|[Ee]xist|[Dd]éjà|[Cc]onflit/i');
    await expect(duplicateError).toBeVisible();
  });

  test('should navigate between pages without errors', async ({ page }) => {
    // Check main navigation works
    const navLinks = ['Accueil', 'Déclarer', 'Vérifier', 'À Propos', 'Contact'];
    
    for (const link of navLinks) {
      const element = page.locator(`button:has-text("${link}"), a:has-text("${link}")`).first();
      if (await element.isVisible()) {
        await element.click();
        await page.waitForLoadState('networkidle');
        // Just verify page loaded without error
        expect(await page.title()).toBeTruthy();
      }
    }
  });

  test('should display 404 for non-existent pages', async ({ page }) => {
    await page.goto('/non-existent-page');
    
    // Should either show 404 or redirect to home
    const notFoundText = page.locator('text=/404|[Pp]age not found|[Ii]ntrouvable/');
    const homeVisible = page.locator('text=/[Aa]ccueil|[Hh]ome/');
    
    expect(
      await notFoundText.isVisible() || await homeVisible.isVisible()
    ).toBeTruthy();
  });
});
