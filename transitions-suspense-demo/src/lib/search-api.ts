let networkCallCount = 0;
let abortedCount = 0;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function subscribeMetrics(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getMetrics() {
  return { networkCallCount, abortedCount };
}

// MSW handler가 잡는 실제 fetch. AbortSignal로 진짜 취소 발생 → DevTools에서
// 'cancelled' 상태로 보임.
export async function searchAPI(
  query: string,
  signal?: AbortSignal,
): Promise<string[]> {
  networkCallCount++;
  notify();
  try {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(query)}`,
      { signal },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as string[];
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      abortedCount++;
      notify();
    }
    throw err;
  }
}
