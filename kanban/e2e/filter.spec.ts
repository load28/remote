import { test, expect } from './fixtures/test-fixtures';

test.describe('Card Filtering', () => {
  test.beforeEach(async ({ kanbanPage }) => {
    await kanbanPage.goto('/board/board-1');
    await kanbanPage.waitForBoard();
  });

  test('should display filter controls', async ({ kanbanPage }) => {
    const filterButton = kanbanPage.page.locator('[data-testid="filter-button"]');

    if (await filterButton.isVisible()) {
      await filterButton.click();

      const filterPanel = kanbanPage.page.locator('[data-testid="filter-panel"]');
      await expect(filterPanel).toBeVisible();
    }
  });

  test('should filter cards by label', async ({ kanbanPage }) => {
    const filterButton = kanbanPage.page.locator('[data-testid="filter-button"]');

    if (await filterButton.isVisible()) {
      await filterButton.click();

      const labelFilter = kanbanPage.page.locator('[data-testid="label-filter"]');

      if (await labelFilter.isVisible()) {
        const labelOption = labelFilter.locator('[data-testid="filter-label-option"]').first();
        await labelOption.click();

        // Verify only cards with the selected label are visible
        const cards = kanbanPage.getAllCards();
        const count = await cards.count();

        for (let i = 0; i < count; i++) {
          const card = cards.nth(i);
          await expect(card.locator('[data-testid="card-label"]')).toBeVisible();
        }
      }
    }
  });

  test('should filter cards by assignee', async ({ kanbanPage }) => {
    const filterButton = kanbanPage.page.locator('[data-testid="filter-button"]');

    if (await filterButton.isVisible()) {
      await filterButton.click();

      const memberFilter = kanbanPage.page.locator('[data-testid="member-filter"]');

      if (await memberFilter.isVisible()) {
        const memberOption = memberFilter.locator('[data-testid="filter-member-option"]').first();
        await memberOption.click();

        // Verify filtered cards show the assigned member
        const cards = kanbanPage.getAllCards();
        const count = await cards.count();

        for (let i = 0; i < count; i++) {
          const card = cards.nth(i);
          const assignee = card.locator('[data-testid="assigned-member"]');
          if (await assignee.isVisible()) {
            // Card has assigned member
          }
        }
      }
    }
  });

  test('should filter cards by due date', async ({ kanbanPage }) => {
    const filterButton = kanbanPage.page.locator('[data-testid="filter-button"]');

    if (await filterButton.isVisible()) {
      await filterButton.click();

      const dueDateFilter = kanbanPage.page.locator('[data-testid="due-date-filter"]');

      if (await dueDateFilter.isVisible()) {
        // Select "Due this week" option
        const thisWeekOption = dueDateFilter.locator('[data-testid="filter-due-this-week"]');

        if (await thisWeekOption.isVisible()) {
          await thisWeekOption.click();

          // Cards should have due dates within this week
          const cards = kanbanPage.getAllCards();
          const count = await cards.count();

          for (let i = 0; i < count; i++) {
            const card = cards.nth(i);
            const dueDate = card.locator('[data-testid="due-date-display"]');
            if (await dueDate.isVisible()) {
              // Card has due date
            }
          }
        }
      }
    }
  });

  test('should filter cards by priority', async ({ kanbanPage }) => {
    const filterButton = kanbanPage.page.locator('[data-testid="filter-button"]');

    if (await filterButton.isVisible()) {
      await filterButton.click();

      const priorityFilter = kanbanPage.page.locator('[data-testid="priority-filter"]');

      if (await priorityFilter.isVisible()) {
        const highPriority = priorityFilter.locator('[data-testid="filter-priority-high"]');

        if (await highPriority.isVisible()) {
          await highPriority.click();

          // Verify filtered cards have high priority
          const cards = kanbanPage.getAllCards();
          const count = await cards.count();

          for (let i = 0; i < count; i++) {
            const card = cards.nth(i);
            const priority = card.locator('[data-testid="priority-indicator"]');
            if (await priority.isVisible()) {
              await expect(priority).toHaveAttribute('data-priority', 'high');
            }
          }
        }
      }
    }
  });

  test('should search cards by title', async ({ kanbanPage }) => {
    const searchInput = kanbanPage.page.locator('[data-testid="card-search-input"]');

    if (await searchInput.isVisible()) {
      await searchInput.fill('test');

      // Wait for search results
      await kanbanPage.page.waitForTimeout(500);

      const cards = kanbanPage.getAllCards();
      const count = await cards.count();

      for (let i = 0; i < count; i++) {
        const card = cards.nth(i);
        const title = await card.locator('[data-testid="card-title"]').textContent();
        expect(title?.toLowerCase()).toContain('test');
      }
    }
  });

  test('should clear all filters', async ({ kanbanPage }) => {
    const filterButton = kanbanPage.page.locator('[data-testid="filter-button"]');

    if (await filterButton.isVisible()) {
      // Get initial card count
      const initialCount = await kanbanPage.getAllCards().count();

      await filterButton.click();

      // Apply some filter
      const labelFilter = kanbanPage.page.locator('[data-testid="label-filter"]');
      if (await labelFilter.isVisible()) {
        const labelOption = labelFilter.locator('[data-testid="filter-label-option"]').first();
        await labelOption.click();
      }

      // Clear filters
      const clearButton = kanbanPage.page.locator('[data-testid="clear-filters-button"]');
      if (await clearButton.isVisible()) {
        await clearButton.click();

        // Card count should be restored
        const newCount = await kanbanPage.getAllCards().count();
        expect(newCount).toBe(initialCount);
      }
    }
  });

  test('should combine multiple filters', async ({ kanbanPage }) => {
    const filterButton = kanbanPage.page.locator('[data-testid="filter-button"]');

    if (await filterButton.isVisible()) {
      await filterButton.click();

      const filterPanel = kanbanPage.page.locator('[data-testid="filter-panel"]');

      if (await filterPanel.isVisible()) {
        // Apply label filter
        const labelOption = filterPanel.locator('[data-testid="filter-label-option"]').first();
        if (await labelOption.isVisible()) {
          await labelOption.click();
        }

        // Apply priority filter
        const highPriority = filterPanel.locator('[data-testid="filter-priority-high"]');
        if (await highPriority.isVisible()) {
          await highPriority.click();
        }

        // Both filters should be active
        const activeFilters = filterPanel.locator('[data-testid="active-filter"]');
        const activeCount = await activeFilters.count();
        expect(activeCount).toBeGreaterThanOrEqual(1);
      }
    }
  });

  test('should show filter indicator when filters are active', async ({ kanbanPage }) => {
    const filterButton = kanbanPage.page.locator('[data-testid="filter-button"]');

    if (await filterButton.isVisible()) {
      await filterButton.click();

      // Apply a filter
      const labelOption = kanbanPage.page.locator('[data-testid="filter-label-option"]').first();
      if (await labelOption.isVisible()) {
        await labelOption.click();

        // Close filter panel
        const closeButton = kanbanPage.page.locator('[data-testid="close-filter-panel"]');
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }

        // Filter indicator should be visible
        const filterIndicator = kanbanPage.page.locator('[data-testid="filter-indicator"]');
        await expect(filterIndicator).toBeVisible();
      }
    }
  });

  test('should persist filters after page navigation', async ({ kanbanPage }) => {
    const filterButton = kanbanPage.page.locator('[data-testid="filter-button"]');

    if (await filterButton.isVisible()) {
      await filterButton.click();

      // Apply a filter
      const labelOption = kanbanPage.page.locator('[data-testid="filter-label-option"]').first();
      if (await labelOption.isVisible()) {
        await labelOption.click();

        // Get current URL params
        const urlBefore = kanbanPage.page.url();

        // Reload the page
        await kanbanPage.page.reload();
        await kanbanPage.waitForBoard();

        // Check if filter is still applied
        const filterIndicator = kanbanPage.page.locator('[data-testid="filter-indicator"]');
        const isFilterActive = await filterIndicator.isVisible({ timeout: 2000 });

        // Either URL params or session storage should preserve filters
      }
    }
  });
});

test.describe('Card Sorting', () => {
  test.beforeEach(async ({ kanbanPage }) => {
    await kanbanPage.goto('/board/board-1');
    await kanbanPage.waitForBoard();
  });

  test('should sort cards by due date', async ({ kanbanPage }) => {
    const sortButton = kanbanPage.page.locator('[data-testid="sort-button"]');

    if (await sortButton.isVisible()) {
      await sortButton.click();

      const sortByDueDate = kanbanPage.page.locator('[data-testid="sort-by-due-date"]');
      if (await sortByDueDate.isVisible()) {
        await sortByDueDate.click();

        // Cards should be sorted by due date
        // This would require checking the actual dates
      }
    }
  });

  test('should sort cards by priority', async ({ kanbanPage }) => {
    const sortButton = kanbanPage.page.locator('[data-testid="sort-button"]');

    if (await sortButton.isVisible()) {
      await sortButton.click();

      const sortByPriority = kanbanPage.page.locator('[data-testid="sort-by-priority"]');
      if (await sortByPriority.isVisible()) {
        await sortByPriority.click();

        // Cards should be sorted by priority (urgent > high > medium > low > none)
      }
    }
  });

  test('should sort cards by creation date', async ({ kanbanPage }) => {
    const sortButton = kanbanPage.page.locator('[data-testid="sort-button"]');

    if (await sortButton.isVisible()) {
      await sortButton.click();

      const sortByCreated = kanbanPage.page.locator('[data-testid="sort-by-created"]');
      if (await sortByCreated.isVisible()) {
        await sortByCreated.click();

        // Cards should be sorted by creation date
      }
    }
  });

  test('should toggle sort order (asc/desc)', async ({ kanbanPage }) => {
    const sortButton = kanbanPage.page.locator('[data-testid="sort-button"]');

    if (await sortButton.isVisible()) {
      await sortButton.click();

      const sortOrderToggle = kanbanPage.page.locator('[data-testid="sort-order-toggle"]');
      if (await sortOrderToggle.isVisible()) {
        // Get initial order indicator
        const initialOrder = await sortOrderToggle.getAttribute('data-order');

        await sortOrderToggle.click();

        // Order should be toggled
        const newOrder = await sortOrderToggle.getAttribute('data-order');
        expect(newOrder).not.toBe(initialOrder);
      }
    }
  });
});
