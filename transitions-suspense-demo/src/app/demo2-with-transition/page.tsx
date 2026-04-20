"use client";

import { Suspense, use, useState, useTransition } from "react";
import { fetchTabContent } from "@/lib/fake-data";
import { BackLink } from "@/components/BackLink";

function TabContent({ promise }: { promise: Promise<string[]> }) {
  const items = use(promise);
  return (
    <ul className="space-y-1">
      {items.map((it) => (
        <li
          key={it}
          className="rounded bg-zinc-100 dark:bg-zinc-900 px-3 py-2 text-sm"
        >
          {it}
        </li>
      ))}
    </ul>
  );
}

export default function Demo2() {
  const [tab, setTab] = useState("posts");
  const [isPending, startTransition] = useTransition();
  const promise = fetchTabContent(tab, 1500);

  const selectTab = (next: string) => {
    startTransition(() => setTab(next));
  };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <BackLink />
      <header>
        <h1 className="text-2xl font-semibold">Demo 2 — Suspense + Transition</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          탭을 클릭하면 <strong>이전 콘텐츠가 그대로 남은 채 dim</strong>되고,
          새 데이터가 준비되면 자연스럽게 교체됩니다. <code>fallback</code>은
          첫 진입 시에만 보입니다.
        </p>
      </header>

      <nav className="flex items-center gap-2">
        {["posts", "users", "comments"].map((t) => (
          <button
            key={t}
            onClick={() => selectTab(t)}
            className={`rounded px-3 py-1.5 text-sm ${
              tab === t
                ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                : "bg-zinc-200 dark:bg-zinc-800"
            }`}
          >
            {t}
          </button>
        ))}
        {isPending && (
          <span className="ml-2 text-xs text-amber-600">전환 중…</span>
        )}
      </nav>

      <section
        className="min-h-64 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 transition-opacity duration-200"
        style={{ opacity: isPending ? 0.5 : 1 }}
      >
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-48 text-zinc-500">
              ⏳ Loading {tab}…
            </div>
          }
        >
          <TabContent promise={promise} />
        </Suspense>
      </section>

      <footer className="text-xs text-zinc-500 space-y-1">
        <p>
          <strong>관찰 포인트 1:</strong> 탭 전환 시 fallback이 보이지 않고
          이전 리스트가 dim 처리된 채 유지됩니다.
        </p>
        <p>
          <strong>관찰 포인트 2:</strong> 첫 진입 시(아직 보여줄 이전 콘텐츠가
          없을 때)는 fallback이 정상적으로 보입니다.
        </p>
      </footer>
    </main>
  );
}
