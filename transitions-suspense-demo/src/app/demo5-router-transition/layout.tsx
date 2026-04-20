import { BackLink } from "@/components/BackLink";
import { RouterTabs } from "./RouterTabs";

export default function Demo5Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <BackLink />
      <header>
        <h1 className="text-2xl font-semibold">
          Demo 5 — router.push + useTransition
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          탭이 라우트로 분리되어 있습니다. 두 가지 버튼으로 같은 곳을
          이동시킵니다 — 하나는 <code>useTransition</code>으로 감쌌고, 다른
          하나는 raw <code>router.push</code>입니다. <strong>isPending</strong>
          만 차이가 납니다.
        </p>
      </header>

      <RouterTabs />

      <section className="min-h-48 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
        {children}
      </section>
    </main>
  );
}
