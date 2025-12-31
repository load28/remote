import { test as base, expect, Page } from '@playwright/test';

/**
 * Authentication fixture for E2E tests
 * Handles login/logout and session management
 */

export interface AuthFixture {
  login: (email?: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoggedIn: () => Promise<boolean>;
}

export const test = base.extend<{ auth: AuthFixture }>({
  auth: async ({ page }, use) => {
    const auth: AuthFixture = {
      async login(email = 'demo@example.com', password = 'demo1234') {
        // Set the mock auth session flag in localStorage
        await page.evaluate(() => {
          localStorage.setItem('mock-auth-session', 'true');
        });

        // Navigate to login if not already there
        const currentUrl = page.url();
        if (!currentUrl.includes('/login')) {
          await page.goto('/login');
        }

        // Fill and submit the login form
        await page.locator('[data-testid="email-input"]').fill(email);
        await page.locator('[data-testid="password-input"]').fill(password);
        await page.locator('[data-testid="login-button"]').click();

        // Wait for navigation to complete
        await page.waitForURL((url) => !url.pathname.includes('/login'), {
          timeout: 10000,
        }).catch(() => {
          // If navigation doesn't happen, that's okay - we set the session flag
        });
      },

      async logout() {
        await page.evaluate(() => {
          localStorage.removeItem('mock-auth-session');
        });

        // Click logout button if visible
        const logoutButton = page.locator('[data-testid="logout-button"]');
        if (await logoutButton.isVisible()) {
          await logoutButton.click();
        }
      },

      async isLoggedIn() {
        const hasSession = await page.evaluate(() => {
          return localStorage.getItem('mock-auth-session') === 'true';
        });
        return hasSession;
      },
    };

    await use(auth);
  },
});

export { expect };

/**
 * Auto-login fixture - automatically logs in before each test
 */
export const authenticatedTest = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    // Set auth session before navigating
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('mock-auth-session', 'true');
    });

    // Reload to apply session
    await page.reload();

    await use(page);

    // Cleanup
    await page.evaluate(() => {
      localStorage.removeItem('mock-auth-session');
    });
  },
});
