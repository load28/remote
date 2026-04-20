import Link from "next/link";

const demos = [
  {
    href: "/demo1-no-transition",
    title: "Demo 1 — Suspense without Transition",
    desc: "탭을 바꾸면 fallback이 깜빡인다. (이전 화면 사라짐 → Spinner → 새 화면)",
  },
  {
    href: "/demo2-with-transition",
    title: "Demo 2 — Suspense with Transition",
    desc: "탭을 바꿔도 이전 화면이 유지된 채 dim → 새 화면. fallback이 보이지 않는다.",
  },
  {
    href: "/demo3-deferred-value",
    title: "Demo 3 — 수동 (React Query 없이) + AbortController",
    desc: "useDebounce + useDeferredValue + Suspense + promise 캐시 + 수동 abort로 stale 요청 취소.",
  },
  {
    href: "/demo4-manual-vs-transition",
    title: "Demo 4 — 수동 isLoading vs useTransition",
    desc: "Suspense 없는 환경에서의 두 방식 비교. 결과 UX는 비슷한가?",
  },
  {
    href: "/demo5-router-transition/home",
    title: "Demo 5 — router.push + useTransition isPending",
    desc: "동적 라우트 네비게이션의 진행 상태를 isPending으로 추적.",
  },
  {
    href: "/demo6-rq-pattern-a",
    title: "Demo 6 — 검색 패턴 A: useQuery + keepPreviousData",
    desc: "React Query가 데이터 레이어에서 이전 결과 유지. Suspense 없음. signal로 자동 abort.",
  },
  {
    href: "/demo7-rq-pattern-b",
    title: "Demo 7 — 검색 패턴 B: useSuspenseQuery + useDeferredValue",
    desc: "Suspense 기반. useDeferredValue가 렌더 레이어에서 이전 화면 유지. signal로 자동 abort.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          React Transitions × Suspense — 검증 데모
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Next.js 16 + React 19. 각 데모를 직접 클릭해보며 차이를 확인하세요.
        </p>
        <p className="rounded border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
          🛠 모든 fetch는 <strong>MSW(Mock Service Worker)</strong>로 가로채는
          진짜 HTTP 요청입니다. 브라우저 DevTools → Network 탭을 열어 두면
          요청 발사와 <code>cancelled</code> 상태를 직접 볼 수 있습니다.
        </p>
      </header>
      <ul className="flex flex-col gap-3">
        {demos.map((d) => (
          <li key={d.href}>
            <Link
              href={d.href}
              className="block rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
            >
              <div className="font-medium">{d.title}</div>
              <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {d.desc}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
