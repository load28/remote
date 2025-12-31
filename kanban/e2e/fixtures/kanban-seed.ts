import { test as base, expect, Page } from '@playwright/test';

/**
 * Kanban board seeding fixture for E2E tests
 * Provides helper methods to set up test data scenarios
 */

export interface BoardSeed {
  boardId: string;
  boardTitle: string;
  columns: Array<{
    id: string;
    title: string;
    cards: Array<{
      id: string;
      title: string;
    }>;
  }>;
}

export interface KanbanSeedFixture {
  /**
   * Navigate to a board page with authentication
   */
  goToBoard: (boardId?: string) => Promise<void>;

  /**
   * Create a new column on the current board
   */
  createColumn: (title: string) => Promise<void>;

  /**
   * Create a new card in a specific column
   */
  createCard: (title: string, columnIndex?: number) => Promise<void>;

  /**
   * Get all visible columns
   */
  getColumns: () => ReturnType<Page['locator']>;

  /**
   * Get all visible cards
   */
  getCards: () => ReturnType<Page['locator']>;

  /**
   * Get a specific card by title
   */
  getCard: (title: string) => ReturnType<Page['locator']>;

  /**
   * Click on a card to open the detail modal
   */
  openCardDetail: (cardTitle: string) => Promise<void>;

  /**
   * Close the card detail modal
   */
  closeCardDetail: () => Promise<void>;

  /**
   * Drag a card to another column
   */
  dragCardToColumn: (cardTitle: string, targetColumnTitle: string) => Promise<void>;

  /**
   * Wait for the board to be fully loaded
   */
  waitForBoard: () => Promise<void>;

  /**
   * Default board data from mock
   */
  defaultBoard: BoardSeed;
}

export const test = base.extend<{ kanban: KanbanSeedFixture }>({
  kanban: async ({ page }, use) => {
    // Default mock data that matches src/shared/api/msw/db.ts
    const defaultBoard: BoardSeed = {
      boardId: 'board-1',
      boardTitle: 'My First Board',
      columns: [
        {
          id: 'col-1',
          title: 'To Do',
          cards: [
            { id: 'card-1', title: 'Design login page' },
            { id: 'card-2', title: 'Setup authentication' },
          ],
        },
        {
          id: 'col-2',
          title: 'In Progress',
          cards: [
            { id: 'card-3', title: 'Implement drag and drop' },
          ],
        },
        {
          id: 'col-3',
          title: 'Done',
          cards: [
            { id: 'card-4', title: 'Project setup' },
          ],
        },
      ],
    };

    const kanban: KanbanSeedFixture = {
      defaultBoard,

      async goToBoard(boardId = 'board-1') {
        // Ensure authenticated
        await page.evaluate(() => {
          localStorage.setItem('mock-auth-session', 'true');
        });

        await page.goto(`/board/${boardId}`);
        await this.waitForBoard();
      },

      async createColumn(title: string) {
        const addButton = page.locator('[data-testid="add-column-button"]');
        await addButton.click();

        const input = page.locator('[data-testid="column-title-input"]');
        await input.fill(title);

        const submit = page.locator('[data-testid="submit-column-button"]');
        await submit.click();

        // Wait for column to appear
        await page.locator(`[data-testid="kanban-column"]:has-text("${title}")`).waitFor({
          state: 'visible',
          timeout: 5000,
        });
      },

      async createCard(title: string, columnIndex = 0) {
        const columns = page.locator('[data-testid="kanban-column"]');
        const column = columns.nth(columnIndex);
        const addButton = column.locator('[data-testid="add-card-button"]');
        await addButton.click();

        const input = page.locator('[data-testid="card-title-input"]');
        await input.fill(title);

        const submit = page.locator('[data-testid="submit-card-button"]');
        await submit.click();

        // Wait for card to appear
        await page.locator(`[data-testid="card-item"]:has-text("${title}")`).waitFor({
          state: 'visible',
          timeout: 5000,
        });
      },

      getColumns() {
        return page.locator('[data-testid="kanban-column"]');
      },

      getCards() {
        return page.locator('[data-testid="card-item"]');
      },

      getCard(title: string) {
        return page.locator(`[data-testid="card-item"]:has-text("${title}")`);
      },

      async openCardDetail(cardTitle: string) {
        const card = page.locator(`[data-testid="card-item"]:has-text("${cardTitle}")`);
        await card.click();

        // Wait for modal to open
        await page.locator('[data-testid="card-detail-modal"]').waitFor({
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

      async dragCardToColumn(cardTitle: string, targetColumnTitle: string) {
        const card = page.locator(`[data-testid="card-item"]:has-text("${cardTitle}")`);
        const targetColumn = page.locator(
          `[data-testid="kanban-column"]:has-text("${targetColumnTitle}") [data-testid="column-drop-area"]`
        );

        await card.dragTo(targetColumn);
      },

      async waitForBoard() {
        await page.locator('[data-testid="kanban-board"]').waitFor({
          state: 'visible',
          timeout: 10000,
        });
      },
    };

    await use(kanban);
  },
});

export { expect };
