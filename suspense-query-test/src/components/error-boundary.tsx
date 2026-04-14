"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: "16px",
            border: "1px solid #ef4444",
            borderRadius: "8px",
            backgroundColor: "#fff",
          }}
        >
          <strong style={{ color: "#dc2626" }}>SSR 에러 발생!</strong>
          <pre
            style={{
              marginTop: "8px",
              padding: "12px",
              backgroundColor: "#1e293b",
              color: "#f87171",
              borderRadius: "6px",
              fontSize: "13px",
              overflow: "auto",
            }}
          >
            {this.state.error.message}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
