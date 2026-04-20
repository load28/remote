"use client";

import { memo, useDeferredValue, useMemo, useState } from "react";
import { BackLink } from "@/components/BackLink";

const ITEMS = Array.from({ length: 8000 }, (_, i) => `Item ${i + 1}`);

function busyFilter(items: string[], q: string): string[] {
  // 의도적으로 느린 필터: q마다 ~80~120ms 소비
  const out: string[] = [];
  for (const it of items) {
    // 인공적인 부하
    let acc = 0;
    for (let k = 0; k < 200; k++) acc += Math.sin(k) * Math.cos(k);
    if (acc !== 12345 && it.toLowerCase().includes(q.toLowerCase())) {
      out.push(it);
    }
  }
  return out;
}

const HeavyList = memo(function HeavyList({ q }: { q: string }) {
  const filtered = useMemo(() => busyFilter(ITEMS, q), [q]);
  return (
    <div className="max-h-72 overflow-auto rounded border border-zinc-200 dark:border-zinc-800 p-2 text-sm">
      <div className="mb-2 text-xs text-zinc-500">{filtered.length}개 결과</div>
      <ul className="space-y-0.5">
        {filtered.slice(0, 200).map((it) => (
          <li key={it} className="rounded px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-900">
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
});

export default function Demo3() {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const isStale = query !== deferred;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <BackLink />
      <header>
        <h1 className="text-2xl font-semibold">Demo 3 — useDeferredValue</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          데이터 fetch <em>없이</em> CPU만 소비하는 무거운 동기 렌더입니다.
          입력은 즉시 반영되고(<code>query</code>), 리스트는 <code>deferred</code>
          기준으로 백그라운드에서 렌더됩니다.
        </p>
      </header>

      <div className="space-y-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="아무 글자나 빠르게 타이핑해 보세요"
          className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
        />
        <div className="text-xs text-zinc-500">
          query: <code>{query || "(empty)"}</code>
          <span className="mx-2">|</span>
          deferred: <code>{deferred || "(empty)"}</code>
          {isStale && <span className="ml-2 text-amber-600">stale (재계산 중)</span>}
        </div>
      </div>

      <section
        className="transition-opacity duration-200"
        style={{ opacity: isStale ? 0.5 : 1 }}
      >
        <HeavyList q={deferred} />
      </section>

      <footer className="text-xs text-zinc-500 space-y-1">
        <p>
          <strong>관찰 포인트:</strong> 빠르게 타이핑해도 입력창이 끊기지 않고,
          리스트는 약간 늦게(stale) 따라옵니다. <code>useDeferredValue</code>
          없이 <code>HeavyList q={"{query}"}</code>로 바꾸면 입력이 버벅입니다.
        </p>
      </footer>
    </main>
  );
}
