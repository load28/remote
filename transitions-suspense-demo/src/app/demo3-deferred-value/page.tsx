"use client";

import {
  Suspense,
  use,
  useDeferredValue,
  useEffect,
  useState,
} from "react";
import { BackLink } from "@/components/BackLink";

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

// 같은 query면 같은 promise 반환 (use()를 위한 캐시)
const cache = new Map<string, Promise<string[]>>();
let networkCallCount = 0;
const listeners = new Set<() => void>();

function searchAPI(query: string): Promise<string[]> {
  const key = query.toLowerCase().trim();
  const hit = cache.get(key);
  if (hit) return hit;

  networkCallCount++;
  listeners.forEach((l) => l());

  const p = new Promise<string[]>((resolve) =>
    setTimeout(() => {
      const res = key
        ? ALL.filter((it) => it.toLowerCase().includes(key))
        : ALL;
      resolve(res);
    }, 1000), // 가짜 네트워크 지연
  );
  cache.set(key, p);
  return p;
}

function useNetworkCount() {
  const [n, setN] = useState(networkCallCount);
  useEffect(() => {
    const fn = () => setN(networkCallCount);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return n;
}

function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function Results({ query }: { query: string }) {
  const data = use(searchAPI(query));
  return (
    <ul className="space-y-1">
      {data.length === 0 ? (
        <li className="text-sm text-zinc-500">결과 없음</li>
      ) : (
        data.map((it) => (
          <li
            key={it}
            className="rounded bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 text-sm"
          >
            {it}
          </li>
        ))
      )}
    </ul>
  );
}

export default function Demo3() {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 300);
  const deferred = useDeferredValue(debounced);
  const networkCalls = useNetworkCount();

  const debouncePending = query !== debounced;
  const deferredStale = debounced !== deferred;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <BackLink />
      <header>
        <h1 className="text-2xl font-semibold">
          Demo 3 — 검색: debounce + useDeferredValue + Suspense
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          입력은 즉시 반영(<code>query</code>) → 300ms 안정 후 요청
          (<code>debounced</code>) → React가 transition lane으로 적용
          (<code>deferred</code>) → Suspense가 새 결과 도착 전까지 이전 결과
          유지.
        </p>
      </header>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="React, Vue, Postgres ... 검색해보세요"
        className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
      />

      <div className="rounded border border-zinc-200 dark:border-zinc-800 p-3 text-xs space-y-1 font-mono">
        <div>
          query (즉시): <span className="text-blue-600">{query || "∅"}</span>
        </div>
        <div>
          debounced (300ms 후):{" "}
          <span className="text-blue-600">{debounced || "∅"}</span>{" "}
          {debouncePending && (
            <span className="text-amber-600">⏳ debounce 대기</span>
          )}
        </div>
        <div>
          deferred (transition):{" "}
          <span className="text-blue-600">{deferred || "∅"}</span>{" "}
          {deferredStale && (
            <span className="text-amber-600">⏳ 새 결과 fetching</span>
          )}
        </div>
        <div className="pt-1 text-zinc-500">
          누적 네트워크 호출: <strong>{networkCalls}</strong>회 (캐시 hit은
          미카운트)
        </div>
      </div>

      <section
        className="min-h-72 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 transition-opacity duration-200"
        style={{ opacity: deferredStale ? 0.5 : 1 }}
      >
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-48 text-zinc-500">
              ⏳ 첫 검색 중…
            </div>
          }
        >
          <Results query={deferred} />
        </Suspense>
      </section>

      <footer className="text-xs text-zinc-500 space-y-2 leading-relaxed">
        <p>
          <strong>실험 1 (debounce 효과).</strong> &quot;react query&quot;를
          빠르게 타이핑하세요. 글자마다가 아니라{" "}
          <strong>최종 안정 값에 대해서만</strong> 네트워크 호출이 발생합니다
          (호출 카운터로 확인).
        </p>
        <p>
          <strong>실험 2 (이전 결과 유지).</strong> 한 번 검색이 끝난 뒤 다른
          단어로 바꿔보세요. 새 결과가 도착하기 전까지 이전 리스트가 dim된
          채 유지되고, fallback Spinner는 보이지 않습니다.
        </p>
        <p>
          <strong>실험 3 (첫 진입엔 fallback).</strong> 페이지를 새로고침하면
          보여줄 이전 결과가 없으므로 첫 1초 동안 Spinner가 정상적으로
          나타납니다.
        </p>
        <p>
          <strong>실험 4 (캐시 hit).</strong> 같은 단어를 다시 검색하면
          네트워크 호출 없이 즉시 결과가 표시됩니다 (cache.has 시 같은 promise
          반환).
        </p>
      </footer>
    </main>
  );
}
