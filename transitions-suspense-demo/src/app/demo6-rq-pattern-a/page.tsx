"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BackLink } from "@/components/BackLink";
import { searchAPI } from "@/lib/search-api";
import { useDebounce } from "@/lib/use-debounce";
import { useNetworkMetrics } from "@/lib/use-network-metrics";

export default function Demo6() {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 300);
  const metrics = useNetworkMetrics();

  const { data, isPlaceholderData, isFetching, isLoading } = useQuery({
    queryKey: ["search", debounced],
    queryFn: ({ signal }) => searchAPI(debounced, signal),
    placeholderData: keepPreviousData, // ← 핵심
  });

  const debouncePending = query !== debounced;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <BackLink />
      <header>
        <h1 className="text-2xl font-semibold">
          Demo 6 — 패턴 A: useQuery + keepPreviousData
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          React Query가 이전 데이터를 유지하며 새 데이터로 swap. Suspense 없이
          데이터 레이어에서 모든 것 처리. <code>signal</code>로 stale 요청
          자동 abort.
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
          isLoading: <code>{String(isLoading)}</code>
          {" / "}isFetching: <code>{String(isFetching)}</code>
          {" / "}isPlaceholderData:{" "}
          <code>{String(isPlaceholderData)}</code>
        </div>
        <div className="pt-1 text-zinc-500">
          네트워크 호출: <strong>{metrics.networkCallCount}</strong>회 / 취소:{" "}
          <strong>{metrics.abortedCount}</strong>회
        </div>
      </div>

      <section
        className="min-h-72 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 transition-opacity duration-200"
        style={{ opacity: isPlaceholderData ? 0.5 : 1 }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-zinc-500">
            ⏳ 첫 검색 중…
          </div>
        ) : (
          <ul className="space-y-1">
            {data!.length === 0 ? (
              <li className="text-sm text-zinc-500">결과 없음</li>
            ) : (
              data!.map((it) => (
                <li
                  key={it}
                  className="rounded bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 text-sm"
                >
                  {it}
                </li>
              ))
            )}
          </ul>
        )}
      </section>

      <footer className="text-xs text-zinc-500 leading-relaxed space-y-2">
        <p>
          <strong>관찰 1.</strong> 빠르게 검색어를 바꿔보세요. 이전 결과를
          그대로 유지(<code>isPlaceholderData=true</code>)하면서 새 결과를
          가져옵니다. fallback 깜빡임 없음.
        </p>
        <p>
          <strong>관찰 2.</strong> queryKey가 바뀌면 React Query가 이전
          요청을 자동으로 abort. 취소 카운터가 올라갑니다.
        </p>
        <p>
          <strong>관찰 3.</strong> 첫 진입에는 placeholder가 없으므로{" "}
          <code>isLoading=true</code>로 fallback이 표시됩니다.
        </p>
      </footer>
    </main>
  );
}
