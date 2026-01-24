/**
 * Core - OOP 컴포넌트 라이브러리의 핵심 모듈
 */

export { Component, createComponent } from './Component';
export type { ComponentProps, ComponentChild } from './Component';

export { EventEmitter, globalEventBus } from './EventEmitter';

export { State, Store } from './State';
export type { Action, Reducer } from './State';

export { Router, createLink } from './Router';
export type { Route, RouteParams, RouteQuery, RouteMatch } from './Router';
