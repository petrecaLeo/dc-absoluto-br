import { describe, expect, it } from "vitest"

import { axe, render, screen } from "@/test/utils"

import Home from "./index"

describe("Home Section", () => {
  it("renders the logo", () => {
    render(<Home latestComic={null} />)

    expect(screen.getByAltText("DC Absoluto BR")).toBeInTheDocument()
  })

  it("renders the description", () => {
    render(<Home latestComic={null} />)

    expect(screen.getByText(/Catálogo de HQs do Universo/i)).toBeInTheDocument()
    expect(screen.getByText(/Absolute da DC em Português/i)).toBeInTheDocument()
  })

  it("has accessible images with alt text", () => {
    render(<Home latestComic={null} />)

    const images = screen.getAllByAltText("Personagens da DC Comics")
    expect(images).toHaveLength(2)
  })

  it("has accessible section with aria-label", () => {
    render(<Home latestComic={null} />)

    expect(screen.getByRole("region", { name: "Início" })).toBeInTheDocument()
  })

  it("renders the start button", () => {
    render(<Home latestComic={null} />)

    expect(
      screen.getByRole("button", { name: /Começar - ir para seção de personagens/i }),
    ).toBeInTheDocument()
  })

  describe("Acessibilidade", () => {
    it("should have no accessibility violations", async () => {
      const { container } = render(<Home latestComic={null} />)
      const results = await axe(container)

      expect(results).toHaveNoViolations()
    })
  })
})
