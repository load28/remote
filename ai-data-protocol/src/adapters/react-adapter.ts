/**
 * React Adapter for AIDP
 *
 * RenderNode → React Element 변환
 * React에 종속적인 부분만 여기서 처리
 */

import {
  AIDPAdapter,
  RenderNode,
  RenderNodeType,
  RenderContext,
  AbstractStyle,
  EventHandler,
  ThemeConfig,
} from '../core/adapter';
import { VisualizationSpec, VisualizationType } from '../core/protocol';

// React 타입 (실제 구현시 import React from 'react')
type ReactNode = unknown;
type ReactElement = {
  type: string | Function;
  props: Record<string, unknown>;
  key?: string | number;
};

/**
 * React 어댑터 구현
 */
export class ReactAdapter implements AIDPAdapter<ReactNode> {
  name = 'react';

  supportedNodeTypes: RenderNodeType[] = [
    'container', 'row', 'column', 'grid', 'stack',
    'text', 'number', 'currency', 'date', 'image',
    'input', 'select', 'checkbox', 'button',
    'chart',
    'table', 'table-header', 'table-row', 'table-cell',
    'list', 'list-item',
    'card', 'card-header', 'card-body', 'card-footer',
  ];

  supportedChartTypes: VisualizationType[] = [
    'bar-chart', 'line-chart', 'pie-chart', 'area-chart',
    'scatter-plot', 'table', 'metric-card',
  ];

  /**
   * RenderNode → React Element
   */
  render(node: RenderNode, context: RenderContext): ReactElement {
    const style = node.style ? this.transformStyle(node.style, context.theme) : {};
    const events = node.events ? this.transformEvents(node.events) : {};

    // 데이터 바인딩 처리
    const boundProps = this.applyBindings(node, context);

    const props = {
      ...node.props,
      ...boundProps,
      style,
      ...events,
    };

    const children = node.children?.map((child, index) => ({
      ...this.render(child, context),
      key: index,
    }));

    return {
      type: this.mapNodeType(node.type),
      props: children ? { ...props, children } : props,
    };
  }

  /**
   * 차트 렌더링 (차트 라이브러리 연동)
   */
  renderChart(
    spec: VisualizationSpec,
    data: unknown[],
    context: RenderContext
  ): ReactElement {
    // 실제 구현에서는 recharts, visx, d3 등과 연동
    return {
      type: 'AIDPChart', // 커스텀 차트 컴포넌트
      props: {
        type: spec.type,
        data,
        bindings: spec.bindings,
        layout: spec.layout,
        colorScheme: this.getColorScheme(spec.style?.colorScheme, context.theme),
        interactions: spec.interactions,
      },
    };
  }

  /**
   * AbstractStyle → CSS-in-JS 스타일
   */
  transformStyle(style: AbstractStyle, theme?: ThemeConfig): Record<string, unknown> {
    const t = theme || defaultTheme;
    const css: Record<string, unknown> = {};

    // 크기
    if (style.width) css.width = this.toSizeValue(style.width);
    if (style.height) css.height = this.toSizeValue(style.height);
    if (style.minWidth) css.minWidth = this.toSizeValue(style.minWidth);
    if (style.maxWidth) css.maxWidth = this.toSizeValue(style.maxWidth);

    // 여백
    if (style.padding) css.padding = t.spacing[style.padding];
    if (style.margin) css.margin = t.spacing[style.margin];
    if (style.gap) css.gap = t.spacing[style.gap];

    // Flexbox
    if (style.align) css.alignItems = this.toFlexAlign(style.align);
    if (style.justify) css.justifyContent = this.toFlexJustify(style.justify);

    // 색상
    if (style.background) css.backgroundColor = t.colors[style.background];
    if (style.foreground) css.color = t.colors[style.foreground];
    if (style.border) css.borderColor = t.colors[style.border];

    // 텍스트
    if (style.fontSize) css.fontSize = t.fontSize[style.fontSize];
    if (style.fontWeight) {
      css.fontWeight = style.fontWeight === 'bold' ? 700 : style.fontWeight === 'medium' ? 500 : 400;
    }

    // 기타
    if (style.rounded) css.borderRadius = t.borderRadius[style.rounded];
    if (style.shadow) css.boxShadow = this.toBoxShadow(style.shadow);
    if (style.opacity !== undefined) css.opacity = style.opacity;

    return css;
  }

  /**
   * EventHandler → React 이벤트 핸들러
   */
  transformEvents(events: Record<string, EventHandler>): Record<string, Function> {
    const handlers: Record<string, Function> = {};

    for (const [eventName, handler] of Object.entries(events)) {
      const reactEventName = this.toReactEventName(eventName);
      handlers[reactEventName] = () => {
        // 실제 구현에서는 상태 관리와 연동
        console.log(`Event: ${handler.action}`, handler.payload);
      };
    }

    return handlers;
  }

  // ============================================
  // Private 헬퍼 메서드
  // ============================================

  private mapNodeType(type: RenderNodeType): string {
    const mapping: Record<RenderNodeType, string> = {
      container: 'div',
      row: 'div',
      column: 'div',
      grid: 'div',
      stack: 'div',
      text: 'span',
      number: 'span',
      currency: 'span',
      date: 'span',
      image: 'img',
      input: 'input',
      select: 'select',
      checkbox: 'input',
      button: 'button',
      chart: 'AIDPChart',
      table: 'table',
      'table-header': 'thead',
      'table-row': 'tr',
      'table-cell': 'td',
      list: 'ul',
      'list-item': 'li',
      card: 'div',
      'card-header': 'div',
      'card-body': 'div',
      'card-footer': 'div',
    };
    return mapping[type] || 'div';
  }

  private applyBindings(node: RenderNode, context: RenderContext): Record<string, unknown> {
    if (!node.bindings || !context.data) return {};

    const result: Record<string, unknown> = {};

    for (const binding of node.bindings) {
      const value = this.getValueByPath(context.data, binding.path);
      const transformed = binding.transform ? binding.transform(value) : value;
      result[binding.prop] = transformed;
    }

    // 특수 노드 타입 처리
    if (node.type === 'currency' && node.props.value !== undefined) {
      result.children = context.formatters.currency(
        node.props.value as number,
        (node.props.code as string) || 'KRW'
      );
    }
    if (node.type === 'date' && node.props.value !== undefined) {
      result.children = context.formatters.date(
        node.props.value as string,
        (node.props.format as string) || 'YYYY-MM-DD'
      );
    }
    if (node.type === 'number' && node.props.value !== undefined) {
      result.children = context.formatters.number(node.props.value as number);
    }
    if (node.type === 'text' && node.props.value !== undefined) {
      result.children = node.props.value;
    }

    return result;
  }

  private getValueByPath(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((acc: unknown, part) => {
      if (acc && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, obj);
  }

  private toSizeValue(value: number | string): string | number {
    if (typeof value === 'number') return value;
    if (value === 'full') return '100%';
    if (value === 'auto') return 'auto';
    return value;
  }

  private toFlexAlign(align: string): string {
    const map: Record<string, string> = {
      start: 'flex-start',
      center: 'center',
      end: 'flex-end',
      stretch: 'stretch',
    };
    return map[align] || align;
  }

  private toFlexJustify(justify: string): string {
    const map: Record<string, string> = {
      start: 'flex-start',
      center: 'center',
      end: 'flex-end',
      between: 'space-between',
      around: 'space-around',
    };
    return map[justify] || justify;
  }

  private toBoxShadow(shadow: string): string {
    const shadows: Record<string, string> = {
      none: 'none',
      sm: '0 1px 2px rgba(0,0,0,0.05)',
      md: '0 4px 6px rgba(0,0,0,0.1)',
      lg: '0 10px 15px rgba(0,0,0,0.1)',
    };
    return shadows[shadow] || 'none';
  }

  private toReactEventName(eventName: string): string {
    return `on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`;
  }

  private getColorScheme(scheme: string | undefined, theme: ThemeConfig): string[] {
    // 실제 구현에서는 테마 기반 색상 팔레트 반환
    if (scheme === 'categorical') {
      return ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    }
    if (scheme === 'sequential') {
      return ['#E0E7FF', '#A5B4FC', '#6366F1', '#4F46E5', '#3730A3'];
    }
    return [theme.colors.primary, theme.colors.secondary];
  }
}

// 기본 테마
const defaultTheme: ThemeConfig = {
  colors: {
    primary: '#4F46E5',
    secondary: '#6B7280',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#111827',
    muted: '#6B7280',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    '2xl': 32,
  },
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999,
  },
};

// 기본 RenderContext 생성 헬퍼
export function createReactContext(
  data?: Record<string, unknown>,
  theme?: Partial<ThemeConfig>
): RenderContext {
  return {
    theme: { ...defaultTheme, ...theme },
    locale: 'ko-KR',
    formatters: {
      currency: (value, code) =>
        new Intl.NumberFormat('ko-KR', {
          style: 'currency',
          currency: code,
        }).format(value),
      date: (value, _format) =>
        new Date(value).toLocaleDateString('ko-KR'),
      number: (value, options) =>
        new Intl.NumberFormat('ko-KR', options).format(value),
    },
    data,
  };
}
