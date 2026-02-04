import { describe, expect, it } from "vitest"

import { axe, render, screen } from "@/test/utils"

import WhereToStart from "./index"

describe("WhereToStart Section", () => {
  it("renders the main heading", () => {
    render(<WhereToStart />)

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Por onde Começar")
  })

  it("renders the description about DC All In", () => {
    render(<WhereToStart />)

    expect(screen.getByText(/A DC All In é uma iniciativa/i)).toBeInTheDocument()
  })

  it("renders the read online link pointing to internal reader", () => {
    render(<WhereToStart />)

    const link = screen.getByRole("link", { name: /ler online/i })

    expect(link).toHaveAttribute("href", "/ler/dc-all-in")
    expect(link).not.toHaveAttribute("target")
  })

  it("renders the download link using the proxy", () => {
    render(<WhereToStart />)

    const link = screen.getByRole("link", { name: /download/i })

    expect(link).toHaveAttribute("href", expect.stringContaining("/api/proxy/download?url="))
    expect(link).toHaveAttribute("download")
  })

  it("has accessible section with aria-labelledby", () => {
    render(<WhereToStart />)

    expect(screen.getByRole("region", { name: "Por onde Começar" })).toBeInTheDocument()
  })

  it("has proper heading-section relationship via aria-labelledby", () => {
    render(<WhereToStart />)

    const heading = screen.getByRole("heading", { level: 2 })
    const section = screen.getByRole("region")

    expect(heading).toHaveAttribute("id", "where-to-start-heading")
    expect(section).toHaveAttribute("aria-labelledby", "where-to-start-heading")
  })

  describe("Acessibilidade", () => {
    it("should have no accessibility violations", async () => {
      const { container } = render(<WhereToStart />)
      const results = await axe(container)

      expect(results).toHaveNoViolations()
    })
  })
})
