"use client";

export default function ErrorBoundary({ error }: { error: Error }) {
  return (
    <div
      style={{
        border: "2px solid #db4437",
        padding: 16,
        margin: "12px 0",
        borderRadius: 8,
        background: "#ffebee",
      }}
    >
      <strong>error.tsx가 잡은 에러 (응답은 여전히 200 OK):</strong>
      <pre style={{ whiteSpace: "pre-wrap" }}>{error.message}</pre>
    </div>
  );
}
