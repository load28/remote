import { test as base, expect, Page } from '@playwright/test';

/**
 * Custom test fixtures for Kanban E2E tests
 */

export interface TestUser {
  email: string;
  password: string;
  name: string;
}

export interface KanbanPage {
  page: Page;
  goto: (path?: string) => Promise<void>;
  gotoAuthenticated: (path?: string) => Promise<void>;
  login: (email?: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  waitForBoard: () => Promise<void>;
  createCard: (title: string, columnIndex?: number) => Promise<void>;
  createColumn: (title: string) => Promise<void>;
  getCard: (title: string) => ReturnType<Page['locator']>;
  getColumn: (title: string) => ReturnType<Page['locator']>;
  getAllColumns: () => ReturnType<Page['locator']>;
  getAllCards: () => ReturnType<Page['locator']>;
  dragCard: (cardTitle: string, targetColumnTitle: string) => Promise<void>;
  openCardDetail: (cardTitle: string) => Promise<void>;
  closeCardDetail: () => Promise<void>;
}

export const test = base.extend<{ kanbanPage: KanbanPage }>({
  kanbanPage: async ({ page }, use) => {
    // Auto-accept all confirm dialogs
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    const kanbanPage: KanbanPage = {
      page,

      async goto(path = '/') {
        // Auto-authenticate for protected routes
        const protectedRoutes = ['/board', '/'];
        const isProtected = protectedRoutes.some(route =>
          path === route || path.startsWith(route + '/')
        );

        if (isProtected && path !== '/login' && path !== '/register') {
          // Navigate to a page first to set localStorage
          await page.goto('/login');
          await page.evaluate(() => {
            localStorage.setItem('mock-auth-session', 'true');
          });
        }

        await page.goto(path);
      },

      async gotoAuthenticated(path = '/') {
        // First go to login page to set up localStorage
        await page.goto('/login');
        await page.evaluate(() => {
          localStorage.setItem('mock-auth-session', 'true');
        });
        // Then navigate to desired path
        await page.goto(path);
      },

      async login(email = 'demo@example.com', password = 'demo1234') {
        await page.goto('/login');
        await page.evaluate(() => {
          localStorage.setItem('mock-auth-session', 'true');
        });

        await page.locator('[data-testid="email-input"]').fill(email);
        await page.locator('[data-testid="password-input"]').fill(password);
        await page.locator('[data-testid="login-button"]').click();

        // Wait for navigation or session to be set
        await page.waitForTimeout(500);
      },

      async logout() {
        await page.evaluate(() => {
          localStorage.removeItem('mock-auth-session');
        });
        const logoutButton = page.locator('[data-testid="logout-button"]');
        if (await logoutButton.isVisible()) {
          await logoutButton.click();
        }
      },

      async waitForBoard() {
        await page.waitForSelector('[data-testid="kanban-board"]', {
          state: 'visible',
          timeout: 10000,
        });
      },

      async createCard(title: string, columnIndex = 0) {
        const columns = page.locator('[data-testid="kanban-column"]');
        const column = columns.nth(columnIndex);
        const addButton = column.locator('[data-testid="add-card-button"]');
        await addButton.click();

        const input = page.locator('[data-testid="card-title-input"]');
        await input.fill(title);

        const submitButton = page.locator('[data-testid="submit-card-button"]');
        await submitButton.click();

        await page.waitForSelector(`[data-testid="card-item"]:has-text("${title}")`, {
          timeout: 5000,
        });
      },

      async createColumn(title: string) {
        const addColumnButton = page.locator('[data-testid="add-column-button"]');
        await addColumnButton.click();

        const input = page.locator('[data-testid="column-title-input"]');
        await input.fill(title);

        const submitButton = page.locator('[data-testid="submit-column-button"]');
        await submitButton.click();

        await page.waitForSelector(`[data-testid="kanban-column"]:has-text("${title}")`, {
          timeout: 5000,
        });
      },

      getCard(title: string) {
        return page.locator(`[data-testid="card-item"]:has-text("${title}")`);
      },

      getColumn(title: string) {
        return page.locator(`[data-testid="kanban-column"]:has-text("${title}")`);
      },

      getAllColumns() {
        return page.locator('[data-testid="kanban-column"]');
      },

      getAllCards() {
        return page.locator('[data-testid="card-item"]');
      },

      async dragCard(cardTitle: string, targetColumnTitle: string) {
        const card = page.locator(`[data-testid="card-item"]:has-text("${cardTitle}")`);
        const targetColumn = page.locator(
          `[data-testid="kanban-column"]:has-text("${targetColumnTitle}") [data-testid="column-drop-area"]`
        );

        await card.dragTo(targetColumn);
      },

      async openCardDetail(cardTitle: string) {
        const card = page.locator(`[data-testid="card-item"]:has-text("${cardTitle}")`);
        await card.click();
        await page.waitForSelector('[data-testid="card-detail-modal"]', {
          state: 'visible',
          timeout: 5000,
        });
      },

      async closeCardDetail() {
        const closeButton = page.locator('[data-testid="close-modal-button"]');
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      },
    };

    await use(kanbanPage);
  },
});

export { expect };

/**
 * Test data matching the mock database (src/shared/api/msw/db.ts)
 */
export const testData = {
  boards: {
    default: {
      id: 'board-1',
      title: 'My First Board',
    },
    empty: {
      id: 'board-empty',
      title: 'Empty Board',
    },
  },
  columns: {
    todo: { id: 'col-1', title: 'To Do' },
    inProgress: { id: 'col-2', title: 'In Progress' },
    done: { id: 'col-3', title: 'Done' },
  },
  cards: {
    designLogin: {
      id: 'card-1',
      title: 'Design login page',
      description: 'Create UI mockups for the login page with responsive design',
    },
    setupAuth: {
      id: 'card-2',
      title: 'Setup authentication',
      description: 'Implement Auth.js with Supabase provider',
    },
    dragDrop: {
      id: 'card-3',
      title: 'Implement drag and drop',
      description: 'Add drag and drop functionality using dnd-kit library for card movement',
    },
    projectSetup: {
      id: 'card-4',
      title: 'Project setup',
      description: 'Initialize Next.js project with FSD architecture and configure TypeScript',
    },
  },
  users: {
    demo: {
      id: 'user-1',
      email: 'demo@example.com',
      password: 'demo1234',
      name: 'Demo User',
    },
    testUser: {
      id: 'user-1',
      email: 'demo@example.com',
      password: 'demo1234',
      name: 'Demo User',
    },
    john: {
      id: 'user-2',
      email: 'john@example.com',
      name: 'John Doe',
    },
  },
  labels: {
    design: { id: 'label-1', name: 'Design', color: '#8B5CF6' },
    backend: { id: 'label-2', name: 'Backend', color: '#10B981' },
    feature: { id: 'label-3', name: 'Feature', color: '#3B82F6' },
    setup: { id: 'label-4', name: 'Setup', color: '#F59E0B' },
    bug: { id: 'label-5', name: 'Bug', color: '#EF4444' },
  },
};

/**
 * Helper function to set up authenticated session before tests
 */
export async function setupAuthenticatedSession(page: Page): Promise<void> {
  // Navigate to a page first to be able to use localStorage
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.setItem('mock-auth-session', 'true');
  });
}

/**
 * Helper function to clear authentication session after tests
 */
export async function clearAuthenticatedSession(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('mock-auth-session');
  });
}
