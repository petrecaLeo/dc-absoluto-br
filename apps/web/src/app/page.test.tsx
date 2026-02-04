import "@testing-library/jest-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { axe, render, screen } from "@/test/utils"

vi.mock("@/sections/characters", () => ({
  default: function MockCharacters() {
    return (
      <section aria-labelledby="characters-heading">
        <h2 id="characters-heading">Personagens</h2>
      </section>
    )
  },
}))

import { PageContent } from "./page-content"

describe("Home Page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the logo", () => {
    render(<PageContent latestComic={null} />)

    const logos = screen.getAllByAltText("DC Absoluto BR")
    expect(logos.length).toBeGreaterThan(0)
  })

  it("renders the description", () => {
    render(<PageContent latestComic={null} />)

    expect(screen.getByText(/Catálogo de HQs do Universo/i)).toBeInTheDocument()
  })

  it("renders the characters section", () => {
    render(<PageContent latestComic={null} />)

    expect(screen.getByRole("heading", { level: 2, name: /personagens/i })).toBeInTheDocument()
  })

  it("should have no accessibility violations", async () => {
    const { container } = render(<PageContent latestComic={null} />)
    const results = await axe(container)

    expect(results).toHaveNoViolations()
  })
})
