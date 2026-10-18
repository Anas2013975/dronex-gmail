/** CSRF defence for cookie-authenticated POSTs: the Origin header must match our own host. */
export function isSameOrigin(origin: string | null, host: string | null, dashboardUrl?: string): boolean {
  if (!origin) return false;
  let o: URL;
  try { o = new URL(origin); } catch { return false; }
  if (host && o.host === host) return true;
  if (dashboardUrl) { try { return new URL(dashboardUrl).origin === o.origin; } catch { return false; } }
  return false;
}
