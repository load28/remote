/// <reference types="vite/client" />
import {
  Outlet,
  HeadContent,
  Scripts,
  createRootRoute,
  useRouterState,
  useNavigate,
} from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { type User, authApi, getToken, clearToken } from "../lib/auth";
import { UnauthorizedError } from "../lib/httpClient";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SST Monitor - Deployment Dashboard" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  component: RootComponent,
});

const PUBLIC_ROUTES = ["/login", "/register", "/verify-email"];

function RootComponent() {
  const routerState = useRouterState();
  const navigate = useNavigate();
  const currentPath = routerState.location.pathname;
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const isPublicRoute = PUBLIC_ROUTES.some((r) => currentPath.startsWith(r));

  // Global handler: catch UnauthorizedError from any API call and redirect
  useEffect(() => {
    const handleUnauth = (event: PromiseRejectionEvent) => {
      if (event.reason instanceof UnauthorizedError) {
        event.preventDefault();
        clearToken();
        setUser(null);
        navigate({ to: "/login" });
      }
    };
    window.addEventListener("unhandledrejection", handleUnauth);
    return () => window.removeEventListener("unhandledrejection", handleUnauth);
  }, [navigate]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setAuthChecked(true);
      if (!isPublicRoute) {
        navigate({ to: "/login" });
      }
      return;
    }

    authApi
      .me()
      .then((u) => {
        setUser(u);
        setAuthChecked(true);
      })
      .catch(() => {
        clearToken();
        setAuthChecked(true);
        if (!isPublicRoute) {
          navigate({ to: "/login" });
        }
      });
  }, [currentPath, isPublicRoute, navigate]);

  const handleLogout = () => {
    clearToken();
    setUser(null);
    navigate({ to: "/login" });
  };

  // Show nothing until auth check completes
  if (!authChecked) {
    return (
      <RootDocument>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            color: "var(--text-secondary)",
          }}
        >
          Loading...
        </div>
      </RootDocument>
    );
  }

  // Public routes - no sidebar
  if (isPublicRoute) {
    return (
      <RootDocument>
        <Outlet />
      </RootDocument>
    );
  }

  // Protected routes - with sidebar
  return (
    <RootDocument>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar user={user} onLogout={handleLogout} />
        <main style={{ flex: 1, marginLeft: 240 }}>
          <Outlet />
        </main>
      </div>
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
