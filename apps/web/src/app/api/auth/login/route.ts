import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { redeemLoginCode } from "@dronex/shared";
import { cookieOptions, getStore, secret, SESSION_COOKIE } from "@/lib/server";
import { isSameOrigin } from "@/lib/origin";

export const runtime = "nodejs";
const body = z.object({ code: z.string().trim().length(16) });
const fail = (status: number, error: string) => NextResponse.json({ ok: false, error }, { status });

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req.headers.get("origin"), req.headers.get("host"), process.env.DASHBOARD_URL)) return fail(403, "طلب غير مسموح.");
  const parsed = body.safeParse(await req.json().catch(() => null));
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  try {
    // Malformed bodies still count against the rate limit by passing an empty code.
    const r = await redeemLoginCode(getStore(), parsed.success ? parsed.data.code : "", secret(), ip);
    if (!r.ok) return r.reason === "rate_limited" ? fail(429, "محاولات كثيرة. حاول لاحقاً.") : fail(401, "الكود غير صحيح أو منتهي.");
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, r.sessionToken, { ...cookieOptions, expires: r.session.expiresAt });
    return res;
  } catch (e) {
    console.error("login.failed", e instanceof Error ? e.message : "unknown");
    return fail(500, "خطأ في الخادم.");
  }
}
