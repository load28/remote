"use server";

import { cookies } from "next/headers";

export async function getTokenFromCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value ?? null;
  console.log("[Server Action] getTokenFromCookie called, token:", token);
  return token;
}
