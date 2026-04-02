import { memo, useDeferredValue, useSyncExternalStore, useTransition, useState } from "react";

// 외부 스토어
let filterText = "";
const filterListeners = new Set<() => void>();

const filterStore = {
  subscribe(callback: () => void) {
    filterListeners.add(callback);
    return () => filterListeners.delete(callback);
  },
  getSnapshot() {
    return filterText;
  },
  getServerSnapshot() {
    return "";
  },
  setValue(value: string) {
    filterText = value;
    filterListeners.forEach((l) => l());
  },
};

// 의도적으로 무거운 리스트 컴포넌트
const HeavyList = memo(function HeavyList({ filter }: { filter: string }) {
  const items = Array.from({ length: 2000 }, (_, i) => `Item ${i + 1}`);
  const filtered = items.filter((item) =>
    item.toLowerCase().includes(filter.toLowerCase())
  );

  // 의도적으로 느린 렌더링
  const start = performance.now();
  while (performance.now() - start < 100) {}

  return (
    <div style={{ maxHeight: 200, overflow: "auto", fontSize: 12 }}>
      <p style={{ fontWeight: "bold" }}>
        결과: {filtered.length}개 (렌더링 ~100ms 인위 지연)
      </p>
      {filtered.slice(0, 50).map((item, i) => (
        <div key={i} style={{ padding: "2px 0" }}>
          {item}
        </div>
      ))}
      {filtered.length > 50 && <div>... 외 {filtered.length - 50}개</div>}
    </div>
  );
});

// ❌ useSyncExternalStore만 사용 — 동기 렌더로 입력이 버벅임
function WithoutDeferred() {
  const text = useSyncExternalStore(
    filterStore.subscribe,
    filterStore.getSnapshot,
    filterStore.getServerSnapshot
  );

  return (
    <div style={{ border: "2px solid #e74c3c", padding: 12, borderRadius: 8 }}>
      <h4>❌ useSyncExternalStore만 (동기 렌더)</h4>
      <p style={{ fontSize: 12, color: "#666" }}>
        외부 스토어 변경 → SyncLane 동기 렌더 → HeavyList도 즉시 리렌더 → 입력 지연
      </p>
      <HeavyList filter={text} />
    </div>
  );
}

// ✅ useDeferredValue + memo 조합 — 백그라운드에서 리렌더
function WithDeferred() {
  const text = useSyncExternalStore(
    filterStore.subscribe,
    filterStore.getSnapshot,
    filterStore.getServerSnapshot
  );

  const deferredText = useDeferredValue(text);
  const isStale = text !== deferredText;

  return (
    <div style={{ border: "2px solid #27ae60", padding: 12, borderRadius: 8 }}>
      <h4>✅ useDeferredValue + memo 조합</h4>
      <p style={{ fontSize: 12, color: "#666" }}>
        동기 렌더에서는 이전 deferredValue 유지 → memo로 HeavyList 스킵 → 입력 즉시 반응
      </p>
      <div style={{ fontSize: 12, marginBottom: 8 }}>
        <span>현재값: "{text}" | </span>
        <span>지연값: "{deferredText}" | </span>
        <span style={{ color: isStale ? "#e74c3c" : "#27ae60" }}>
          {isStale ? "⏳ 업데이트 중..." : "✅ 동기화됨"}
        </span>
      </div>
      <div style={{ opacity: isStale ? 0.5 : 1, transition: "opacity 0.1s" }}>
        <HeavyList filter={deferredText} />
      </div>
    </div>
  );
}

// React 내부 state + startTransition 비교용
function WithStartTransition() {
  const [text, setText] = useState("");
  const [deferredText, setDeferredText] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleChange = (value: string) => {
    setText(value);
    startTransition(() => {
      setDeferredText(value);
    });
  };

  return (
    <div style={{ border: "2px solid #3498db", padding: 12, borderRadius: 8 }}>
      <h4>🔄 React useState + startTransition (비교용)</h4>
      <p style={{ fontSize: 12, color: "#666" }}>
        React 내부 state라서 startTransition 사용 가능 — time-sliced 렌더링
      </p>
      <input
        type="text"
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="여기에 입력 (별도 state)"
        style={{ padding: 8, borderRadius: 4, border: "1px solid #3498db", width: "100%", marginBottom: 8 }}
      />
      <div style={{ fontSize: 12, marginBottom: 8 }}>
        <span style={{ color: isPending ? "#e74c3c" : "#27ae60" }}>
          {isPending ? "⏳ 트랜지션 진행 중..." : "✅ 완료"}
        </span>
      </div>
      <div style={{ opacity: isPending ? 0.5 : 1, transition: "opacity 0.1s" }}>
        <HeavyList filter={deferredText} />
      </div>
    </div>
  );
}

export default function Demo4_DeferredValue() {
  const text = useSyncExternalStore(
    filterStore.subscribe,
    filterStore.getSnapshot,
    filterStore.getServerSnapshot
  );

  return (
    <div>
      <h2>Demo 4: useDeferredValue 조합 패턴</h2>
      <p style={{ color: "#666", marginBottom: 16 }}>
        외부 스토어 값 변경 시, useDeferredValue + memo 조합으로 무거운 렌더를 백그라운드로 지연합니다.
      </p>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: "bold" }}>외부 스토어 필터 입력: </label>
        <input
          type="text"
          value={text}
          onChange={(e) => filterStore.setValue(e.target.value)}
          placeholder="검색어 입력 (예: 100, 200...)"
          style={{
            padding: 8,
            borderRadius: 4,
            border: "2px solid #8e44ad",
            width: 300,
            fontSize: 14,
          }}
        />
        <span style={{ fontSize: 12, color: "#666", marginLeft: 8 }}>
          이 입력은 외부 스토어(filterStore)를 변경합니다
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <WithoutDeferred />
        <WithDeferred />
        <WithStartTransition />
      </div>
    </div>
  );
}
