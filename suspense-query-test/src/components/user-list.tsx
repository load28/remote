"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

interface User {
  id: number;
  name: string;
  email: string;
  company: { name: string };
}

export function UserList() {
  const { data: users } = useSuspenseQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      // 서스펜스 동작 확인을 위해 인위적 지연 추가
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const res = await fetch(
        "https://jsonplaceholder.typicode.com/users"
      );
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {users.map((user) => (
        <li
          key={user.id}
          style={{
            padding: "12px 16px",
            marginBottom: "8px",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
          }}
        >
          <strong>{user.name}</strong>
          <br />
          <span style={{ color: "#64748b", fontSize: "14px" }}>
            {user.email} · {user.company.name}
          </span>
        </li>
      ))}
    </ul>
  );
}
