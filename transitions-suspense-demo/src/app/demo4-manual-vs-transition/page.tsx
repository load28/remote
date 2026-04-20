"use client";

import { Suspense, use, useEffect, useState, useTransition } from "react";
import { BackLink } from "@/components/BackLink";

// 같은 tab이면 같은 promise를 반환해야 use()가 무한 suspend되지 않는다.
const promiseCache = new Map<string, Promise<string[]>>();

function fetchItems(tab: string, delay = 1500): Promise<string[]> {
  const cached = promiseCache.get(tab);
  if (cached) return cached;
  const p = new Promise<string[]>((resolve) =>
    setTimeout(
      () =>
        resolve(
          Array.from({ length: 6 }, (_, i) => `${tab.toUpperCase()} #${i + 1}`),
        ),
      delay,
    ),
  );
  promiseCache.set(tab, p);
  return p;
}

// ManualVersion은 useEffect로 fetch하므로 매번 fresh한 결과가 필요하다.
function fetchItemsFresh(tab: string, delay = 1500): Promise<string[]> {
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve(
          Array.from({ length: 6 }, (_, i) => `${tab.toUpperCase()} #${i + 1}`),
        ),
      delay,
    ),
  );
}

// ---- A. 수동 isLoading 방식 (Suspense 없음) ----
function ManualVersion() {
  const [tab, setTab] = useState("posts");
  const [items, setItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchItemsFresh(tab).then((data) => {
      if (!cancelled) {
        setItems(data);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [tab]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        {["posts", "users", "comments"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded px-2.5 py-1 text-xs ${
              tab === t
                ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                : "bg-zinc-200 dark:bg-zinc-800"
            }`}
          >
            {t}
          </button>
        ))}
        {isLoading && <span className="text-xs text-amber-600">loading…</span>}
      </div>
      <div
        className="min-h-40 rounded border border-zinc-200 dark:border-zinc-800 p-2 transition-opacity duration-200"
        style={{ opacity: isLoading ? 0.5 : 1 }}
      >
        {items.length === 0 && !isLoading ? (
          <div className="text-xs text-zinc-500">데이터 없음</div>
        ) : (
          <ul className="space-y-1">
            {items.map((it) => (
              <li
                key={it}
                className="rounded bg-zinc-100 dark:bg-zinc-900 px-2 py-1 text-xs"
              >
                {it}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ---- B. Suspense + useTransition 방식 ----
function SuspenseList({ promise }: { promise: Promise<string[]> }) {
  const items = use(promise);
  return (
    <ul className="space-y-1">
      {items.map((it) => (
        <li
          key={it}
          className="rounded bg-zinc-100 dark:bg-zinc-900 px-2 py-1 text-xs"
        >
          {it}
        </li>
      ))}
    </ul>
  );
}

function TransitionVersion() {
  const [tab, setTab] = useState("posts");
  const [isPending, startTransition] = useTransition();
  const promise = fetchItems(tab);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        {["posts", "users", "comments"].map((t) => (
          <button
            key={t}
            onClick={() => startTransition(() => setTab(t))}
            className={`rounded px-2.5 py-1 text-xs ${
              tab === t
                ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                : "bg-zinc-200 dark:bg-zinc-800"
            }`}
          >
            {t}
          </button>
        ))}
        {isPending && <span className="text-xs text-amber-600">pending…</span>}
      </div>
      <div
        className="min-h-40 rounded border border-zinc-200 dark:border-zinc-800 p-2 transition-opacity duration-200"
        style={{ opacity: isPending ? 0.5 : 1 }}
      >
        <Suspense
          fallback={
            <div className="text-xs text-zinc-500">⏳ Suspense fallback…</div>
          }
        >
          <SuspenseList promise={promise} />
        </Suspense>
      </div>
    </div>
  );
}

export default function Demo4() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <BackLink />
      <header>
        <h1 className="text-2xl font-semibold">Demo 4 — 수동 vs Transition</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          왼쪽: 전통적인 <code>useEffect + isLoading</code> + opacity. <br />
          오른쪽: <code>Suspense + useTransition</code> + opacity. <br />
          UX는 비슷해 보이지만, 오른쪽은 새 탭의 데이터가 준비될 때까지
          이전 콘텐츠가 진짜로 살아 있습니다 (DOM에 그대로 존재).
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section>
          <h2 className="mb-2 text-sm font-medium">A. 수동 isLoading</h2>
          <ManualVersion />
        </section>
        <section>
          <h2 className="mb-2 text-sm font-medium">B. Suspense + Transition</h2>
          <TransitionVersion />
        </section>
      </div>

      <footer className="text-xs text-zinc-500 space-y-1">
        <p>
          <strong>관찰 포인트 1:</strong> 첫 진입 시 A는 빈 상자 + “loading…”,
          B는 Suspense fallback이 보입니다 (useTransition은 첫 마운트는
          못 가립니다).
        </p>
        <p>
          <strong>관찰 포인트 2:</strong> 탭 전환 시 양쪽 모두 이전 콘텐츠가
          dim된 채 유지됩니다. 차이는 <em>구현 코드의 양과 race condition
          처리</em>에 있습니다 (A는 cancelled 플래그 필요, B는 React가 처리).
        </p>
      </footer>
    </main>
  );
}
