import { test, expect, testData } from './fixtures/test-fixtures';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the homepage with board list', async ({ page }) => {
    await expect(page).toHaveTitle(/Kanban/i);
    await expect(page.locator('[data-testid="board-list"]')).toBeVisible();
  });

  test('should show create board button', async ({ page }) => {
    const createButton = page.locator('[data-testid="create-board-button"]');
    await expect(createButton).toBeVisible();
  });

  test('should display existing boards', async ({ page }) => {
    const boardCards = page.locator('[data-testid="board-card"]');
    await expect(boardCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to board when clicking on board card', async ({ page }) => {
    const boardCard = page.locator('[data-testid="board-card"]').first();
    await boardCard.click();

    await expect(page).toHaveURL(/\/board\//);
    await expect(page.locator('[data-testid="kanban-board"]')).toBeVisible();
  });

  test('should create a new board', async ({ page }) => {
    const createButton = page.locator('[data-testid="create-board-button"]');
    await createButton.click();

    const titleInput = page.locator('[data-testid="board-title-input"]');
    await expect(titleInput).toBeVisible();

    const newBoardTitle = `New Board ${Date.now()}`;
    await titleInput.fill(newBoardTitle);

    const submitButton = page.locator('[data-testid="submit-board-button"]');
    await submitButton.click();

    await expect(page.locator(`[data-testid="board-card"]:has-text("${newBoardTitle}")`)).toBeVisible();
  });

  test('should show board statistics on board card', async ({ page }) => {
    const boardCard = page.locator('[data-testid="board-card"]').first();
    await expect(boardCard.locator('[data-testid="column-count"]')).toBeVisible();
    await expect(boardCard.locator('[data-testid="card-count"]')).toBeVisible();
  });
});

test.describe('Board List Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should filter boards by search input', async ({ page }) => {
    const searchInput = page.locator('[data-testid="board-search-input"]');

    if (await searchInput.isVisible()) {
      await searchInput.fill('Test');

      const boardCards = page.locator('[data-testid="board-card"]');
      const count = await boardCards.count();

      for (let i = 0; i < count; i++) {
        const card = boardCards.nth(i);
        await expect(card).toContainText(/Test/i);
      }
    }
  });
});

test.describe('Responsive Design', () => {
  test('should display correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page.locator('[data-testid="board-list"]')).toBeVisible();
  });

  test('should display correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    await expect(page.locator('[data-testid="board-list"]')).toBeVisible();
  });

  test('should display correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    await expect(page.locator('[data-testid="board-list"]')).toBeVisible();
  });
});
