'use client';

import { useState } from 'react';
import styles from './FilterBar.module.css';
import type { CardFilters, DueDateFilter } from '../model';
import { DUE_DATE_FILTER_LABELS } from '../model';
import type { Label } from '@/entities/label';
import type { Member } from '@/entities/member';
import { CARD_PRIORITY_LABELS, type CardPriority } from '@/entities/card';

interface FilterBarProps {
  filters: CardFilters;
  labels: Label[];
  members: Member[];
  onFilterChange: <K extends keyof CardFilters>(key: K, value: CardFilters[K]) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export function FilterBar({
  filters,
  labels,
  members,
  onFilterChange,
  onReset,
  hasActiveFilters,
}: FilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleLabelFilter = (labelId: string) => {
    const newLabelIds = filters.labelIds.includes(labelId)
      ? filters.labelIds.filter((id) => id !== labelId)
      : [...filters.labelIds, labelId];
    onFilterChange('labelIds', newLabelIds);
  };

  const toggleAssigneeFilter = (memberId: string) => {
    const newAssigneeIds = filters.assigneeIds.includes(memberId)
      ? filters.assigneeIds.filter((id) => id !== memberId)
      : [...filters.assigneeIds, memberId];
    onFilterChange('assigneeIds', newAssigneeIds);
  };

  return (
    <div className={styles.filterBar}>
      <div className={styles.searchWrapper}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search cards..."
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
        />
        {filters.search && (
          <button
            type="button"
            className={styles.clearSearch}
            onClick={() => onFilterChange('search', '')}
          >
            ×
          </button>
        )}
      </div>

      <div className={styles.filterDropdowns}>
        {/* Labels Filter */}
        <div className={styles.dropdown}>
          <button
            type="button"
            className={`${styles.dropdownTrigger} ${filters.labelIds.length > 0 ? styles.active : ''}`}
            onClick={() => setOpenDropdown(openDropdown === 'labels' ? null : 'labels')}
          >
            Labels {filters.labelIds.length > 0 && `(${filters.labelIds.length})`}
          </button>
          {openDropdown === 'labels' && (
            <div className={styles.dropdownMenu}>
              {labels.map((label) => (
                <label key={label.id} className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    checked={filters.labelIds.includes(label.id)}
                    onChange={() => toggleLabelFilter(label.id)}
                  />
                  <span className={styles.labelColor} style={{ backgroundColor: label.color }} />
                  <span>{label.name}</span>
                </label>
              ))}
              {labels.length === 0 && <p className={styles.emptyMessage}>No labels</p>}
            </div>
          )}
        </div>

        {/* Members Filter */}
        <div className={styles.dropdown}>
          <button
            type="button"
            className={`${styles.dropdownTrigger} ${filters.assigneeIds.length > 0 ? styles.active : ''}`}
            onClick={() => setOpenDropdown(openDropdown === 'members' ? null : 'members')}
          >
            Members {filters.assigneeIds.length > 0 && `(${filters.assigneeIds.length})`}
          </button>
          {openDropdown === 'members' && (
            <div className={styles.dropdownMenu}>
              {members.map((member) => (
                <label key={member.id} className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    checked={filters.assigneeIds.includes(member.id)}
                    onChange={() => toggleAssigneeFilter(member.id)}
                  />
                  <span>{member.name}</span>
                </label>
              ))}
              {members.length === 0 && <p className={styles.emptyMessage}>No members</p>}
            </div>
          )}
        </div>

        {/* Priority Filter */}
        <div className={styles.dropdown}>
          <button
            type="button"
            className={`${styles.dropdownTrigger} ${filters.priority !== 'all' ? styles.active : ''}`}
            onClick={() => setOpenDropdown(openDropdown === 'priority' ? null : 'priority')}
          >
            Priority {filters.priority !== 'all' && `(${CARD_PRIORITY_LABELS[filters.priority]})`}
          </button>
          {openDropdown === 'priority' && (
            <div className={styles.dropdownMenu}>
              <label className={styles.radioItem}>
                <input
                  type="radio"
                  name="priority"
                  checked={filters.priority === 'all'}
                  onChange={() => onFilterChange('priority', 'all')}
                />
                <span>All priorities</span>
              </label>
              {(Object.entries(CARD_PRIORITY_LABELS) as [CardPriority, string][]).map(([value, label]) => (
                <label key={value} className={styles.radioItem}>
                  <input
                    type="radio"
                    name="priority"
                    checked={filters.priority === value}
                    onChange={() => onFilterChange('priority', value)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Due Date Filter */}
        <div className={styles.dropdown}>
          <button
            type="button"
            className={`${styles.dropdownTrigger} ${filters.dueDate !== 'all' ? styles.active : ''}`}
            onClick={() => setOpenDropdown(openDropdown === 'dueDate' ? null : 'dueDate')}
          >
            Due date {filters.dueDate !== 'all' && `(${DUE_DATE_FILTER_LABELS[filters.dueDate]})`}
          </button>
          {openDropdown === 'dueDate' && (
            <div className={styles.dropdownMenu}>
              {(Object.entries(DUE_DATE_FILTER_LABELS) as [DueDateFilter, string][]).map(([value, label]) => (
                <label key={value} className={styles.radioItem}>
                  <input
                    type="radio"
                    name="dueDate"
                    checked={filters.dueDate === value}
                    onChange={() => onFilterChange('dueDate', value)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {hasActiveFilters && (
        <button type="button" className={styles.resetButton} onClick={onReset}>
          Clear filters
        </button>
      )}
    </div>
  );
}
