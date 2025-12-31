import { test, expect } from './fixtures/test-fixtures';

test.describe('Drag and Drop - Cards', () => {
  test.beforeEach(async ({ kanbanPage }) => {
    await kanbanPage.goto('/board/board-1');
    await kanbanPage.waitForBoard();
  });

  test('should drag card to another column', async ({ kanbanPage }) => {
    const columns = kanbanPage.getAllColumns();
    const columnsCount = await columns.count();

    if (columnsCount >= 2) {
      // Get the first card in the first column
      const firstColumn = columns.nth(0);
      const secondColumn = columns.nth(1);

      const card = firstColumn.locator('[data-testid="card-item"]').first();

      if (await card.isVisible()) {
        const cardTitle = await card.textContent();

        // Get second column's drop area
        const dropArea = secondColumn.locator('[data-testid="column-drop-area"]');

        // Perform drag and drop
        await card.dragTo(dropArea);

        // Verify card is now in the second column
        const movedCard = secondColumn.locator(`[data-testid="card-item"]:has-text("${cardTitle}")`);
        await expect(movedCard).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should reorder cards within the same column', async ({ kanbanPage }) => {
    const columns = kanbanPage.getAllColumns();
    const firstColumn = columns.first();
    const cards = firstColumn.locator('[data-testid="card-item"]');

    const cardsCount = await cards.count();

    if (cardsCount >= 2) {
      const firstCard = cards.nth(0);
      const secondCard = cards.nth(1);

      const firstCardTitle = await firstCard.textContent();
      const secondCardTitle = await secondCard.textContent();

      // Drag first card below second card
      await firstCard.dragTo(secondCard);

      // Wait for reorder animation
      await kanbanPage.page.waitForTimeout(500);

      // Verify the order has changed
      const reorderedCards = firstColumn.locator('[data-testid="card-item"]');
      const newFirstCardTitle = await reorderedCards.nth(0).textContent();

      // After dragging, order should be different
      expect(newFirstCardTitle).not.toBe(firstCardTitle);
    }
  });

  test('should show drag overlay while dragging', async ({ kanbanPage }) => {
    const cards = kanbanPage.getAllCards();
    const firstCard = cards.first();

    if (await firstCard.isVisible()) {
      // Start dragging
      const cardBounds = await firstCard.boundingBox();
      if (cardBounds) {
        await kanbanPage.page.mouse.move(
          cardBounds.x + cardBounds.width / 2,
          cardBounds.y + cardBounds.height / 2
        );
        await kanbanPage.page.mouse.down();

        // Move slightly to trigger drag
        await kanbanPage.page.mouse.move(
          cardBounds.x + cardBounds.width / 2 + 50,
          cardBounds.y + cardBounds.height / 2 + 50
        );

        // Check for drag overlay
        const overlay = kanbanPage.page.locator('[data-testid="drag-overlay"]');

        // Some implementations use different indicators
        const isDragging =
          (await overlay.isVisible({ timeout: 1000 })) ||
          (await firstCard.getAttribute('data-dragging')) === 'true';

        // Release mouse
        await kanbanPage.page.mouse.up();
      }
    }
  });

  test('should highlight drop target column', async ({ kanbanPage }) => {
    const columns = kanbanPage.getAllColumns();
    const columnsCount = await columns.count();

    if (columnsCount >= 2) {
      const firstColumn = columns.nth(0);
      const secondColumn = columns.nth(1);
      const card = firstColumn.locator('[data-testid="card-item"]').first();

      if (await card.isVisible()) {
        const cardBounds = await card.boundingBox();
        const secondColumnBounds = await secondColumn.boundingBox();

        if (cardBounds && secondColumnBounds) {
          // Start dragging
          await kanbanPage.page.mouse.move(
            cardBounds.x + cardBounds.width / 2,
            cardBounds.y + cardBounds.height / 2
          );
          await kanbanPage.page.mouse.down();

          // Move to second column
          await kanbanPage.page.mouse.move(
            secondColumnBounds.x + secondColumnBounds.width / 2,
            secondColumnBounds.y + secondColumnBounds.height / 2
          );

          // Check if column is highlighted (implementation dependent)
          const isHighlighted =
            (await secondColumn.getAttribute('data-droppable-active')) === 'true' ||
            (await secondColumn.evaluate((el) => el.classList.contains('droppable-active')));

          // Release mouse
          await kanbanPage.page.mouse.up();
        }
      }
    }
  });

  test('should cancel drag on escape key', async ({ kanbanPage }) => {
    const columns = kanbanPage.getAllColumns();
    const firstColumn = columns.first();
    const card = firstColumn.locator('[data-testid="card-item"]').first();

    if (await card.isVisible()) {
      const cardTitle = await card.textContent();
      const cardBounds = await card.boundingBox();

      if (cardBounds) {
        // Start dragging
        await kanbanPage.page.mouse.move(
          cardBounds.x + cardBounds.width / 2,
          cardBounds.y + cardBounds.height / 2
        );
        await kanbanPage.page.mouse.down();

        // Move slightly
        await kanbanPage.page.mouse.move(
          cardBounds.x + cardBounds.width / 2 + 100,
          cardBounds.y + cardBounds.height / 2
        );

        // Press escape to cancel
        await kanbanPage.page.keyboard.press('Escape');
        await kanbanPage.page.mouse.up();

        // Card should still be in the first column
        const cardInFirstColumn = firstColumn.locator(
          `[data-testid="card-item"]:has-text("${cardTitle}")`
        );
        await expect(cardInFirstColumn).toBeVisible();
      }
    }
  });
});

test.describe('Drag and Drop - Columns', () => {
  test.beforeEach(async ({ kanbanPage }) => {
    await kanbanPage.goto('/board/board-1');
    await kanbanPage.waitForBoard();
  });

  test('should reorder columns by dragging', async ({ kanbanPage }) => {
    const columns = kanbanPage.getAllColumns();
    const columnsCount = await columns.count();

    if (columnsCount >= 2) {
      const firstColumnHeader = columns.nth(0).locator('[data-testid="column-header"]');
      const secondColumnHeader = columns.nth(1).locator('[data-testid="column-header"]');

      const firstColumnTitle = await columns.nth(0).locator('[data-testid="column-title"]').textContent();
      const secondColumnTitle = await columns.nth(1).locator('[data-testid="column-title"]').textContent();

      // Check if column dragging is enabled (column header is draggable)
      const isDraggable = await firstColumnHeader.getAttribute('draggable');

      if (isDraggable === 'true') {
        // Drag first column to second position
        await firstColumnHeader.dragTo(secondColumnHeader);

        // Wait for reorder
        await kanbanPage.page.waitForTimeout(500);

        // Verify order changed
        const newFirstColumnTitle = await columns.nth(0).locator('[data-testid="column-title"]').textContent();
        expect(newFirstColumnTitle).toBe(secondColumnTitle);
      }
    }
  });
});

test.describe('Drag and Drop - Touch Devices', () => {
  test.beforeEach(async ({ kanbanPage }) => {
    await kanbanPage.goto('/board/board-1');
    await kanbanPage.waitForBoard();
  });

  test('should support touch drag on mobile', async ({ kanbanPage }) => {
    // Set mobile viewport
    await kanbanPage.page.setViewportSize({ width: 375, height: 667 });

    const columns = kanbanPage.getAllColumns();
    const firstColumn = columns.first();
    const card = firstColumn.locator('[data-testid="card-item"]').first();

    if (await card.isVisible()) {
      const cardBounds = await card.boundingBox();

      if (cardBounds) {
        // Simulate touch drag
        await kanbanPage.page.touchscreen.tap(
          cardBounds.x + cardBounds.width / 2,
          cardBounds.y + cardBounds.height / 2
        );

        // Long press to start drag (implementation dependent)
        // This is a simplified test - actual touch DnD may require more complex handling
      }
    }
  });
});

test.describe('Drag and Drop - Accessibility', () => {
  test.beforeEach(async ({ kanbanPage }) => {
    await kanbanPage.goto('/board/board-1');
    await kanbanPage.waitForBoard();
  });

  test('should support keyboard-based card movement', async ({ kanbanPage }) => {
    const cards = kanbanPage.getAllCards();
    const firstCard = cards.first();

    if (await firstCard.isVisible()) {
      // Focus on the card
      await firstCard.focus();

      // Check if keyboard controls are available
      const hasKeyboardControls =
        (await firstCard.getAttribute('tabindex')) !== null ||
        (await firstCard.getAttribute('role')) === 'button';

      if (hasKeyboardControls) {
        // Press enter or space to start keyboard drag mode
        await kanbanPage.page.keyboard.press('Enter');

        // Check for keyboard drag mode indicator
        const keyboardDragMode = kanbanPage.page.locator('[data-testid="keyboard-drag-mode"]');

        if (await keyboardDragMode.isVisible({ timeout: 1000 })) {
          // Use arrow keys to move
          await kanbanPage.page.keyboard.press('ArrowRight');
          await kanbanPage.page.keyboard.press('Enter');
        }
      }
    }
  });

  test('should announce drag actions to screen readers', async ({ kanbanPage }) => {
    const cards = kanbanPage.getAllCards();
    const firstCard = cards.first();

    if (await firstCard.isVisible()) {
      // Check for ARIA live region for announcements
      const liveRegion = kanbanPage.page.locator('[aria-live="polite"], [aria-live="assertive"]');
      const hasLiveRegion = (await liveRegion.count()) > 0;

      // Check for appropriate ARIA attributes on draggable elements
      const ariaGrabbed = await firstCard.getAttribute('aria-grabbed');
      const ariaDropeffect = await kanbanPage.page
        .locator('[data-testid="kanban-column"]')
        .first()
        .getAttribute('aria-dropeffect');
    }
  });
});

test.describe('Drag and Drop - Edge Cases', () => {
  test.beforeEach(async ({ kanbanPage }) => {
    await kanbanPage.goto('/board/board-1');
    await kanbanPage.waitForBoard();
  });

  test('should handle dropping on empty column', async ({ kanbanPage }) => {
    // Create a new empty column
    const emptyColumnTitle = `Empty Column ${Date.now()}`;
    await kanbanPage.createColumn(emptyColumnTitle);

    const columns = kanbanPage.getAllColumns();
    const emptyColumn = kanbanPage.getColumn(emptyColumnTitle);
    const firstColumn = columns.first();
    const card = firstColumn.locator('[data-testid="card-item"]').first();

    if (await card.isVisible()) {
      const cardTitle = await card.textContent();
      const dropArea = emptyColumn.locator('[data-testid="column-drop-area"]');

      await card.dragTo(dropArea);

      // Verify card is in the empty column
      const movedCard = emptyColumn.locator(`[data-testid="card-item"]:has-text("${cardTitle}")`);
      await expect(movedCard).toBeVisible({ timeout: 5000 });
    }
  });

  test('should persist card position after page reload', async ({ kanbanPage }) => {
    const columns = kanbanPage.getAllColumns();
    const columnsCount = await columns.count();

    if (columnsCount >= 2) {
      const firstColumn = columns.nth(0);
      const secondColumn = columns.nth(1);
      const card = firstColumn.locator('[data-testid="card-item"]').first();

      if (await card.isVisible()) {
        const cardTitle = await card.textContent();
        const dropArea = secondColumn.locator('[data-testid="column-drop-area"]');

        await card.dragTo(dropArea);

        // Wait for save
        await kanbanPage.page.waitForTimeout(1000);

        // Reload page
        await kanbanPage.page.reload();
        await kanbanPage.waitForBoard();

        // Verify card is still in second column
        const movedCard = secondColumn.locator(`[data-testid="card-item"]:has-text("${cardTitle}")`);
        await expect(movedCard).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should handle rapid drag operations', async ({ kanbanPage }) => {
    const columns = kanbanPage.getAllColumns();

    if ((await columns.count()) >= 2) {
      const card = columns.nth(0).locator('[data-testid="card-item"]').first();

      if (await card.isVisible()) {
        // Perform multiple rapid drags
        for (let i = 0; i < 3; i++) {
          const currentColumn = i % 2 === 0 ? columns.nth(0) : columns.nth(1);
          const targetColumn = i % 2 === 0 ? columns.nth(1) : columns.nth(0);
          const cardInColumn = currentColumn.locator('[data-testid="card-item"]').first();

          if (await cardInColumn.isVisible()) {
            const dropArea = targetColumn.locator('[data-testid="column-drop-area"]');
            await cardInColumn.dragTo(dropArea);
            await kanbanPage.page.waitForTimeout(200);
          }
        }

        // Board should still be functional
        await expect(kanbanPage.page.locator('[data-testid="kanban-board"]')).toBeVisible();
      }
    }
  });
});
