/**
 * Router - SPA 라우팅 시스템
 * History API를 사용한 클라이언트 사이드 라우팅
 */

import { Component, ComponentProps } from './Component';
import { EventEmitter } from './EventEmitter';

export interface RouteParams {
  [key: string]: string;
}

export interface RouteQuery {
  [key: string]: string;
}

export interface RouteMatch {
  path: string;
  params: RouteParams;
  query: RouteQuery;
}

export interface Route<P extends ComponentProps = ComponentProps> {
  path: string;
  component: new (props: P) => Component<P>;
  props?: Partial<P>;
  guards?: Array<(route: RouteMatch) => boolean | Promise<boolean>>;
  children?: Route[];
}

export class Router extends EventEmitter {
  private routes: Route[] = [];
  private container: HTMLElement | null = null;
  private currentComponent: Component | null = null;
  private basePath: string = '';
  private notFoundComponent: (new () => Component) | null = null;

  constructor(routes: Route[], basePath: string = '') {
    super();
    this.routes = routes;
    this.basePath = basePath;
  }

  /**
   * 라우터 초기화 및 시작
   */
  start(container: HTMLElement | string): void {
    this.container =
      typeof container === 'string'
        ? document.querySelector(container)
        : container;

    if (!this.container) {
      throw new Error(`Router container not found: ${container}`);
    }

    // 브라우저 뒤로가기/앞으로가기 처리
    window.addEventListener('popstate', () => {
      this.handleRouteChange();
    });

    // 링크 클릭 인터셉트
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[data-link]');

      if (anchor) {
        e.preventDefault();
        const href = anchor.getAttribute('href');
        if (href) {
          this.navigate(href);
        }
      }
    });

    // 초기 라우트 처리
    this.handleRouteChange();
  }

  /**
   * 404 컴포넌트 설정
   */
  setNotFoundComponent(component: new () => Component): void {
    this.notFoundComponent = component;
  }

  /**
   * 프로그래매틱 네비게이션
   */
  navigate(path: string, replace: boolean = false): void {
    const fullPath = this.basePath + path;

    if (replace) {
      history.replaceState(null, '', fullPath);
    } else {
      history.pushState(null, '', fullPath);
    }

    this.handleRouteChange();
  }

  /**
   * 뒤로가기
   */
  back(): void {
    history.back();
  }

  /**
   * 앞으로가기
   */
  forward(): void {
    history.forward();
  }

  /**
   * 현재 경로 반환
   */
  getCurrentPath(): string {
    return window.location.pathname.replace(this.basePath, '') || '/';
  }

  /**
   * 현재 쿼리 파라미터 반환
   */
  getQuery(): RouteQuery {
    const params = new URLSearchParams(window.location.search);
    const query: RouteQuery = {};
    params.forEach((value, key) => {
      query[key] = value;
    });
    return query;
  }

  /**
   * 라우트 변경 처리
   */
  private async handleRouteChange(): Promise<void> {
    const path = this.getCurrentPath();
    const query = this.getQuery();

    // 매칭되는 라우트 찾기
    const matchResult = this.findMatchingRoute(path, this.routes);

    if (!matchResult) {
      this.emit('notFound', { path, query });
      this.renderNotFound();
      return;
    }

    const { route, params } = matchResult;
    const routeMatch: RouteMatch = { path, params, query };

    // 가드 실행
    if (route.guards) {
      for (const guard of route.guards) {
        const canActivate = await guard(routeMatch);
        if (!canActivate) {
          this.emit('guardRejected', routeMatch);
          return;
        }
      }
    }

    this.emit('beforeChange', routeMatch);

    // 이전 컴포넌트 언마운트
    if (this.currentComponent) {
      this.currentComponent.unmount();
    }

    // 새 컴포넌트 마운트
    const ComponentClass = route.component;
    const props = {
      ...route.props,
      $route: routeMatch
    } as ComponentProps;

    this.currentComponent = new ComponentClass(props as never);
    this.currentComponent.mount(this.container!);

    this.emit('afterChange', routeMatch);
  }

  /**
   * 매칭되는 라우트 찾기
   */
  private findMatchingRoute(
    path: string,
    routes: Route[],
    parentPath: string = ''
  ): { route: Route; params: RouteParams } | null {
    for (const route of routes) {
      const fullPath = parentPath + route.path;
      const params = this.matchPath(path, fullPath);

      if (params !== null) {
        // 자식 라우트 확인
        if (route.children && route.children.length > 0) {
          const childMatch = this.findMatchingRoute(path, route.children, fullPath);
          if (childMatch) {
            return childMatch;
          }
        }

        return { route, params };
      }
    }

    return null;
  }

  /**
   * 경로 매칭 (동적 파라미터 지원)
   */
  private matchPath(path: string, pattern: string): RouteParams | null {
    // 정규식 패턴 생성 (:param 형식 지원)
    const paramNames: string[] = [];
    const regexPattern = pattern
      .replace(/\//g, '\\/')
      .replace(/:([^/]+)/g, (_, paramName) => {
        paramNames.push(paramName);
        return '([^/]+)';
      });

    // 정확한 매칭을 위해 ^ 와 $ 추가
    const regex = new RegExp(`^${regexPattern}$`);
    const match = path.match(regex);

    if (!match) {
      return null;
    }

    // 파라미터 추출
    const params: RouteParams = {};
    paramNames.forEach((name, index) => {
      params[name] = match[index + 1];
    });

    return params;
  }

  /**
   * 404 페이지 렌더링
   */
  private renderNotFound(): void {
    if (this.currentComponent) {
      this.currentComponent.unmount();
      this.currentComponent = null;
    }

    if (this.notFoundComponent && this.container) {
      this.currentComponent = new this.notFoundComponent();
      this.currentComponent.mount(this.container);
    } else if (this.container) {
      this.container.innerHTML = '<h1>404 - Page Not Found</h1>';
    }
  }

  /**
   * 동적으로 라우트 추가
   */
  addRoute(route: Route): void {
    this.routes.push(route);
  }

  /**
   * 라우트 제거
   */
  removeRoute(path: string): void {
    this.routes = this.routes.filter(route => route.path !== path);
  }
}

/**
 * 라우터 링크 생성 헬퍼
 */
export function createLink(path: string, text: string, className?: string): string {
  return `<a href="${path}" data-link class="${className ?? ''}">${text}</a>`;
}
