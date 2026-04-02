import {
  Suspense,
  useState,
  useSyncExternalStore,
  useDeferredValue,
  useTransition,
  use,
} from "react";

// 외부 스토어: 현재 선택된 데이터 ID
let currentId = "A";
const idListeners = new Set<() => void>();

const idStore = {
  subscribe(callback: () => void) {
    idListeners.add(callback);
    return () => idListeners.delete(callback);
  },
  getSnapshot() {
    return currentId;
  },
  getServerSnapshot() {
    return "A";
  },
  setValue(id: string) {
    currentId = id;
    idListeners.forEach((l) => l());
  },
};

// 비동기 데이터 페칭 캐시 (Suspense 통합)
const cache = new Map<string, { promise: Promise<string>; result?: string; error?: unknown }>();

function fetchChartData(id: string): Promise<string> {
  if (cache.has(id) && cache.get(id)!.result !== undefined) {
    return Promise.resolve(cache.get(id)!.result!);
  }

  if (cache.has(id)) {
    return cache.get(id)!.promise;
  }

  const promise = new Promise<string>((resolve) => {
    setTimeout(() => {
      const result = `데이터 ${id}: ${Math.random().toFixed(4)} (로드 시간: 2초)`;
      const entry = cache.get(id);
      if (entry) entry.result = result;
      resolve(result);
    }, 2000);
  });

  cache.set(id, { promise });
  return promise;
}

// Suspense와 use()를 사용하는 차트 컴포넌트
function Chart({ id }: { id: string }) {
  const data = use(fetchChartData(id));
  return (
    <div
      style={{
        padding: 16,
        background: "#e8f8f5",
        borderRadius: 8,
        border: "1px solid #1abc9c",
      }}
    >
      <h4>📊 차트 데이터 (ID: {id})</h4>
      <p>{data}</p>
    </div>
  );
}

// ❌ 외부 스토어 + Suspense — fallback이 바로 표시됨
function ExternalStoreWithSuspense() {
  const storeId = useSyncExternalStore(
    idStore.subscribe,
    idStore.getSnapshot,
    idStore.getServerSnapshot
  );
  const deferredId = useDeferredValue(storeId);

  return (
    <div style={{ border: "2px solid #e74c3c", padding: 16, borderRadius: 8 }}>
      <h4>❌ 외부 스토어 + useDeferredValue + Suspense</h4>
      <p style={{ fontSize: 12, color: "#666" }}>
        storeId 변경 → SyncLane 동기 리렌더 → use()가 suspend → <strong>fallback 즉시 표시</strong>
      </p>
      <div style={{ fontSize: 12, marginBottom: 8 }}>
        storeId: "{storeId}" | deferredId: "{deferredId}"
      </div>
      <Suspense
        fallback={
          <div
            style={{
              padding: 16,
              background: "#ffeaa7",
              borderRadius: 8,
              border: "2px dashed #e74c3c",
              textAlign: "center",
              fontSize: 16,
            }}
          >
            ⏳ Suspense Fallback 표시됨!
            <br />
            <span style={{ fontSize: 12 }}>
              useDeferredValue가 이것을 막지 못함 (SyncLane이므로)
            </span>
          </div>
        }
      >
        <Chart id={deferredId} />
      </Suspense>
    </div>
  );
}

// ✅ React useState + startTransition + Suspense — fallback 방지
function ReactStateWithSuspense() {
  const [id, setId] = useState("A");
  const [isPending, startTransition] = useTransition();

  const handleChange = (newId: string) => {
    startTransition(() => {
      setId(newId);
    });
  };

  return (
    <div style={{ border: "2px solid #27ae60", padding: 16, borderRadius: 8 }}>
      <h4>✅ React useState + startTransition + Suspense</h4>
      <p style={{ fontSize: 12, color: "#666" }}>
        startTransition으로 감쌈 → suspend 시 <strong>이전 UI 유지</strong> (fallback 표시 안 됨)
      </p>
      <div style={{ marginBottom: 8, display: "flex", gap: 8 }}>
        {["A", "B", "C", "D"].map((dataId) => (
          <button
            key={dataId}
            onClick={() => handleChange(dataId)}
            style={{
              padding: "6px 16px",
              background: id === dataId ? "#27ae60" : "#eee",
              color: id === dataId ? "white" : "black",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            데이터 {dataId}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 12, marginBottom: 8 }}>
        <span style={{ color: isPending ? "#e74c3c" : "#27ae60" }}>
          {isPending ? "⏳ 트랜지션 진행 중 (이전 UI 유지)" : "✅ 완료"}
        </span>
      </div>
      <div style={{ opacity: isPending ? 0.5 : 1, transition: "opacity 0.2s" }}>
        <Suspense
          fallback={
            <div
              style={{
                padding: 16,
                background: "#ffeaa7",
                borderRadius: 8,
                border: "2px dashed #27ae60",
                textAlign: "center",
                fontSize: 16,
              }}
            >
              ⏳ Suspense Fallback (첫 로드에만 보임)
            </div>
          }
        >
          <Chart id={id} />
        </Suspense>
      </div>
    </div>
  );
}

export default function Demo5_SuspenseFallback() {
  return (
    <div>
      <h2>Demo 5: useDeferredValue가 해결하지 못하는 Suspense Fallback 문제</h2>
      <p style={{ color: "#666", marginBottom: 8 }}>
        <strong>핵심:</strong> useSyncExternalStore는 SyncLane(동기)으로 리렌더를 강제하므로,
        그 렌더 안에서 suspend가 발생하면 useDeferredValue로도 fallback을 막을 수 없습니다.
      </p>
      <p style={{ color: "#666", marginBottom: 16 }}>
        <strong>해결책:</strong> 비동기 데이터 페칭이 필요한 상태는 React useState로 관리하고 startTransition을 사용해야 합니다.
      </p>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: "bold" }}>외부 스토어 ID 변경: </label>
        {["A", "B", "C", "D"].map((dataId) => (
          <button
            key={dataId}
            onClick={() => {
              cache.delete(dataId); // 캐시 제거하여 suspend 유발
              idStore.setValue(dataId);
            }}
            style={{
              padding: "8px 16px",
              margin: "0 4px",
              background: "#8e44ad",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            {dataId}
          </button>
        ))}
        <span style={{ fontSize: 12, color: "#666", marginLeft: 8 }}>
          (캐시를 제거하고 ID를 변경하여 suspend 유발)
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <ExternalStoreWithSuspense />
        <ReactStateWithSuspense />
      </div>

      <div
        style={{
          marginTop: 16,
          padding: 16,
          background: "#fef9e7",
          borderRadius: 8,
          border: "1px solid #f39c12",
        }}
      >
        <h4>💡 왜 이런 차이가 발생하는가?</h4>
        <pre style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>
{`[외부 스토어 경로]
storeId 변경 → useSyncExternalStore → SyncLane(urgent) 동기 리렌더
  → deferredValue가 있어도 SyncLane 렌더 안에서 Chart가 suspend
  → React: "urgent 업데이트니까 fallback 바로 보여줌"

[React state 경로]
setId(newId) in startTransition → transition lane(non-urgent) 리렌더
  → suspend 발생 → React: "transition이니까 이전 UI 유지"
  → 데이터 로드 완료 → 새 UI 표시`}
        </pre>
      </div>
    </div>
  );
}
