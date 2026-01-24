/**
 * List - 재사용 가능한 리스트 컴포넌트
 * 가상화 및 무한 스크롤 지원
 */

import { Component, ComponentProps } from '../core/Component';
import { classNames, escapeHtml } from '../utils/dom';

export interface ListItem {
  id: string | number;
  [key: string]: unknown;
}

export interface ListProps<T extends ListItem = ListItem> extends ComponentProps {
  items: T[];
  renderItem: (item: T, index: number) => string;
  emptyMessage?: string;
  selectable?: boolean;
  multiSelect?: boolean;
  virtualized?: boolean;
  itemHeight?: number;
  onSelect?: (item: T, index: number) => void;
  onDeselect?: (item: T, index: number) => void;
  onClick?: (item: T, index: number) => void;
}

interface ListState {
  selectedIds: Set<string | number>;
  scrollTop: number;
  visibleRange: { start: number; end: number };
}

export class List<T extends ListItem = ListItem> extends Component<ListProps<T>, ListState> {
  constructor(props: ListProps<T>) {
    super(props, {
      selectedIds: new Set(),
      scrollTop: 0,
      visibleRange: { start: 0, end: 20 }
    });
  }

  protected template(): string {
    const { items, emptyMessage = '항목이 없습니다', virtualized } = this.props;

    if (items.length === 0) {
      return `
        <div class="list list--empty">
          <p class="list__empty-message">${escapeHtml(emptyMessage)}</p>
        </div>
      `;
    }

    const listClass = classNames(
      'list',
      { 'list--virtualized': virtualized || false }
    );

    if (virtualized) {
      return this.renderVirtualized(listClass);
    }

    return this.renderNormal(listClass);
  }

  private renderNormal(listClass: string): string {
    const { items, renderItem, selectable } = this.props;
    const { selectedIds } = this.state.state;

    const itemsHtml = items.map((item, index) => {
      const isSelected = selectedIds.has(item.id);
      const itemClass = classNames(
        'list__item',
        { 'list__item--selectable': selectable || false },
        { 'list__item--selected': isSelected }
      );

      return `
        <li class="${itemClass}" data-id="${item.id}" data-index="${index}">
          ${renderItem(item, index)}
        </li>
      `;
    }).join('');

    return `
      <ul class="${listClass}">
        ${itemsHtml}
      </ul>
    `;
  }

  private renderVirtualized(listClass: string): string {
    const { items, renderItem, selectable, itemHeight = 48 } = this.props;
    const { selectedIds, visibleRange } = this.state.state;

    const totalHeight = items.length * itemHeight;
    const paddingTop = visibleRange.start * itemHeight;

    const visibleItems = items.slice(visibleRange.start, visibleRange.end);
    const itemsHtml = visibleItems.map((item, i) => {
      const index = visibleRange.start + i;
      const isSelected = selectedIds.has(item.id);
      const itemClass = classNames(
        'list__item',
        { 'list__item--selectable': selectable || false },
        { 'list__item--selected': isSelected }
      );

      return `
        <li class="${itemClass}" data-id="${item.id}" data-index="${index}" style="height: ${itemHeight}px;">
          ${renderItem(item, index)}
        </li>
      `;
    }).join('');

    return `
      <div class="${listClass}" style="height: 400px; overflow-y: auto;">
        <ul class="list__inner" style="height: ${totalHeight}px; padding-top: ${paddingTop}px;">
          ${itemsHtml}
        </ul>
      </div>
    `;
  }

  protected bindEvents(): void {
    const { selectable, virtualized } = this.props;

    // 아이템 클릭
    this.bindEvents('.list__item', 'click', (e, index) => {
      const item = this.props.items[index];
      if (!item) return;

      this.props.onClick?.(item, index);
      this.emit('click', { item, index });

      if (selectable) {
        this.toggleSelection(item, index);
      }
    });

    // 가상화된 리스트의 스크롤 처리
    if (virtualized) {
      const container = this.$('.list--virtualized');
      container?.addEventListener('scroll', this.handleScroll);
    }
  }

  private handleScroll = (e: Event): void => {
    const { itemHeight = 48 } = this.props;
    const container = e.target as HTMLElement;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;

    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(start + visibleCount + 5, this.props.items.length);

    this.setState({
      scrollTop,
      visibleRange: { start: Math.max(0, start - 5), end }
    });
  };

  /**
   * 선택 토글
   */
  private toggleSelection(item: T, index: number): void {
    const { multiSelect } = this.props;
    const selectedIds = new Set(this.state.state.selectedIds);

    if (selectedIds.has(item.id)) {
      selectedIds.delete(item.id);
      this.props.onDeselect?.(item, index);
      this.emit('deselect', { item, index });
    } else {
      if (!multiSelect) {
        selectedIds.clear();
      }
      selectedIds.add(item.id);
      this.props.onSelect?.(item, index);
      this.emit('select', { item, index });
    }

    this.setState({ selectedIds });
  }

  /**
   * 선택된 아이템들 가져오기
   */
  getSelectedItems(): T[] {
    const { selectedIds } = this.state.state;
    return this.props.items.filter(item => selectedIds.has(item.id));
  }

  /**
   * 선택 초기화
   */
  clearSelection(): void {
    this.setState({ selectedIds: new Set() });
  }

  /**
   * 특정 아이템 선택
   */
  selectItem(id: string | number): void {
    const selectedIds = new Set(this.state.state.selectedIds);
    if (!this.props.multiSelect) {
      selectedIds.clear();
    }
    selectedIds.add(id);
    this.setState({ selectedIds });
  }

  /**
   * 아이템 목록 업데이트
   */
  setItems(items: T[]): void {
    this.setProps({ items });
  }

  protected beforeUnmount(): void {
    const container = this.$('.list--virtualized');
    container?.removeEventListener('scroll', this.handleScroll);
  }
}

/**
 * List 기본 스타일
 */
export const listStyles = `
  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
  }

  .list--empty {
    padding: 40px;
    text-align: center;
  }

  .list__empty-message {
    color: #6b7280;
    margin: 0;
  }

  .list__inner {
    list-style: none;
    margin: 0;
    padding: 0;
    position: relative;
  }

  .list__item {
    padding: 12px 16px;
    border-bottom: 1px solid #e5e7eb;
    transition: background-color 0.15s ease;
  }

  .list__item:last-child {
    border-bottom: none;
  }

  .list__item--selectable {
    cursor: pointer;
  }

  .list__item--selectable:hover {
    background-color: #f9fafb;
  }

  .list__item--selected {
    background-color: #eff6ff;
  }

  .list__item--selected:hover {
    background-color: #dbeafe;
  }
`;
