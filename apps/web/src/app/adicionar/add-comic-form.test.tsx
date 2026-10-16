import type { Character } from "@dc-absoluto/shared-types"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { fireEvent, render, screen, waitFor, within } from "@/test/utils"
import { AddComicForm } from "./add-comic-form"
import { buildComicPayload } from "./add-comic-form.hook"

const mockFetch = vi.fn()
globalThis.fetch = mockFetch as unknown as typeof fetch

const characters: Character[] = [
  {
    id: "8552b2fd-cafc-4d6e-bf52-e91b37d74f25",
    slug: "catwoman",
    name: "Mulher-Gato",
    alias: "Selina Kyle",
    rating: 0,
    upvotes: 0,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    id: "90df6742-054a-4af4-a32d-748a54b095d9",
    slug: "batman",
    name: "Batman",
    alias: "Bruce Wayne",
    rating: 0,
    upvotes: 0,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
]

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText(/personagem/i), {
    target: { value: characters[0]?.id },
  })
  fireEvent.change(screen.getByLabelText(/nome da hq/i), {
    target: { value: "  Mulher-Gato Absoluta #1  " },
  })
  fireEvent.change(screen.getByLabelText(/número/i), { target: { value: "1" } })
  fireEvent.change(screen.getByLabelText(/data de lançamento/i), {
    target: { value: "2026-06-10" },
  })
  fireEvent.change(screen.getByLabelText(/link de download/i), {
    target: { value: "https://example.com/mulher-gato-1.cbr" },
  })
}

describe("buildComicPayload", () => {
  it("omite opcionais vazios e converte o número", () => {
    const payload = buildComicPayload({
      characterId: "id",
      title: " HQ ",
      issueNumber: "13.5",
      releaseDate: "2026-06-10",
      downloadUrl: " https://example.com/a.cbr ",
      universe: "  ",
      coverUrl: "  ",
      writer: "Che Grayson",
      artists: "",
      publisher: "",
    })

    expect(payload).toEqual({
      characterId: "id",
      title: "HQ",
      issueNumber: 13.5,
      releaseDate: "2026-06-10",
      downloadUrl: "https://example.com/a.cbr",
      universe: "absolute",
      writer: "Che Grayson",
    })
    expect(JSON.parse(JSON.stringify(payload))).not.toHaveProperty("coverUrl")
  })
})

describe("AddComicForm", () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it("marca como obrigatórios só personagem, nome, número, data, link e universo", () => {
    render(<AddComicForm characters={characters} />)

    for (const label of [
      /personagem/i,
      /nome da hq/i,
      /número/i,
      /data de lançamento/i,
      /link de download/i,
      /universo/i,
    ]) {
      expect(screen.getByLabelText(label)).toBeRequired()
    }

    for (const label of [/link da capa/i, /roteiro/i, /arte/i, /editora/i]) {
      expect(screen.getByLabelText(label)).not.toBeRequired()
    }
  })

  it("lista os personagens em ordem alfabética e começa no universo absolute", () => {
    render(<AddComicForm characters={characters} />)

    const options = within(screen.getByLabelText(/personagem/i))
      .getAllByRole("option")
      .map((option) => option.textContent)
    expect(options).toEqual(["Selecione um personagem", "Batman", "Mulher-Gato"])
    expect(screen.getByLabelText(/universo/i)).toHaveValue("absolute")
  })

  it("envia só os campos preenchidos e mostra o link da HQ criada", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ data: { id: "comic-1", universe: "absolute" } }),
    })
    render(<AddComicForm characters={characters} />)

    fillRequiredFields()
    fireEvent.click(screen.getByRole("button", { name: /adicionar hq/i }))

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/cadastrada/i)
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toBe("/api/admin/comics")
    expect(JSON.parse(String(init.body))).toEqual({
      characterId: characters[0]?.id,
      title: "Mulher-Gato Absoluta #1",
      issueNumber: 1,
      releaseDate: "2026-06-10",
      downloadUrl: "https://example.com/mulher-gato-1.cbr",
      universe: "absolute",
    })
    expect(screen.getByRole("link", { name: /ver na página/i })).toHaveAttribute(
      "href",
      "/catwoman/absolute",
    )
    // O formulário fica como estava, para cadastrar a próxima edição mudando só o necessário.
    expect(screen.getByLabelText(/personagem/i)).toHaveValue(characters[0]?.id)
    expect(screen.getByLabelText(/nome da hq/i)).toHaveValue("  Mulher-Gato Absoluta #1  ")
    expect(screen.getByLabelText(/número/i)).toHaveValue(1)
    expect(screen.getByLabelText(/data de lançamento/i)).toHaveValue("2026-06-10")
    expect(screen.getByLabelText(/link de download/i)).toHaveValue(
      "https://example.com/mulher-gato-1.cbr",
    )
  })

  it("avisa quando a sessão de administrador expirou", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ success: false }),
    })
    render(<AddComicForm characters={characters} />)

    fillRequiredFields()
    fireEvent.click(screen.getByRole("button", { name: /adicionar hq/i }))

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/sessão de administrador expirou/i)
    })
  })

  it("mostra a mensagem de erro da API", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ success: false, message: "HQ já cadastrada" }),
    })
    render(<AddComicForm characters={characters} />)

    fillRequiredFields()
    fireEvent.click(screen.getByRole("button", { name: /adicionar hq/i }))

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("HQ já cadastrada")
    })
  })
})
