import { describe, expect, it } from "bun:test"
import { createApp } from "../index"

describe("Health endpoint", () => {
  const app = createApp()

  it("returns status ok", async () => {
    const response = await app.handle(new Request("http://localhost/health"))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.status).toBe("ok")
    expect(body.timestamp).toBeDefined()
  })
})
