export default function HomeTab() {
  return (
    <div>
      <h2 className="text-lg font-medium">Home (정적 라우트)</h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        이 라우트는 데이터 fetching이 없어 거의 즉시 렌더됩니다. isPending이
        true로 보이는 시간이 매우 짧을 것입니다.
      </p>
    </div>
  );
}
