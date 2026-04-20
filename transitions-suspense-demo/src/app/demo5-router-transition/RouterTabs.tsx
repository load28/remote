"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

const tabs = [
  { slug: "home", label: "Home (정적)" },
  { slug: "slow-a", label: "Slow A (1.5s)" },
  { slug: "slow-b", label: "Slow B (1.5s)" },
];

export function RouterTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const navigateWithTransition = (slug: string) => {
    startTransition(() => {
      router.push(`/demo5-router-transition/${slug}`);
    });
  };

  const navigateRaw = (slug: string) => {
    router.push(`/demo5-router-transition/${slug}`);
  };

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1 text-xs text-zinc-500">
          A. <code>startTransition(() =&gt; router.push(...))</code>
          {isPending && (
            <span className="ml-2 text-amber-600">→ isPending=true</span>
          )}
        </div>
        <div className="flex gap-2">
          {tabs.map((t) => {
            const active = pathname?.endsWith("/" + t.slug);
            return (
              <button
                key={t.slug}
                onClick={() => navigateWithTransition(t.slug)}
                className={`rounded px-3 py-1.5 text-sm ${
                  active
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                    : "bg-zinc-200 dark:bg-zinc-800"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-1 text-xs text-zinc-500">
          B. raw <code>router.push(...)</code> (isPending 추적 불가)
        </div>
        <div className="flex gap-2">
          {tabs.map((t) => {
            const active = pathname?.endsWith("/" + t.slug);
            return (
              <button
                key={t.slug}
                onClick={() => navigateRaw(t.slug)}
                className={`rounded px-3 py-1.5 text-sm ${
                  active
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                    : "bg-zinc-200 dark:bg-zinc-800"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
