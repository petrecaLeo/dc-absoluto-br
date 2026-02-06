import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach, expect, vi } from "vitest"
import * as matchers from "vitest-axe/matchers"

expect.extend(matchers)

process.env.NEXT_PUBLIC_API_URL ??= "http://localhost:3001"
process.env.NEXT_PUBLIC_SITE_URL ??= "http://localhost:3000"
process.env.API_URL ??= process.env.NEXT_PUBLIC_API_URL
process.env.SITE_URL ??= process.env.NEXT_PUBLIC_SITE_URL

if (typeof window !== "undefined") {
  window.scrollTo = () => {}
}

if (typeof HTMLCanvasElement !== "undefined") {
  const noop = () => {}
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    value: () => ({
      canvas: document.createElement("canvas"),
      setTransform: noop,
      clearRect: noop,
      beginPath: noop,
      arc: noop,
      fill: noop,
      moveTo: noop,
      lineTo: noop,
      stroke: noop,
      strokeStyle: "",
      lineWidth: 1,
      globalAlpha: 1,
      fillStyle: "",
    }),
  })
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}))

afterEach(() => {
  cleanup()
})
