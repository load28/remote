import { delay, http, HttpResponse } from "msw";

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

export const handlers = [
  // Demo 3, 6, 7 — 검색 API
  http.get("/api/search", async ({ request }) => {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").toLowerCase().trim();
    const delayMs = Number(url.searchParams.get("delay") ?? 1000);
    await delay(delayMs);
    const results = q ? ALL.filter((it) => it.toLowerCase().includes(q)) : ALL;
    return HttpResponse.json(results);
  }),

  // Demo 1, 2 — 탭 콘텐츠 API
  http.get("/api/tabs/:tab", async ({ params, request }) => {
    const tab = String(params.tab);
    const url = new URL(request.url);
    const delayMs = Number(url.searchParams.get("delay") ?? 1500);
    await delay(delayMs);
    const items = Array.from(
      { length: 8 },
      (_, i) => `${tab.toUpperCase()} 항목 #${i + 1}`,
    );
    return HttpResponse.json(items);
  }),

  // Demo 4 — 간단한 항목 API
  http.get("/api/items/:tab", async ({ params }) => {
    const tab = String(params.tab);
    await delay(1500);
    const items = Array.from(
      { length: 6 },
      (_, i) => `${tab.toUpperCase()} #${i + 1}`,
    );
    return HttpResponse.json(items);
  }),
];
