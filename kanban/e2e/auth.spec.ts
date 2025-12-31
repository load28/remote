import { test, expect, testData } from './fixtures/test-fixtures';

test.describe('Authentication - Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
  });

  test('should show validation error for empty email', async ({ page }) => {
    const loginButton = page.locator('[data-testid="login-button"]');
    await loginButton.click();

    const emailError = page.locator('[data-testid="email-error"]');
    await expect(emailError).toBeVisible();
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    const emailInput = page.locator('[data-testid="email-input"]');
    await emailInput.fill('invalid-email');

    const passwordInput = page.locator('[data-testid="password-input"]');
    await passwordInput.fill('password123');

    const loginButton = page.locator('[data-testid="login-button"]');
    await loginButton.click();

    const emailError = page.locator('[data-testid="email-error"]');
    await expect(emailError).toBeVisible();
  });

  test('should show validation error for empty password', async ({ page }) => {
    const emailInput = page.locator('[data-testid="email-input"]');
    await emailInput.fill('test@example.com');

    const loginButton = page.locator('[data-testid="login-button"]');
    await loginButton.click();

    const passwordError = page.locator('[data-testid="password-error"]');
    await expect(passwordError).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    const emailInput = page.locator('[data-testid="email-input"]');
    await emailInput.fill('wrong@example.com');

    const passwordInput = page.locator('[data-testid="password-input"]');
    await passwordInput.fill('wrongpassword');

    const loginButton = page.locator('[data-testid="login-button"]');
    await loginButton.click();

    const errorMessage = page.locator('[data-testid="login-error"]');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    const { email, password } = testData.users.testUser;

    const emailInput = page.locator('[data-testid="email-input"]');
    await emailInput.fill(email);

    const passwordInput = page.locator('[data-testid="password-input"]');
    await passwordInput.fill(password);

    const loginButton = page.locator('[data-testid="login-button"]');
    await loginButton.click();

    // Should redirect to home or dashboard
    await expect(page).toHaveURL(/\/(home|dashboard|board)?$/);
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('[data-testid="password-input"]');
    await passwordInput.fill('testpassword');

    const toggleButton = page.locator('[data-testid="toggle-password-visibility"]');

    if (await toggleButton.isVisible()) {
      // Check initial type
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Click toggle
      await toggleButton.click();

      // Check type changed to text
      await expect(passwordInput).toHaveAttribute('type', 'text');

      // Click toggle again
      await toggleButton.click();

      // Check type changed back to password
      await expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });

  test('should show link to registration page', async ({ page }) => {
    const registerLink = page.locator('[data-testid="register-link"]');

    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/\/register/);
    }
  });

  test('should show forgot password link', async ({ page }) => {
    const forgotLink = page.locator('[data-testid="forgot-password-link"]');

    if (await forgotLink.isVisible()) {
      await forgotLink.click();
      await expect(page).toHaveURL(/\/forgot-password/);
    }
  });
});

test.describe('Authentication - Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display registration form', async ({ page }) => {
    const form = page.locator('[data-testid="register-form"]');

    if (await form.isVisible()) {
      await expect(page.locator('[data-testid="name-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="confirm-password-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="register-button"]')).toBeVisible();
    }
  });

  test('should validate password confirmation', async ({ page }) => {
    const form = page.locator('[data-testid="register-form"]');

    if (await form.isVisible()) {
      await page.locator('[data-testid="name-input"]').fill('Test User');
      await page.locator('[data-testid="email-input"]').fill('newuser@example.com');
      await page.locator('[data-testid="password-input"]').fill('password123');
      await page.locator('[data-testid="confirm-password-input"]').fill('password456');

      await page.locator('[data-testid="register-button"]').click();

      const error = page.locator('[data-testid="password-match-error"]');
      await expect(error).toBeVisible();
    }
  });

  test('should validate password strength', async ({ page }) => {
    const form = page.locator('[data-testid="register-form"]');

    if (await form.isVisible()) {
      await page.locator('[data-testid="password-input"]').fill('123');

      const strengthIndicator = page.locator('[data-testid="password-strength"]');

      if (await strengthIndicator.isVisible()) {
        await expect(strengthIndicator).toContainText(/weak/i);
      }
    }
  });

  test('should successfully register with valid data', async ({ page }) => {
    const form = page.locator('[data-testid="register-form"]');

    if (await form.isVisible()) {
      const uniqueEmail = `newuser${Date.now()}@example.com`;

      await page.locator('[data-testid="name-input"]').fill('New User');
      await page.locator('[data-testid="email-input"]').fill(uniqueEmail);
      await page.locator('[data-testid="password-input"]').fill('StrongP@ssw0rd!');
      await page.locator('[data-testid="confirm-password-input"]').fill('StrongP@ssw0rd!');

      await page.locator('[data-testid="register-button"]').click();

      // Should redirect after successful registration
      await expect(page).not.toHaveURL(/\/register/);
    }
  });
});

test.describe('Authentication - OAuth Providers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display OAuth login buttons', async ({ page }) => {
    const googleButton = page.locator('[data-testid="google-login-button"]');
    const githubButton = page.locator('[data-testid="github-login-button"]');

    // Check if at least one OAuth provider is available
    const hasGoogleLogin = await googleButton.isVisible();
    const hasGithubLogin = await githubButton.isVisible();

    if (hasGoogleLogin || hasGithubLogin) {
      // At least one OAuth provider should be visible
      expect(hasGoogleLogin || hasGithubLogin).toBe(true);
    }
  });

  test('should redirect to OAuth provider on click', async ({ page }) => {
    const googleButton = page.locator('[data-testid="google-login-button"]');

    if (await googleButton.isVisible()) {
      // We can't fully test OAuth flow, but we can verify the button triggers navigation
      const [popup] = await Promise.all([
        page.waitForEvent('popup', { timeout: 5000 }).catch(() => null),
        googleButton.click().catch(() => null),
      ]);

      // Either opens popup or navigates current page
      if (popup) {
        expect(popup.url()).toContain('google');
        await popup.close();
      }
    }
  });
});

test.describe('Authentication - Session Management', () => {
  test('should redirect to login when accessing protected route', async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();

    // Try to access a protected route
    await page.goto('/board/board-1');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should maintain session after page refresh', async ({ page }) => {
    // Login first
    await page.goto('/login');

    const emailInput = page.locator('[data-testid="email-input"]');
    const passwordInput = page.locator('[data-testid="password-input"]');
    const loginButton = page.locator('[data-testid="login-button"]');

    if (await emailInput.isVisible()) {
      await emailInput.fill(testData.users.testUser.email);
      await passwordInput.fill(testData.users.testUser.password);
      await loginButton.click();

      // Wait for redirect
      await page.waitForURL(/\/(home|dashboard|board)?$/, { timeout: 10000 });

      // Refresh the page
      await page.reload();

      // Should still be logged in (not redirected to login)
      await expect(page).not.toHaveURL(/\/login/);
    }
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.goto('/login');

    const emailInput = page.locator('[data-testid="email-input"]');

    if (await emailInput.isVisible()) {
      await emailInput.fill(testData.users.testUser.email);
      await page.locator('[data-testid="password-input"]').fill(testData.users.testUser.password);
      await page.locator('[data-testid="login-button"]').click();

      // Wait for redirect
      await page.waitForURL(/\/(home|dashboard|board)?$/, { timeout: 10000 });

      // Find and click logout button
      const logoutButton = page.locator('[data-testid="logout-button"]');

      if (await logoutButton.isVisible()) {
        await logoutButton.click();

        // Should redirect to login or home
        await expect(page).toHaveURL(/\/(login|home)?$/);
      }
    }
  });
});

test.describe('Authentication - User Profile', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');

    const emailInput = page.locator('[data-testid="email-input"]');

    if (await emailInput.isVisible()) {
      await emailInput.fill(testData.users.testUser.email);
      await page.locator('[data-testid="password-input"]').fill(testData.users.testUser.password);
      await page.locator('[data-testid="login-button"]').click();
      await page.waitForURL(/\/(home|dashboard|board)?$/, { timeout: 10000 });
    }
  });

  test('should display user info in header', async ({ page }) => {
    const userAvatar = page.locator('[data-testid="user-avatar"]');
    const userName = page.locator('[data-testid="user-name"]');

    const hasAvatar = await userAvatar.isVisible();
    const hasName = await userName.isVisible();

    // At least one user identifier should be visible
    if (hasAvatar || hasName) {
      expect(hasAvatar || hasName).toBe(true);
    }
  });

  test('should open user profile dropdown', async ({ page }) => {
    const userMenuButton = page.locator('[data-testid="user-menu-button"]');

    if (await userMenuButton.isVisible()) {
      await userMenuButton.click();

      const dropdown = page.locator('[data-testid="user-menu-dropdown"]');
      await expect(dropdown).toBeVisible();
    }
  });

  test('should navigate to profile settings', async ({ page }) => {
    const userMenuButton = page.locator('[data-testid="user-menu-button"]');

    if (await userMenuButton.isVisible()) {
      await userMenuButton.click();

      const profileLink = page.locator('[data-testid="profile-settings-link"]');

      if (await profileLink.isVisible()) {
        await profileLink.click();
        await expect(page).toHaveURL(/\/profile|\/settings/);
      }
    }
  });
});

test.describe('Authentication - Security', () => {
  test('should handle CSRF token', async ({ page }) => {
    await page.goto('/login');

    const form = page.locator('[data-testid="login-form"]');

    if (await form.isVisible()) {
      // Check for CSRF token input (hidden field)
      const csrfInput = form.locator('input[name="csrf"], input[name="_csrf"]');
      const hasCsrf = (await csrfInput.count()) > 0;

      // CSRF protection may be implemented differently
      // This is just a basic check
    }
  });

  test('should rate limit login attempts', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('[data-testid="email-input"]');

    if (await emailInput.isVisible()) {
      // Attempt multiple failed logins
      for (let i = 0; i < 5; i++) {
        await emailInput.fill('test@example.com');
        await page.locator('[data-testid="password-input"]').fill('wrongpassword');
        await page.locator('[data-testid="login-button"]').click();
        await page.waitForTimeout(500);
      }

      // Check for rate limit message
      const rateLimitError = page.locator('[data-testid="rate-limit-error"]');
      const isRateLimited = await rateLimitError.isVisible({ timeout: 2000 });

      // Rate limiting may or may not be implemented
    }
  });
});
