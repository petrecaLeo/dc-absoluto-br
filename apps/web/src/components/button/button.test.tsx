import { describe, expect, it } from "vitest"

import { axe, render, screen } from "@/test/utils"

import { Button } from "./index"

describe("Button", () => {
  it("renders with default props", () => {
    render(<Button>Click me</Button>)

    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument()
  })

  it("renders all variants", () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>)
    expect(screen.getByRole("button")).toHaveClass("bg-dc-blue")

    rerender(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByRole("button")).toHaveClass("bg-dc-red")

    rerender(<Button variant="outline">Outline</Button>)
    expect(screen.getByRole("button")).toHaveClass("border-dc-blue")
  })

  it("renders all sizes", () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    expect(screen.getByRole("button")).toHaveClass("text-sm")

    rerender(<Button size="md">Medium</Button>)
    expect(screen.getByRole("button")).toHaveClass("text-base")

    rerender(<Button size="lg">Large</Button>)
    expect(screen.getByRole("button")).toHaveClass("text-lg")
  })

  it("can be disabled", () => {
    render(<Button disabled>Disabled</Button>)

    expect(screen.getByRole("button")).toBeDisabled()
  })

  describe("Acessibilidade", () => {
    it("should have no accessibility violations with default props", async () => {
      const { container } = render(<Button>Accessible Button</Button>)
      const results = await axe(container)

      expect(results).toHaveNoViolations()
    })

    it("should have no accessibility violations when disabled", async () => {
      const { container } = render(<Button disabled>Disabled Button</Button>)
      const results = await axe(container)

      expect(results).toHaveNoViolations()
    })

    it("should have no accessibility violations for all variants", async () => {
      const { container, rerender } = render(<Button variant="primary">Primary</Button>)
      expect(await axe(container)).toHaveNoViolations()

      rerender(<Button variant="secondary">Secondary</Button>)
      expect(await axe(container)).toHaveNoViolations()

      rerender(<Button variant="outline">Outline</Button>)
      expect(await axe(container)).toHaveNoViolations()
    })

    it("has visible focus indicator", () => {
      render(<Button>Focus Test</Button>)
      const button = screen.getByRole("button")

      expect(button).toHaveClass("focus:ring-2")
      expect(button).toHaveClass("focus:ring-dc-blue")
    })
  })
})
