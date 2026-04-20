"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useDeferredValue, useState } from "react";
import { BackLink } from "@/components/BackLink";
import { searchAPI } from "@/lib/search-api";
import { useDebounce } from "@/lib/use-debounce";
import { useNetworkMetrics } from "@/lib/use-network-metrics";

function Results({ query }: { query: string }) {
  const { data } = useSuspenseQuery({
    queryKey: ["search", query],
    queryFn: ({ signal }) => searchAPI(query, signal),
  });
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

export default function Demo7() {
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
          Demo 7 — 패턴 B: useSuspenseQuery + useDeferredValue
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Suspense 기반. <code>useSuspenseQuery</code>는 placeholderData를
          지원하지 않으므로 <code>useDeferredValue</code>가 "이전 화면 유지"를
          담당. <code>signal</code>로 자동 abort.
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
          <strong>관찰 1.</strong> 빠르게 검색어를 바꾸면 이전 화면이 dim된 채
          유지됩니다 (useDeferredValue가 transition lane으로 처리 → Suspense
          fallback 억제).
        </p>
        <p>
          <strong>관찰 2.</strong> queryKey가 바뀌면 React Query가 이전 요청을
          자동 abort.
        </p>
        <p>
          <strong>관찰 3.</strong> Demo 6과 비교: 결과적 UX는 같지만,{" "}
          <em>이전 화면 유지를 데이터 레이어가 하느냐(A) 렌더 레이어가
          하느냐(B)</em>의 차이.
        </p>
        <p>
          <strong>관찰 4 (<code>gcTime: 0</code>).</strong> 관찰자 0이 되는
          즉시 캐시 제거 → 재검색 시 캐시 hit 없음. 단,{" "}
          <code>useDeferredValue</code>가 잡은 이전 렌더는 React가 따로
          보관하므로 화면 유지 효과는 그대로.
        </p>
      </footer>
    </main>
  );
}
