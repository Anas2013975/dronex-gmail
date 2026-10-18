import { NextResponse, type NextRequest } from "next/server";
import { destroySession } from "@dronex/shared";
import { cookieOptions, getStore, secret, SESSION_COOKIE } from "@/lib/server";
import { isSameOrigin } from "@/lib/origin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req.headers.get("origin"), req.headers.get("host"), process.env.DASHBOARD_URL)) return NextResponse.json({ ok: false }, { status: 403 });
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) await destroySession(getStore(), token, secret()).catch(() => undefined);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return res;
}
