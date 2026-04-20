"use client";

import { Suspense, use, useDeferredValue, useState } from "react";
import { BackLink } from "@/components/BackLink";
import { searchAPI } from "@/lib/search-api";
import { useDebounce } from "@/lib/use-debounce";
import { useNetworkMetrics } from "@/lib/use-network-metrics";

// use()를 위한 promise 캐시 (같은 query면 같은 promise).
const promiseCache = new Map<string, Promise<string[]>>();

// 진행 중인 요청의 controller (한 번에 하나만 in-flight).
let currentController: { key: string; ctrl: AbortController } | null = null;

function getSearchPromise(query: string): Promise<string[]> {
  const key = query.toLowerCase().trim();

  // 이미 resolve된 결과면 즉시 반환.
  const hit = promiseCache.get(key);
  if (hit) return hit;

  // 다른 키의 in-flight 요청이 있으면 취소.
  if (currentController && currentController.key !== key) {
    currentController.ctrl.abort();
  }

  const controller = new AbortController();
  currentController = { key, ctrl: controller };

  const p = searchAPI(query, controller.signal);

  // 성공/실패 이후 정리. abort면 캐시 제거해 재요청 가능하도록.
  p.then(
    () => {
      if (currentController?.ctrl === controller) currentController = null;
    },
    (err: unknown) => {
      if (err instanceof DOMException && err.name === "AbortError") {
        promiseCache.delete(key);
      }
      if (currentController?.ctrl === controller) currentController = null;
    },
  );

  promiseCache.set(key, p);
  return p;
}

function Results({ query }: { query: string }) {
  const data = use(getSearchPromise(query));
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
  const metrics = useNetworkMetrics();

  const debouncePending = query !== debounced;
  const deferredStale = debounced !== deferred;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <BackLink />
      <header>
        <h1 className="text-2xl font-semibold">
          Demo 3 — 수동 (React Query 없이) + AbortController
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          <code>useDebounce</code> + <code>useDeferredValue</code> +{" "}
          <code>Suspense</code> + 직접 만든 promise 캐시 +{" "}
          <strong>수동 AbortController</strong>로 stale 요청 취소. React Query
          없이도 race condition을 막음.
        </p>
      </header>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="React, Vue, Postgres ..."
        className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
      />

      <div className="rounded border border-zinc-200 dark:border-zinc-800 p-3 text-xs space-y-1 font-mono">
        <div>
          query: <span className="text-blue-600">{query || "∅"}</span>
        </div>
        <div>
          debounced: <span className="text-blue-600">{debounced || "∅"}</span>{" "}
          {debouncePending && (
            <span className="text-amber-600">⏳ debounce 대기</span>
          )}
        </div>
        <div>
          deferred: <span className="text-blue-600">{deferred || "∅"}</span>{" "}
          {deferredStale && (
            <span className="text-amber-600">⏳ fetching</span>
          )}
        </div>
        <div className="pt-1 text-zinc-500">
          네트워크 호출: <strong>{metrics.networkCallCount}</strong>회 / 취소:{" "}
          <strong>{metrics.abortedCount}</strong>회
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

      <footer className="text-xs text-zinc-500 leading-relaxed space-y-2">
        <p>
          <strong>관찰 1 (abort 작동).</strong> 디바운스(300ms)보다 빠르게
          검색어를 바꾸지는 않지만, debounce 경과 후 새 요청이 나가기 직전
          이전 in-flight 요청이 있으면 취소 카운터가 올라갑니다.
        </p>
        <p>
          <strong>관찰 2 (race 해결).</strong> 이전 요청이 늦게 돌아와 최신
          결과를 덮어쓰는 race condition이 abort로 차단됩니다. (Demo 6/7의
          자동 signal과 같은 역할)
        </p>
        <p>
          <strong>구현 메모.</strong> abort로 reject된 promise는 캐시에서
          제거되므로 같은 쿼리로 재진입 시 새 요청이 나갑니다. resolve된
          후의 abort는 <code>settled</code> 플래그로 무시됩니다.
        </p>
      </footer>
    </main>
  );
}
