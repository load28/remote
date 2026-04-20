const cache = new Map<string, Promise<string[]>>();

export function fetchTabContent(tab: string, delayMs = 1500): Promise<string[]> {
  const key = `${tab}:${delayMs}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const p = new Promise<string[]>((resolve) => {
    setTimeout(() => {
      const items = Array.from(
        { length: 8 },
        (_, i) => `${tab.toUpperCase()} 항목 #${i + 1}`,
      );
      resolve(items);
    }, delayMs);
  });
  cache.set(key, p);
  return p;
}

export function clearTabCache() {
  cache.clear();
}
