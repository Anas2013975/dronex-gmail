import { describe, expect, it } from "vitest";
import { CODE_TTL_MS, MemoryAuthStore, destroySession, generateCode, hashSecret, issueLoginCode, lookupSession, redeemLoginCode } from "./index";

const S = "x".repeat(32);
const id = { userId: "111111111111111111", guildId: "222222222222222222" };
const t0 = new Date("2026-01-01T00:00:00Z");

describe("login codes", () => {
  it("generates exactly 16 alphanumeric characters, unpredictable across calls", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 500; i++) { const c = generateCode(); expect(c).toMatch(/^[A-Za-z0-9]{16}$/); seen.add(c); }
    expect(seen.size).toBe(500);
  });
  it("stores only a hash, never the plaintext", async () => {
    const store = new MemoryAuthStore();
    const r = await issueLoginCode(store, id, S, t0);
    if (!r.ok) throw new Error("expected ok");
    expect([...store.codes.keys()]).toEqual([hashSecret(r.code, S)]);
    expect(JSON.stringify([...store.codes])).not.toContain(r.code);
  });
  it("redeems once, binds identity, and creates a usable session", async () => {
    const store = new MemoryAuthStore();
    const r = await issueLoginCode(store, id, S, t0);
    if (!r.ok) throw new Error();
    const a = await redeemLoginCode(store, r.code, S, "ip1", t0);
    if (!a.ok) throw new Error("expected ok");
    expect(a.session).toMatchObject(id);
    expect(await lookupSession(store, a.sessionToken, S, t0)).toMatchObject(id);
    expect((await redeemLoginCode(store, r.code, S, "ip1", t0)).ok).toBe(false); // single use
  });
  it("expires after five minutes", async () => {
    const store = new MemoryAuthStore();
    const r = await issueLoginCode(store, id, S, t0);
    if (!r.ok) throw new Error();
    const late = new Date(t0.getTime() + CODE_TTL_MS);
    expect((await redeemLoginCode(store, r.code, S, "ip", late)).ok).toBe(false);
    const ok = await issueLoginCode(store, id, S, t0);
    if (!ok.ok) throw new Error();
    expect((await redeemLoginCode(store, ok.code, S, "ip", new Date(t0.getTime() + CODE_TTL_MS - 1))).ok).toBe(true);
  });
  it("a new code invalidates the previous unused one for the same user+guild", async () => {
    const store = new MemoryAuthStore();
    const a = await issueLoginCode(store, id, S, t0); const b = await issueLoginCode(store, id, S, t0);
    if (!a.ok || !b.ok) throw new Error();
    expect((await redeemLoginCode(store, a.code, S, "ip", t0)).ok).toBe(false);
    expect((await redeemLoginCode(store, b.code, S, "ip", t0)).ok).toBe(true);
  });
  it("code is bound to its guild: a session never reflects another guild", async () => {
    const store = new MemoryAuthStore();
    const other = { userId: id.userId, guildId: "333333333333333333" };
    const a = await issueLoginCode(store, id, S, t0); const b = await issueLoginCode(store, other, S, t0);
    if (!a.ok || !b.ok) throw new Error();
    const ra = await redeemLoginCode(store, a.code, S, "ip", t0); const rb = await redeemLoginCode(store, b.code, S, "ip", t0);
    if (!ra.ok || !rb.ok) throw new Error();
    expect(ra.session.guildId).toBe(id.guildId); expect(rb.session.guildId).toBe(other.guildId);
  });
  it("brute force: blocks after 10 attempts per client, even with the right code", async () => {
    const store = new MemoryAuthStore();
    const r = await issueLoginCode(store, id, S, t0);
    if (!r.ok) throw new Error();
    for (let i = 0; i < 10; i++) expect(await redeemLoginCode(store, "A".repeat(16), S, "evil", t0)).toEqual({ ok: false, reason: "invalid" });
    expect(await redeemLoginCode(store, r.code, S, "evil", t0)).toEqual({ ok: false, reason: "rate_limited" });
    expect((await redeemLoginCode(store, r.code, S, "other-ip", t0)).ok).toBe(true);
  });
  it("rate-limits /key issuance per user", async () => {
    const store = new MemoryAuthStore();
    for (let i = 0; i < 5; i++) expect((await issueLoginCode(store, id, S, t0)).ok).toBe(true);
    expect(await issueLoginCode(store, id, S, t0)).toEqual({ ok: false, reason: "rate_limited" });
  });
  it("sessions expire and can be destroyed", async () => {
    const store = new MemoryAuthStore();
    const r = await issueLoginCode(store, id, S, t0);
    if (!r.ok) throw new Error();
    const a = await redeemLoginCode(store, r.code, S, "ip", t0);
    if (!a.ok) throw new Error();
    expect(await lookupSession(store, a.sessionToken, S, new Date(a.session.expiresAt.getTime() + 1))).toBeNull();
    await destroySession(store, a.sessionToken, S);
    expect(await lookupSession(store, a.sessionToken, S, t0)).toBeNull();
  });
});
