import { createQuery } from "@/lib/query/create-query";

export interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}

export const postsQuery = createQuery<Post[]>({
  key: ["posts"],
  endpoint: "/posts?_limit=5",
  auth: true,
});
