import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { type User, authApi, getToken } from "../lib/auth";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!getToken()) {
      navigate({ to: "/login" });
      return;
    }
    // Verify admin role via /me endpoint
    authApi.me().then((user) => {
      if (user.role !== "admin") {
        navigate({ to: "/" });
      }
    }).catch(() => {
      navigate({ to: "/login" });
    });
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await authApi.listUsers();
      setUsers(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    try {
      await authApi.approveUser(userId);
      await fetchUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to approve user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: string) => {
    setActionLoading(userId);
    try {
      await authApi.rejectUser(userId);
      await fetchUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reject user");
    } finally {
      setActionLoading(null);
    }
  };

  const statusColor: Record<string, string> = {
    active: "var(--success)",
    pending_verification: "var(--warning)",
    pending_approval: "var(--info)",
    rejected: "var(--error)",
  };

  const statusLabel: Record<string, string> = {
    active: "Active",
    pending_verification: "Pending Email Verification",
    pending_approval: "Pending Admin Approval",
    rejected: "Rejected",
  };

  const pendingUsers = users.filter((u) => u.status === "pending_approval");
  const otherUsers = users.filter((u) => u.status !== "pending_approval");

  return (
    <div style={{ padding: "24px 32px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 4px" }}>User Management</h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
          Manage user registrations and access
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: 12,
            marginBottom: 16,
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: 8,
            color: "var(--error)",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: "var(--text-secondary)" }}>
          Loading users...
        </div>
      ) : (
        <>
          {/* Pending Approval Section */}
          {pendingUsers.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <h2
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    margin: 0,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--info)",
                  }}
                >
                  Pending Approval
                </h2>
                <span
                  style={{
                    fontSize: 11,
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    padding: "2px 8px",
                    borderRadius: 9999,
                    color: "var(--info)",
                    fontWeight: 600,
                  }}
                >
                  {pendingUsers.length}
                </span>
              </div>

              <div
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                {pendingUsers.map((user, i) => (
                  <div
                    key={user.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 16px",
                      borderTop: i > 0 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{user.email}</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                        Registered {new Date(user.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {user.email_verified_at && " • Email verified"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleApprove(user.id)}
                        disabled={actionLoading === user.id}
                        style={{
                          padding: "6px 16px",
                          fontSize: 13,
                          fontWeight: 500,
                          backgroundColor: "rgba(34, 197, 94, 0.1)",
                          border: "1px solid rgba(34, 197, 94, 0.2)",
                          borderRadius: 6,
                          color: "var(--success)",
                          cursor: actionLoading === user.id ? "not-allowed" : "pointer",
                        }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(user.id)}
                        disabled={actionLoading === user.id}
                        style={{
                          padding: "6px 16px",
                          fontSize: 13,
                          fontWeight: 500,
                          backgroundColor: "rgba(239, 68, 68, 0.1)",
                          border: "1px solid rgba(239, 68, 68, 0.2)",
                          borderRadius: 6,
                          color: "var(--error)",
                          cursor: actionLoading === user.id ? "not-allowed" : "pointer",
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Users */}
          <div>
            <h2
              style={{
                fontSize: 14,
                fontWeight: 600,
                margin: "0 0 12px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--text-secondary)",
              }}
            >
              All Users
            </h2>

            <div
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 120px 120px 160px",
                  gap: 16,
                  padding: "10px 16px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  backgroundColor: "var(--bg-tertiary)",
                }}
              >
                <span>Email</span>
                <span>Role</span>
                <span>Status</span>
                <span>Created</span>
              </div>

              {[...pendingUsers, ...otherUsers].map((user, i) => (
                <div
                  key={user.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 120px 120px 160px",
                    gap: 16,
                    padding: "12px 16px",
                    fontSize: 13,
                    borderTop: "1px solid var(--border)",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{user.email}</span>
                  <span
                    style={{
                      fontSize: 12,
                      color: user.role === "admin" ? "var(--accent)" : "var(--text-secondary)",
                      fontWeight: user.role === "admin" ? 600 : 400,
                    }}
                  >
                    {user.role}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: statusColor[user.status] || "var(--text-secondary)",
                      fontWeight: 500,
                    }}
                  >
                    {statusLabel[user.status] || user.status}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {new Date(user.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
