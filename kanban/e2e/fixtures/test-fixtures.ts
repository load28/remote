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
  waitForBoard: () => Promise<void>;
  createCard: (title: string, columnIndex?: number) => Promise<void>;
  createColumn: (title: string) => Promise<void>;
  getCard: (title: string) => ReturnType<Page['locator']>;
  getColumn: (title: string) => ReturnType<Page['locator']>;
  getAllColumns: () => ReturnType<Page['locator']>;
  getAllCards: () => ReturnType<Page['locator']>;
  dragCard: (cardTitle: string, targetColumnTitle: string) => Promise<void>;
}

export const test = base.extend<{ kanbanPage: KanbanPage }>({
  kanbanPage: async ({ page }, use) => {
    const kanbanPage: KanbanPage = {
      page,

      async goto(path = '/') {
        await page.goto(path);
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

        await page.waitForSelector(`[data-testid="card-item"]:has-text("${title}")`);
      },

      async createColumn(title: string) {
        const addColumnButton = page.locator('[data-testid="add-column-button"]');
        await addColumnButton.click();

        const input = page.locator('[data-testid="column-title-input"]');
        await input.fill(title);

        const submitButton = page.locator('[data-testid="submit-column-button"]');
        await submitButton.click();

        await page.waitForSelector(`[data-testid="kanban-column"]:has-text("${title}")`);
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
    };

    await use(kanbanPage);
  },
});

export { expect };

/**
 * Test data factory functions
 */
export const testData = {
  boards: {
    default: {
      id: 'board-1',
      title: 'Test Board',
    },
    empty: {
      id: 'board-empty',
      title: 'Empty Board',
    },
  },
  columns: {
    todo: { title: 'To Do' },
    inProgress: { title: 'In Progress' },
    done: { title: 'Done' },
  },
  cards: {
    sample: { title: 'Sample Card' },
    withDescription: {
      title: 'Card with Description',
      description: 'This is a test description',
    },
    withLabel: {
      title: 'Card with Label',
      labelColor: 'blue',
    },
    withDueDate: {
      title: 'Card with Due Date',
      dueDate: '2025-01-15',
    },
  },
  users: {
    testUser: {
      email: 'test@example.com',
      password: 'testpassword123',
      name: 'Test User',
    },
  },
};
