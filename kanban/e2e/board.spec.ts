import { test, expect, testData } from './fixtures/test-fixtures';

test.describe('Board Page', () => {
  test.beforeEach(async ({ kanbanPage }) => {
    await kanbanPage.goto('/board/board-1');
    await kanbanPage.waitForBoard();
  });

  test('should display the kanban board with columns', async ({ kanbanPage }) => {
    const columns = kanbanPage.getAllColumns();
    await expect(columns.first()).toBeVisible();
  });

  test('should display board header with title', async ({ kanbanPage }) => {
    const header = kanbanPage.page.locator('[data-testid="board-header"]');
    await expect(header).toBeVisible();
  });

  test('should show add column button', async ({ kanbanPage }) => {
    const addColumnBtn = kanbanPage.page.locator('[data-testid="add-column-button"]');
    await expect(addColumnBtn).toBeVisible();
  });
});

test.describe('Column Management', () => {
  test.beforeEach(async ({ kanbanPage }) => {
    await kanbanPage.goto('/board/board-1');
    await kanbanPage.waitForBoard();
  });

  test('should create a new column', async ({ kanbanPage }) => {
    const columnTitle = `New Column ${Date.now()}`;
    await kanbanPage.createColumn(columnTitle);

    const newColumn = kanbanPage.getColumn(columnTitle);
    await expect(newColumn).toBeVisible();
  });

  test('should display column header with title', async ({ kanbanPage }) => {
    const columns = kanbanPage.getAllColumns();
    const firstColumn = columns.first();

    await expect(firstColumn.locator('[data-testid="column-header"]')).toBeVisible();
    await expect(firstColumn.locator('[data-testid="column-title"]')).toBeVisible();
  });

  test('should show column menu on header click', async ({ kanbanPage }) => {
    const columns = kanbanPage.getAllColumns();
    const firstColumn = columns.first();

    const menuButton = firstColumn.locator('[data-testid="column-menu-button"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();

      const menu = kanbanPage.page.locator('[data-testid="column-menu"]');
      await expect(menu).toBeVisible();
    }
  });

  test('should edit column title', async ({ kanbanPage }) => {
    const columns = kanbanPage.getAllColumns();
    const firstColumn = columns.first();

    const titleElement = firstColumn.locator('[data-testid="column-title"]');
    await titleElement.dblclick();

    const input = firstColumn.locator('[data-testid="column-title-input"]');
    if (await input.isVisible()) {
      const newTitle = `Edited Column ${Date.now()}`;
      await input.fill(newTitle);
      await input.press('Enter');

      await expect(titleElement).toContainText(newTitle);
    }
  });

  test('should delete a column', async ({ kanbanPage }) => {
    // First create a column to delete
    const columnTitle = `Delete Me ${Date.now()}`;
    await kanbanPage.createColumn(columnTitle);

    const column = kanbanPage.getColumn(columnTitle);
    await expect(column).toBeVisible();

    // Delete the column
    const menuButton = column.locator('[data-testid="column-menu-button"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();

      const deleteButton = kanbanPage.page.locator('[data-testid="delete-column-button"]');
      await deleteButton.click();

      // Confirm deletion if there's a confirmation dialog
      const confirmButton = kanbanPage.page.locator('[data-testid="confirm-delete-button"]');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }

      await expect(column).not.toBeVisible();
    }
  });
});

test.describe('Card CRUD Operations', () => {
  test.beforeEach(async ({ kanbanPage }) => {
    await kanbanPage.goto('/board/board-1');
    await kanbanPage.waitForBoard();
  });

  test('should create a new card', async ({ kanbanPage }) => {
    const cardTitle = `New Card ${Date.now()}`;
    await kanbanPage.createCard(cardTitle);

    const card = kanbanPage.getCard(cardTitle);
    await expect(card).toBeVisible();
  });

  test('should create card in specific column', async ({ kanbanPage }) => {
    const cardTitle = `Card in Column 2 ${Date.now()}`;
    await kanbanPage.createCard(cardTitle, 1);

    const columns = kanbanPage.getAllColumns();
    const secondColumn = columns.nth(1);

    await expect(secondColumn.locator(`[data-testid="card-item"]:has-text("${cardTitle}")`)).toBeVisible();
  });

  test('should open card detail modal on click', async ({ kanbanPage }) => {
    const cards = kanbanPage.getAllCards();
    const firstCard = cards.first();

    if (await firstCard.isVisible()) {
      await firstCard.click();

      const modal = kanbanPage.page.locator('[data-testid="card-detail-modal"]');
      await expect(modal).toBeVisible();
    }
  });

  test('should edit card title in detail modal', async ({ kanbanPage }) => {
    const cards = kanbanPage.getAllCards();
    const firstCard = cards.first();

    if (await firstCard.isVisible()) {
      await firstCard.click();

      const modal = kanbanPage.page.locator('[data-testid="card-detail-modal"]');
      await expect(modal).toBeVisible();

      const titleInput = modal.locator('[data-testid="card-title-input"]');
      if (await titleInput.isVisible()) {
        const newTitle = `Edited Card ${Date.now()}`;
        await titleInput.fill(newTitle);

        const saveButton = modal.locator('[data-testid="save-card-button"]');
        await saveButton.click();

        await expect(kanbanPage.getCard(newTitle)).toBeVisible();
      }
    }
  });

  test('should add description to card', async ({ kanbanPage }) => {
    const cards = kanbanPage.getAllCards();
    const firstCard = cards.first();

    if (await firstCard.isVisible()) {
      await firstCard.click();

      const modal = kanbanPage.page.locator('[data-testid="card-detail-modal"]');
      await expect(modal).toBeVisible();

      const descriptionInput = modal.locator('[data-testid="card-description-input"]');
      if (await descriptionInput.isVisible()) {
        const description = 'This is a test description for the card';
        await descriptionInput.fill(description);

        const saveButton = modal.locator('[data-testid="save-description-button"]');
        if (await saveButton.isVisible()) {
          await saveButton.click();
        }

        await expect(modal.locator('[data-testid="card-description"]')).toContainText(description);
      }
    }
  });

  test('should delete a card', async ({ kanbanPage }) => {
    // Create a card to delete
    const cardTitle = `Delete This Card ${Date.now()}`;
    await kanbanPage.createCard(cardTitle);

    const card = kanbanPage.getCard(cardTitle);
    await expect(card).toBeVisible();

    // Open card detail
    await card.click();

    const modal = kanbanPage.page.locator('[data-testid="card-detail-modal"]');
    await expect(modal).toBeVisible();

    // Delete the card
    const deleteButton = modal.locator('[data-testid="delete-card-button"]');
    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Confirm deletion
      const confirmButton = kanbanPage.page.locator('[data-testid="confirm-delete-button"]');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }

      await expect(card).not.toBeVisible();
    }
  });

  test('should close card detail modal', async ({ kanbanPage }) => {
    const cards = kanbanPage.getAllCards();
    const firstCard = cards.first();

    if (await firstCard.isVisible()) {
      await firstCard.click();

      const modal = kanbanPage.page.locator('[data-testid="card-detail-modal"]');
      await expect(modal).toBeVisible();

      // Close modal
      const closeButton = modal.locator('[data-testid="close-modal-button"]');
      await closeButton.click();

      await expect(modal).not.toBeVisible();
    }
  });
});

test.describe('Card Features', () => {
  test.beforeEach(async ({ kanbanPage }) => {
    await kanbanPage.goto('/board/board-1');
    await kanbanPage.waitForBoard();
  });

  test('should add label to card', async ({ kanbanPage }) => {
    const cards = kanbanPage.getAllCards();
    const firstCard = cards.first();

    if (await firstCard.isVisible()) {
      await firstCard.click();

      const modal = kanbanPage.page.locator('[data-testid="card-detail-modal"]');
      const labelsButton = modal.locator('[data-testid="manage-labels-button"]');

      if (await labelsButton.isVisible()) {
        await labelsButton.click();

        const labelOption = kanbanPage.page.locator('[data-testid="label-option"]').first();
        await labelOption.click();

        await expect(modal.locator('[data-testid="card-label"]')).toBeVisible();
      }
    }
  });

  test('should set due date on card', async ({ kanbanPage }) => {
    const cards = kanbanPage.getAllCards();
    const firstCard = cards.first();

    if (await firstCard.isVisible()) {
      await firstCard.click();

      const modal = kanbanPage.page.locator('[data-testid="card-detail-modal"]');
      const dueDateButton = modal.locator('[data-testid="set-due-date-button"]');

      if (await dueDateButton.isVisible()) {
        await dueDateButton.click();

        const datePicker = kanbanPage.page.locator('[data-testid="date-picker"]');
        await expect(datePicker).toBeVisible();

        // Select a date
        const dateOption = datePicker.locator('[data-testid="date-option"]').first();
        if (await dateOption.isVisible()) {
          await dateOption.click();

          await expect(modal.locator('[data-testid="due-date-display"]')).toBeVisible();
        }
      }
    }
  });

  test('should add checklist to card', async ({ kanbanPage }) => {
    const cards = kanbanPage.getAllCards();
    const firstCard = cards.first();

    if (await firstCard.isVisible()) {
      await firstCard.click();

      const modal = kanbanPage.page.locator('[data-testid="card-detail-modal"]');
      const checklistButton = modal.locator('[data-testid="add-checklist-button"]');

      if (await checklistButton.isVisible()) {
        await checklistButton.click();

        const checklistInput = modal.locator('[data-testid="checklist-title-input"]');
        await checklistInput.fill('Test Checklist');

        const submitButton = modal.locator('[data-testid="submit-checklist-button"]');
        await submitButton.click();

        await expect(modal.locator('[data-testid="checklist"]')).toBeVisible();
      }
    }
  });

  test('should add comment to card', async ({ kanbanPage }) => {
    const cards = kanbanPage.getAllCards();
    const firstCard = cards.first();

    if (await firstCard.isVisible()) {
      await firstCard.click();

      const modal = kanbanPage.page.locator('[data-testid="card-detail-modal"]');
      const commentInput = modal.locator('[data-testid="comment-input"]');

      if (await commentInput.isVisible()) {
        const comment = 'This is a test comment';
        await commentInput.fill(comment);

        const submitButton = modal.locator('[data-testid="submit-comment-button"]');
        await submitButton.click();

        await expect(modal.locator('[data-testid="comment"]').filter({ hasText: comment })).toBeVisible();
      }
    }
  });

  test('should assign member to card', async ({ kanbanPage }) => {
    const cards = kanbanPage.getAllCards();
    const firstCard = cards.first();

    if (await firstCard.isVisible()) {
      await firstCard.click();

      const modal = kanbanPage.page.locator('[data-testid="card-detail-modal"]');
      const assignButton = modal.locator('[data-testid="assign-member-button"]');

      if (await assignButton.isVisible()) {
        await assignButton.click();

        const memberOption = kanbanPage.page.locator('[data-testid="member-option"]').first();
        if (await memberOption.isVisible()) {
          await memberOption.click();

          await expect(modal.locator('[data-testid="assigned-member"]')).toBeVisible();
        }
      }
    }
  });
});

test.describe('Card Priority', () => {
  test.beforeEach(async ({ kanbanPage }) => {
    await kanbanPage.goto('/board/board-1');
    await kanbanPage.waitForBoard();
  });

  test('should set card priority', async ({ kanbanPage }) => {
    const cards = kanbanPage.getAllCards();
    const firstCard = cards.first();

    if (await firstCard.isVisible()) {
      await firstCard.click();

      const modal = kanbanPage.page.locator('[data-testid="card-detail-modal"]');
      const priorityButton = modal.locator('[data-testid="set-priority-button"]');

      if (await priorityButton.isVisible()) {
        await priorityButton.click();

        const highPriority = kanbanPage.page.locator('[data-testid="priority-high"]');
        await highPriority.click();

        await expect(modal.locator('[data-testid="priority-indicator"]')).toBeVisible();
      }
    }
  });
});
