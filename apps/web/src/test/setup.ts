import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach, expect, vi } from "vitest"
import * as matchers from "vitest-axe/matchers"

expect.extend(matchers)

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
