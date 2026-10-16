import { describe, expect, it } from "bun:test"
import {
  type SessionClaimsInput,
  createSessionToken,
  verifySessionToken,
} from "@dc-absoluto/shared-types/session-token"

const SECRET = "a".repeat(32)
const OTHER_SECRET = "b".repeat(32)
const NOW = Date.UTC(2026, 9, 16, 12, 0, 0)

const claims: SessionClaimsInput = {
  scope: "user",
  sub: "user-1",
  email: "bruce@wayne.com",
  name: "Bruce Wayne",
  profileImage: null,
  createdAt: "2026-01-01T00:00:00.000Z",
}

function encodeSegment(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url")
}

describe("session token", () => {
  it("round-trips the claims when signature, scope and expiry are valid", async () => {
    const token = await createSessionToken(claims, SECRET, 60, NOW)
    const verified = await verifySessionToken(token, SECRET, "user", NOW + 1000)

    expect(verified).toMatchObject(claims)
    expect(verified?.exp).toBe(Math.floor(NOW / 1000) + 60)
  })

  it("rejects a token signed with another secret", async () => {
    const token = await createSessionToken(claims, OTHER_SECRET, 60, NOW)

    expect(await verifySessionToken(token, SECRET, "user", NOW)).toBeNull()
  })

  it("rejects a token whose payload was changed after signing", async () => {
    const token = await createSessionToken(claims, SECRET, 60, NOW)
    const [version, , signature] = token.split(".")
    const forgedPayload = encodeSegment({
      ...claims,
      email: "leopetrecca@gmail.com",
      iat: Math.floor(NOW / 1000),
      exp: Math.floor(NOW / 1000) + 60,
    })

    expect(
      await verifySessionToken(`${version}.${forgedPayload}.${signature}`, SECRET, "user", NOW),
    ).toBeNull()
  })

  it("rejects the old unsigned JSON cookie format", async () => {
    const legacyCookie = encodeURIComponent(JSON.stringify({ id: "1", name: "x", email: "y" }))

    expect(await verifySessionToken(legacyCookie, SECRET, "user", NOW)).toBeNull()
  })

  it("rejects an expired token", async () => {
    const token = await createSessionToken(claims, SECRET, 60, NOW)

    expect(await verifySessionToken(token, SECRET, "user", NOW + 61_000)).toBeNull()
  })

  it("rejects a user token where an admin token is required", async () => {
    const token = await createSessionToken(claims, SECRET, 60, NOW)

    expect(await verifySessionToken(token, SECRET, "admin", NOW)).toBeNull()
  })

  it("rejects malformed input without throwing", async () => {
    for (const value of [undefined, null, "", "v1", "v1.a", "v1.a.b", "v2.a.b", "x".repeat(5000)]) {
      expect(await verifySessionToken(value, SECRET, "user", NOW)).toBeNull()
    }
  })

  it("refuses to sign with a short secret and never verifies with one", async () => {
    await expect(createSessionToken(claims, "short", 60, NOW)).rejects.toThrow()

    const token = await createSessionToken(claims, SECRET, 60, NOW)
    expect(await verifySessionToken(token, "short", "user", NOW)).toBeNull()
  })
})
