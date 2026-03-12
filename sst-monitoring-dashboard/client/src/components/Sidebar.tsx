import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { User } from "../lib/auth";

interface SidebarProps {
  user?: User | null;
  onLogout?: () => void;
}

const icons: Record<string, ReactNode> = {
  grid: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  terminal: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
};

export function Sidebar({ user, onLogout }: SidebarProps) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const navItems = [
    { to: "/", label: "Apps", icon: "grid" },
    { to: "/logs", label: "Logs", icon: "terminal" },
    ...(user?.role === "admin"
      ? [{ to: "/admin/users", label: "Users", icon: "users" }]
      : []),
  ] as const;

  return (
    <aside
      style={{
        width: 240,
        height: "100vh",
        backgroundColor: "var(--bg-secondary)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: 0,
        top: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, var(--accent), #a855f7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            S
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>SST Monitor</div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
              Deployment Dashboard
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: "12px 8px", flex: 1 }}>
        {navItems.map((item) => {
          const isActive =
            item.to === "/"
              ? currentPath === "/" || currentPath.startsWith("/apps")
              : currentPath.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 8,
                marginBottom: 2,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 500,
                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                backgroundColor: isActive ? "var(--bg-tertiary)" : "transparent",
                transition: "all 0.15s",
              }}
            >
              {icons[item.icon]}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info & Footer */}
      <div
        style={{
          borderTop: "1px solid var(--border)",
          padding: "12px 16px",
        }}
      >
        {user && (
          <div style={{ marginBottom: 8 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.email}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              <span
                style={{
                  fontSize: 11,
                  color: user.role === "admin" ? "var(--accent)" : "var(--text-secondary)",
                  fontWeight: user.role === "admin" ? 600 : 400,
                }}
              >
                {user.role}
              </span>
            </div>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
            SST Monitor v0.1.0
          </span>
          {onLogout && (
            <button
              onClick={onLogout}
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: 4,
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = "var(--error)")}
              onMouseOut={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
