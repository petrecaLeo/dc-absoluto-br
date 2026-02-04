import { describe, expect, it } from "vitest"

import { axe, render, screen } from "@/test/utils"

import { Copyright } from "./index"

describe("Copyright Section", () => {
  it("renders the footer element", () => {
    render(<Copyright />)

    expect(screen.getByRole("contentinfo")).toBeInTheDocument()
  })

  it("renders the copyright text with current year", () => {
    render(<Copyright />)

    const currentYear = new Date().getFullYear()
    expect(screen.getByText(new RegExp(`${currentYear} DC Absoluto BR`))).toBeInTheDocument()
  })

  it("renders the rights reserved text", () => {
    render(<Copyright />)

    expect(screen.getByText(/Todos os direitos reservados/i)).toBeInTheDocument()
  })

  it("renders the DarkseidClub attribution as a link", () => {
    render(<Copyright />)

    const link = screen.getByRole("link", { name: /Darkseid Club/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute("href", "https://site.ds-club.net/")
    expect(link).toHaveAttribute("target", "_blank")
  })

  it("renders the particle canvas", () => {
    const { container } = render(<Copyright />)

    const canvas = container.querySelector("canvas")
    expect(canvas).toBeInTheDocument()
    expect(canvas).toHaveAttribute("aria-hidden", "true")
  })

  it("uses semantic footer element", () => {
    const { container } = render(<Copyright />)

    const footer = container.querySelector("footer")
    expect(footer).toBeInTheDocument()
  })

  describe("Acessibilidade", () => {
    it("should have no accessibility violations", async () => {
      const { container } = render(<Copyright />)
      const results = await axe(container)

      expect(results).toHaveNoViolations()
    })
  })
})
