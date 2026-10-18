"use client";
import { useState } from "react";

export default function LoginForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) { window.location.href = "/dashboard"; return; }
      setError(data.error ?? "تعذّر تسجيل الدخول.");
    } catch { setError("تعذّر الاتصال بالخادم."); }
    finally { setBusy(false); }
  }

  return (
    <div className="stack">
      <label htmlFor="code">كود الدخول (16 خانة)</label>
      <input id="code" dir="ltr" autoComplete="off" spellCheck={false} maxLength={16} value={code}
        onChange={(e) => setCode(e.target.value.replace(/[^A-Za-z0-9]/g, ""))}
        onKeyDown={(e) => { if (e.key === "Enter" && code.length === 16 && !busy) void submit(); }} />
      <button className="btn" disabled={busy || code.length !== 16} onClick={() => void submit()}>{busy ? "جارٍ التحقق…" : "دخول"}</button>
      {error && <p role="alert" className="error">{error}</p>}
    </div>
  );
}
