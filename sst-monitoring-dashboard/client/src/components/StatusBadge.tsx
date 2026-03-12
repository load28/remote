interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toUpperCase();

  let className = "status-badge ";
  if (normalized.includes("COMPLETE") && !normalized.includes("ROLLBACK")) {
    className += "status-complete";
  } else if (normalized.includes("FAILED") || normalized.includes("ROLLBACK")) {
    className += "status-failed";
  } else if (normalized.includes("PROGRESS")) {
    className += "status-in-progress";
  } else {
    className += "status-complete";
  }

  const dotColor = normalized.includes("FAILED") || normalized.includes("ROLLBACK")
    ? "var(--error)"
    : normalized.includes("PROGRESS")
    ? "var(--info)"
    : "var(--success)";

  return (
    <span className={className}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: dotColor,
          display: "inline-block",
        }}
      />
      {formatStatus(status)}
    </span>
  );
}

function formatStatus(status: string): string {
  return status
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}
