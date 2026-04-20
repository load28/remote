async function slowFetch(label: string) {
  await new Promise((r) => setTimeout(r, 1500));
  return {
    label,
    items: Array.from({ length: 5 }, (_, i) => `${label} 아이템 ${i + 1}`),
  };
}

export const dynamic = "force-dynamic";

export default async function SlowA() {
  const data = await slowFetch("Slow A");
  return (
    <div>
      <h2 className="text-lg font-medium">{data.label} (동적 라우트)</h2>
      <p className="mt-1 text-xs text-zinc-500">
        서버에서 1.5초 대기 후 응답. <code>force-dynamic</code>으로 매번 새로
        렌더.
      </p>
      <ul className="mt-3 space-y-1">
        {data.items.map((it) => (
          <li
            key={it}
            className="rounded bg-zinc-100 dark:bg-zinc-900 px-3 py-2 text-sm"
          >
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
