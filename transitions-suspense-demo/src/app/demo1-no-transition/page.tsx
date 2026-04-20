"use client";

import { Suspense, use, useState } from "react";
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

export default function Demo1() {
  const [tab, setTab] = useState("posts");
  const promise = fetchTabContent(tab, 1500);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <BackLink />
      <header>
        <h1 className="text-2xl font-semibold">Demo 1 — Suspense 단독</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          탭을 클릭하면 기존 콘텐츠가 즉시 사라지고 <code>fallback</code>이
          나타납니다. <strong>화면이 깜빡임</strong>.
        </p>
      </header>

      <nav className="flex gap-2">
        {["posts", "users", "comments"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded px-3 py-1.5 text-sm ${
              tab === t
                ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                : "bg-zinc-200 dark:bg-zinc-800"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      <section className="min-h-64 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
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

      <footer className="text-xs text-zinc-500">
        <strong>관찰 포인트:</strong> 탭을 바꿀 때마다 이전 리스트가 사라지고
        “Loading…” fallback이 1.5초간 보입니다 → fallback 깜빡임 현상.
      </footer>
    </main>
  );
}
