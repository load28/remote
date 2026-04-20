"use client";

import { useEffect, useState } from "react";

export function MswProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { worker } = await import("@/mocks/browser");
      await worker.start({
        onUnhandledRequest: "bypass",
        serviceWorker: { url: "/mockServiceWorker.js" },
        quiet: false,
      });
      if (active) setReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center text-zinc-500 text-sm">
        ⏳ MSW 초기화 중…
      </div>
    );
  }
  return <>{children}</>;
}
