/**
 * EventEmitter - 컴포넌트 간 통신을 위한 이벤트 시스템
 * Observer 패턴 구현
 */

type EventHandler<T = unknown> = (data: T) => void;

export class EventEmitter {
  private events: Map<string, Set<EventHandler>> = new Map();

  /**
   * 이벤트 리스너 등록
   */
  on<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler as EventHandler);

    // 구독 해제 함수 반환
    return () => this.off(event, handler);
  }

  /**
   * 일회성 이벤트 리스너 등록
   */
  once<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    const onceHandler: EventHandler<T> = (data) => {
      this.off(event, onceHandler);
      handler(data);
    };
    return this.on(event, onceHandler);
  }

  /**
   * 이벤트 리스너 제거
   */
  off<T = unknown>(event: string, handler: EventHandler<T>): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) {
        this.events.delete(event);
      }
    }
  }

  /**
   * 이벤트 발생
   */
  emit<T = unknown>(event: string, data?: T): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for "${event}":`, error);
        }
      });
    }
  }

  /**
   * 특정 이벤트의 모든 리스너 제거
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * 등록된 리스너 수 반환
   */
  listenerCount(event: string): number {
    return this.events.get(event)?.size ?? 0;
  }
}

// 글로벌 이벤트 버스 (싱글톤)
export const globalEventBus = new EventEmitter();
