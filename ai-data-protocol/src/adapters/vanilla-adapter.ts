/**
 * Vanilla JS Adapter for AIDP
 *
 * RenderNode → DOM Element 변환
 * 프레임워크 없이 순수 JavaScript/DOM API 사용
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

/**
 * Vanilla JS 어댑터 구현
 * 순수 DOM API로 렌더링
 */
export class VanillaAdapter implements AIDPAdapter<HTMLElement | string> {
  name = 'vanilla';

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
    'bar-chart', 'line-chart', 'pie-chart', 'table', 'metric-card',
  ];

  /**
   * RenderNode → HTMLElement
   * 브라우저 환경에서 실제 DOM 요소 생성
   */
  render(node: RenderNode, context: RenderContext): HTMLElement {
    const tagName = this.mapNodeType(node.type);
    const element = document.createElement(tagName);

    // 스타일 적용
    if (node.style) {
      const styles = this.transformStyle(node.style, context.theme);
      Object.assign(element.style, styles);
    }

    // 레이아웃 스타일 추가
    this.applyLayoutStyles(element, node.type);

    // 속성 적용
    this.applyProps(element, node, context);

    // 이벤트 핸들러 적용
    if (node.events) {
      const handlers = this.transformEvents(node.events, context);
      for (const [event, handler] of Object.entries(handlers)) {
        element.addEventListener(event, handler as EventListener);
      }
    }

    // 자식 노드 렌더링
    if (node.children) {
      for (const child of node.children) {
        element.appendChild(this.render(child, context));
      }
    }

    return element;
  }

  /**
   * HTML 문자열로 렌더링 (SSR/빌드타임용)
   */
  renderToString(node: RenderNode, context: RenderContext): string {
    const tagName = this.mapNodeType(node.type);
    const styles = node.style
      ? this.transformStyleToCSS(node.style, context.theme)
      : '';
    const layoutStyles = this.getLayoutCSS(node.type);

    let attributes = '';
    if (styles || layoutStyles) {
      attributes += ` style="${layoutStyles}${styles}"`;
    }

    // 클래스 추가
    attributes += ` class="aidp-${node.type}"`;

    // 특수 속성
    if (node.props.id) attributes += ` id="${node.props.id}"`;

    // 콘텐츠 생성
    let content = this.getTextContent(node, context);

    // 자식 노드
    if (node.children) {
      content += node.children
        .map((child) => this.renderToString(child, context))
        .join('');
    }

    // Self-closing 태그 처리
    if (['img', 'input', 'br', 'hr'].includes(tagName)) {
      return `<${tagName}${attributes} />`;
    }

    return `<${tagName}${attributes}>${content}</${tagName}>`;
  }

  /**
   * 차트 렌더링 (Canvas/SVG 기반)
   */
  renderChart(
    spec: VisualizationSpec,
    data: unknown[],
    context: RenderContext
  ): HTMLElement {
    const container = document.createElement('div');
    container.className = 'aidp-chart';
    container.style.width = '100%';
    container.style.height = '400px';

    // 차트 타입에 따라 다른 렌더링
    switch (spec.type) {
      case 'bar-chart':
        this.renderBarChart(container, spec, data, context);
        break;
      case 'line-chart':
        this.renderLineChart(container, spec, data, context);
        break;
      case 'pie-chart':
        this.renderPieChart(container, spec, data, context);
        break;
      default:
        container.innerHTML = `<p>Chart type "${spec.type}" - use chart library</p>`;
    }

    return container;
  }

  /**
   * AbstractStyle → CSS 스타일 객체
   */
  transformStyle(
    style: AbstractStyle,
    theme?: ThemeConfig
  ): Partial<CSSStyleDeclaration> {
    const t = theme || defaultTheme;
    const css: Partial<CSSStyleDeclaration> = {};

    // 크기
    if (style.width) css.width = this.toSizeValue(style.width);
    if (style.height) css.height = this.toSizeValue(style.height);
    if (style.minWidth) css.minWidth = this.toSizeValue(style.minWidth);
    if (style.maxWidth) css.maxWidth = this.toSizeValue(style.maxWidth);

    // 여백
    if (style.padding) css.padding = `${t.spacing[style.padding]}px`;
    if (style.margin) css.margin = `${t.spacing[style.margin]}px`;
    if (style.gap) css.gap = `${t.spacing[style.gap]}px`;

    // Flexbox
    if (style.align) css.alignItems = this.toFlexAlign(style.align);
    if (style.justify) css.justifyContent = this.toFlexJustify(style.justify);

    // 색상
    if (style.background) css.backgroundColor = t.colors[style.background];
    if (style.foreground) css.color = t.colors[style.foreground];
    if (style.border) css.borderColor = t.colors[style.border];

    // 텍스트
    if (style.fontSize) css.fontSize = `${t.fontSize[style.fontSize]}px`;
    if (style.fontWeight) {
      css.fontWeight = style.fontWeight === 'bold' ? '700' : style.fontWeight === 'medium' ? '500' : '400';
    }

    // 기타
    if (style.rounded) css.borderRadius = `${t.borderRadius[style.rounded]}px`;
    if (style.shadow) css.boxShadow = this.toBoxShadow(style.shadow);
    if (style.opacity !== undefined) css.opacity = String(style.opacity);

    return css;
  }

  /**
   * EventHandler → DOM 이벤트 핸들러
   */
  transformEvents(
    events: Record<string, EventHandler>,
    context: RenderContext
  ): Record<string, (e: Event) => void> {
    const handlers: Record<string, (e: Event) => void> = {};

    for (const [eventName, handler] of Object.entries(events)) {
      handlers[eventName] = (e: Event) => {
        e.preventDefault();

        switch (handler.action) {
          case 'filter':
            context.state?.set('filters', handler.payload);
            break;
          case 'sort':
            context.state?.set('sort', handler.payload);
            break;
          case 'select':
            context.state?.set('selected', handler.payload);
            break;
          case 'navigate':
            if (handler.payload?.url) {
              window.location.href = handler.payload.url as string;
            }
            break;
          default:
            console.log(`Custom action: ${handler.action}`, handler.payload);
        }
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
      date: 'time',
      image: 'img',
      input: 'input',
      select: 'select',
      checkbox: 'input',
      button: 'button',
      chart: 'div',
      table: 'table',
      'table-header': 'thead',
      'table-row': 'tr',
      'table-cell': 'td',
      list: 'ul',
      'list-item': 'li',
      card: 'article',
      'card-header': 'header',
      'card-body': 'div',
      'card-footer': 'footer',
    };
    return mapping[type] || 'div';
  }

  private applyLayoutStyles(element: HTMLElement, type: RenderNodeType): void {
    switch (type) {
      case 'row':
        element.style.display = 'flex';
        element.style.flexDirection = 'row';
        break;
      case 'column':
        element.style.display = 'flex';
        element.style.flexDirection = 'column';
        break;
      case 'grid':
        element.style.display = 'grid';
        break;
      case 'stack':
        element.style.display = 'flex';
        element.style.flexDirection = 'column';
        break;
      case 'card':
        element.style.display = 'flex';
        element.style.flexDirection = 'column';
        element.style.border = '1px solid #e5e7eb';
        break;
    }
  }

  private getLayoutCSS(type: RenderNodeType): string {
    switch (type) {
      case 'row':
        return 'display:flex;flex-direction:row;';
      case 'column':
        return 'display:flex;flex-direction:column;';
      case 'grid':
        return 'display:grid;';
      case 'stack':
        return 'display:flex;flex-direction:column;';
      case 'card':
        return 'display:flex;flex-direction:column;border:1px solid #e5e7eb;';
      default:
        return '';
    }
  }

  private applyProps(
    element: HTMLElement,
    node: RenderNode,
    context: RenderContext
  ): void {
    // 텍스트 콘텐츠
    const textContent = this.getTextContent(node, context);
    if (textContent && !node.children?.length) {
      element.textContent = textContent;
    }

    // 특수 속성
    if (node.type === 'image' && node.props.src) {
      (element as HTMLImageElement).src = node.props.src as string;
      (element as HTMLImageElement).alt = (node.props.alt as string) || '';
    }

    if (node.type === 'input') {
      (element as HTMLInputElement).type = (node.props.type as string) || 'text';
      if (node.props.placeholder) {
        (element as HTMLInputElement).placeholder = node.props.placeholder as string;
      }
    }

    if (node.type === 'checkbox') {
      (element as HTMLInputElement).type = 'checkbox';
    }

    if (node.type === 'date' && node.props.value) {
      element.setAttribute('datetime', node.props.value as string);
    }

    // grid columns
    if (node.type === 'grid' && node.props.columns) {
      element.style.gridTemplateColumns = `repeat(${node.props.columns}, 1fr)`;
    }
  }

  private getTextContent(node: RenderNode, context: RenderContext): string {
    switch (node.type) {
      case 'text':
        return String(node.props.value || '');
      case 'number':
        return context.formatters.number(node.props.value as number);
      case 'currency':
        return context.formatters.currency(
          node.props.value as number,
          (node.props.code as string) || 'KRW'
        );
      case 'date':
        return context.formatters.date(
          node.props.value as string,
          (node.props.format as string) || 'YYYY-MM-DD'
        );
      default:
        return '';
    }
  }

  private transformStyleToCSS(style: AbstractStyle, theme?: ThemeConfig): string {
    const styles = this.transformStyle(style, theme);
    return Object.entries(styles)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${this.camelToKebab(key)}:${value}`)
      .join(';');
  }

  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  private toSizeValue(value: number | string): string {
    if (typeof value === 'number') return `${value}px`;
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

  // ============================================
  // 간단한 차트 렌더러 (SVG 기반)
  // ============================================

  private renderBarChart(
    container: HTMLElement,
    spec: VisualizationSpec,
    data: unknown[],
    context: RenderContext
  ): void {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 400 300');

    const xField = spec.bindings.x?.field;
    const yField = spec.bindings.y?.field;

    if (!xField || !yField) return;

    const values = data.map((d) => (d as Record<string, number>)[yField]);
    const maxValue = Math.max(...values);
    const barWidth = 350 / data.length - 10;

    data.forEach((d, i) => {
      const item = d as Record<string, unknown>;
      const value = item[yField] as number;
      const height = (value / maxValue) * 250;

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', String(30 + i * (barWidth + 10)));
      rect.setAttribute('y', String(270 - height));
      rect.setAttribute('width', String(barWidth));
      rect.setAttribute('height', String(height));
      rect.setAttribute('fill', context.theme.colors.primary);

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', String(30 + i * (barWidth + 10) + barWidth / 2));
      label.setAttribute('y', '290');
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '10');
      label.textContent = String(item[xField]).slice(0, 6);

      svg.appendChild(rect);
      svg.appendChild(label);
    });

    container.appendChild(svg);
  }

  private renderLineChart(
    container: HTMLElement,
    spec: VisualizationSpec,
    data: unknown[],
    context: RenderContext
  ): void {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 400 300');

    const yField = spec.bindings.y?.field;
    if (!yField) return;

    const values = data.map((d) => (d as Record<string, number>)[yField]);
    const maxValue = Math.max(...values);

    const points = data.map((d, i) => {
      const value = (d as Record<string, number>)[yField];
      const x = 30 + (i / (data.length - 1)) * 350;
      const y = 270 - (value / maxValue) * 250;
      return `${x},${y}`;
    });

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    path.setAttribute('points', points.join(' '));
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', context.theme.colors.primary);
    path.setAttribute('stroke-width', '2');

    svg.appendChild(path);
    container.appendChild(svg);
  }

  private renderPieChart(
    container: HTMLElement,
    spec: VisualizationSpec,
    data: unknown[],
    context: RenderContext
  ): void {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 300 300');

    const valueField = spec.bindings.value?.field || spec.bindings.y?.field;
    if (!valueField) return;

    const values = data.map((d) => (d as Record<string, number>)[valueField]);
    const total = values.reduce((a, b) => a + b, 0);

    const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    let currentAngle = 0;

    values.forEach((value, i) => {
      const angle = (value / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      const path = this.createPieSlice(150, 150, 100, startAngle, endAngle);
      path.setAttribute('fill', colors[i % colors.length]);

      svg.appendChild(path);
      currentAngle = endAngle;
    });

    container.appendChild(svg);
  }

  private createPieSlice(
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number
  ): SVGPathElement {
    const start = this.polarToCartesian(cx, cy, r, endAngle);
    const end = this.polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    const d = [
      'M', cx, cy,
      'L', start.x, start.y,
      'A', r, r, 0, largeArcFlag, 0, end.x, end.y,
      'Z',
    ].join(' ');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    return path;
  }

  private polarToCartesian(
    cx: number,
    cy: number,
    r: number,
    angle: number
  ): { x: number; y: number } {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
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
export function createVanillaContext(
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
      date: (value) => new Date(value).toLocaleDateString('ko-KR'),
      number: (value, options) =>
        new Intl.NumberFormat('ko-KR', options).format(value),
    },
    data,
  };
}
