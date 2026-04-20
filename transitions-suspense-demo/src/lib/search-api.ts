const ALL = [
  "React", "React Router", "React Query", "React Native", "React Hook Form",
  "Next.js", "Next Auth", "Nuxt", "Node.js", "Nest.js",
  "Vue", "Vue Router", "Vuex", "Vuetify", "Vite",
  "Angular", "Angular CLI", "AngularJS",
  "Svelte", "SvelteKit", "Solid", "SolidStart", "Astro",
  "TypeScript", "JavaScript", "Python", "Ruby", "Rust", "Go",
  "Tailwind", "shadcn/ui", "Radix UI", "Headless UI",
  "Zustand", "Jotai", "Redux", "MobX", "Recoil",
  "Prisma", "Drizzle", "TypeORM", "Sequelize",
  "Postgres", "MySQL", "MongoDB", "Redis", "SQLite",
];

let networkCallCount = 0;
let abortedCount = 0;
const listeners = new Set<() => void>();

export function subscribeMetrics(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getMetrics() {
  return { networkCallCount, abortedCount };
}

export function resetMetrics() {
  networkCallCount = 0;
  abortedCount = 0;
  listeners.forEach((l) => l());
}

// Abort 가능한 가짜 검색 API.
export function searchAPI(query: string, signal?: AbortSignal): Promise<string[]> {
  networkCallCount++;
  listeners.forEach((l) => l());

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      abortedCount++;
      listeners.forEach((l) => l());
      return reject(new DOMException("Aborted", "AbortError"));
    }

    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      const key = query.toLowerCase().trim();
      const res = key ? ALL.filter((it) => it.toLowerCase().includes(key)) : ALL;
      resolve(res);
    }, 1000);

    signal?.addEventListener("abort", () => {
      if (settled) return; // 이미 resolve됐으면 abort 무시
      settled = true;
      clearTimeout(timeout);
      abortedCount++;
      listeners.forEach((l) => l());
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}
