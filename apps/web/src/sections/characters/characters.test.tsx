import { beforeEach, describe, expect, it, vi } from "vitest"

import { axe, render, screen } from "@/test/utils"

vi.mock("@/services/characters", () => ({
  getCharacters: vi.fn(() =>
    Promise.resolve({
      data: [
        {
          id: "1",
          slug: "batman",
          name: "Batman",
          alias: "Bruce Wayne",
          rating: 4.5,
          upvotes: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          slug: "superman",
          name: "Superman",
          alias: "Clark Kent",
          rating: 4.8,
          upvotes: 150,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      total: 2,
    }),
  ),
}))

vi.mock("next/image", () => ({
  default: function MockImage(props: { src: string; alt: string; [key: string]: unknown }) {
    const { src, alt, ...rest } = props
    return <img src={src} alt={alt} data-testid="mock-image" {...rest} />
  },
}))

import Characters from "./index"

describe("Characters Section", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the main heading", async () => {
    const CharactersResolved = await Characters()
    render(CharactersResolved)

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Personagens")
  })

  it("renders the description", async () => {
    const CharactersResolved = await Characters()
    render(CharactersResolved)

    expect(screen.getByText(/Selecione seu herói favorito para começar a ler/i)).toBeInTheDocument()
  })

  it("has accessible section with aria-labelledby", async () => {
    const CharactersResolved = await Characters()
    render(CharactersResolved)

    expect(screen.getByRole("region", { name: "Personagens" })).toBeInTheDocument()
  })

  it("has proper heading-section relationship via aria-labelledby", async () => {
    const CharactersResolved = await Characters()
    render(CharactersResolved)

    const heading = screen.getByRole("heading", { level: 2 })
    const section = screen.getByRole("region")

    expect(heading).toHaveAttribute("id", "characters-heading")
    expect(section).toHaveAttribute("aria-labelledby", "characters-heading")
  })

  it("renders character selector with character name", async () => {
    const CharactersResolved = await Characters()
    render(CharactersResolved)

    expect(screen.getByRole("heading", { level: 3, name: "Batman" })).toBeInTheDocument()
    expect(screen.getByText("Bruce Wayne")).toBeInTheDocument()
  })

  it("renders character selection buttons for all characters", async () => {
    const CharactersResolved = await Characters()
    render(CharactersResolved)

    const batmanButton = screen.getByRole("button", { name: /Selecionar Batman/i })
    const supermanButton = screen.getByRole("button", { name: /Selecionar Superman/i })

    expect(batmanButton).toBeInTheDocument()
    expect(supermanButton).toBeInTheDocument()
  })

  it("first character button is selected by default", async () => {
    const CharactersResolved = await Characters()
    render(CharactersResolved)

    const batmanButton = screen.getByRole("button", { name: /Selecionar Batman/i })
    expect(batmanButton).toHaveAttribute("aria-pressed", "true")
  })

  it("renders the start reading button", async () => {
    const CharactersResolved = await Characters()
    render(CharactersResolved)

    const startButton = screen.getByRole("button", { name: /Começar leitura com Batman/i })
    expect(startButton).toBeInTheDocument()
  })

  describe("Acessibilidade", () => {
    it("should have no accessibility violations", async () => {
      const CharactersResolved = await Characters()
      const { container } = render(CharactersResolved)
      const results = await axe(container)

      expect(results).toHaveNoViolations()
    })
  })
})
