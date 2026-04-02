import { useState, useEffect } from "react";

// 인위적 지연이 있는 가짜 API
function fakeFetchBio(person: string): Promise<string> {
  return new Promise((resolve) => {
    const delay = person === "Alice" ? 3000 : person === "Bob" ? 500 : 800;
    setTimeout(() => {
      resolve(`${person}의 소개: 안녕하세요 저는 ${person}입니다. (응답 지연: ${delay}ms)`);
    }, delay);
  });
}

// ❌ Race Condition 발생 버전
function BrokenFetch() {
  const [person, setPerson] = useState("Alice");
  const [bio, setBio] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    setBio(null);
    const timestamp = Date.now();
    setLog((prev) => [...prev, `[${new Date(timestamp).toLocaleTimeString()}] 요청 발송: ${person}`]);

    fakeFetchBio(person).then((result) => {
      setBio(result); // ❌ 어떤 응답이든 무조건 반영
      setLog((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] 응답 도착 & 반영: ${person}`,
      ]);
    });
  }, [person]);

  return (
    <div style={{ border: "2px solid #e74c3c", padding: 16, borderRadius: 8 }}>
      <h3>❌ Race Condition 발생 (cleanup 없음)</h3>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {["Alice", "Bob", "Taylor"].map((name) => (
          <button
            key={name}
            onClick={() => setPerson(name)}
            style={{
              padding: "8px 16px",
              background: person === name ? "#e74c3c" : "#eee",
              color: person === name ? "white" : "black",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            {name}
          </button>
        ))}
      </div>
      <p>
        <strong>현재 선택:</strong> {person}
      </p>
      <p>
        <strong>표시된 Bio:</strong> {bio ?? "로딩 중..."}
      </p>
      <div
        style={{
          background: "#fff5f5",
          padding: 8,
          borderRadius: 4,
          maxHeight: 120,
          overflow: "auto",
          fontSize: 12,
        }}
      >
        <strong>로그:</strong>
        {log.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}

// ✅ ignore 플래그로 Race Condition 해결
function FixedFetch() {
  const [person, setPerson] = useState("Alice");
  const [bio, setBio] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    let ignore = false;

    setBio(null);
    const timestamp = Date.now();
    setLog((prev) => [...prev, `[${new Date(timestamp).toLocaleTimeString()}] 요청 발송: ${person}`]);

    fakeFetchBio(person).then((result) => {
      if (!ignore) {
        setBio(result);
        setLog((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ✅ 응답 반영: ${person}`,
        ]);
      } else {
        setLog((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] 🚫 무시됨 (ignore=true): ${person}`,
        ]);
      }
    });

    return () => {
      ignore = true;
    };
  }, [person]);

  return (
    <div style={{ border: "2px solid #27ae60", padding: 16, borderRadius: 8 }}>
      <h3>✅ ignore 플래그로 해결</h3>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {["Alice", "Bob", "Taylor"].map((name) => (
          <button
            key={name}
            onClick={() => setPerson(name)}
            style={{
              padding: "8px 16px",
              background: person === name ? "#27ae60" : "#eee",
              color: person === name ? "white" : "black",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            {name}
          </button>
        ))}
      </div>
      <p>
        <strong>현재 선택:</strong> {person}
      </p>
      <p>
        <strong>표시된 Bio:</strong> {bio ?? "로딩 중..."}
      </p>
      <div
        style={{
          background: "#f0fff4",
          padding: 8,
          borderRadius: 4,
          maxHeight: 120,
          overflow: "auto",
          fontSize: 12,
        }}
      >
        <strong>로그:</strong>
        {log.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}

export default function Demo1_RaceCondition() {
  return (
    <div>
      <h2>Demo 1: Race Condition — ignore 플래그 패턴</h2>
      <p style={{ color: "#666", marginBottom: 16 }}>
        Alice → Bob → Taylor 순서로 빠르게 클릭하세요. Alice는 3초 지연, 나머지는 0.5~0.8초입니다.
      </p>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 400 }}>
          <BrokenFetch />
        </div>
        <div style={{ flex: 1, minWidth: 400 }}>
          <FixedFetch />
        </div>
      </div>
    </div>
  );
}
