import Link from "next/link";

export function BackLink() {
  return (
    <Link
      href="/"
      className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
    >
      ← 데모 목록
    </Link>
  );
}
