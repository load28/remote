// Demo 1, 2 — 탭 콘텐츠. MSW handler가 잡는 실제 fetch.
// use()를 위한 promise 캐시 (같은 tab이면 같은 promise 반환).
const cache = new Map<string, Promise<string[]>>();

export function fetchTabContent(tab: string, delayMs = 1500): Promise<string[]> {
  const key = `${tab}:${delayMs}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const p = fetch(`/api/tabs/${encodeURIComponent(tab)}?delay=${delayMs}`).then(
    (r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<string[]>;
    },
  );
  cache.set(key, p);
  return p;
}

export function clearTabCache() {
  cache.clear();
}
