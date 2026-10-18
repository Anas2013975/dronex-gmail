import "server-only";
import { PgAuthStore, createSql, lookupSession, type AuthStore } from "@dronex/shared";
import { cookies } from "next/headers";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

export const secret = () => {
  const s = required("AUTH_CODE_SECRET");
  if (s.length < 32) throw new Error("AUTH_CODE_SECRET must be at least 32 characters");
  return s;
};

const g = globalThis as unknown as { __store?: AuthStore };
export function getStore(): AuthStore {
  // Created lazily so `next build` works without a database.
  return (g.__store ??= new PgAuthStore(createSql(required("DATABASE_URL"))));
}

const prod = process.env.NODE_ENV === "production";
export const SESSION_COOKIE = prod ? "__Host-dronex_session" : "dronex_session";
export const cookieOptions = { httpOnly: true, secure: prod, sameSite: "lax" as const, path: "/" };

export async function currentSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return lookupSession(getStore(), token, secret());
}
