import { beforeEach, describe, expect, it, vi } from "vitest"

import { axe, fireEvent, render, screen, waitFor } from "@/test/utils"

import Newsletter from "./index"

const mockFetch = vi.fn()
globalThis.fetch = mockFetch as unknown as typeof fetch

describe("Newsletter Section", () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it("renders the main heading", () => {
    render(<Newsletter />)

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(/nenhum lançamento/i)
  })

  it("renders the email input and submit button", () => {
    render(<Newsletter />)

    expect(screen.getByLabelText("E-mail")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /inscrever-se/i })).toBeInTheDocument()
  })

  it("has accessible section with aria-labelledby", () => {
    render(<Newsletter />)

    const section = screen.getByRole("region")
    const heading = screen.getByRole("heading", { level: 2 })

    expect(heading).toHaveAttribute("id", "newsletter-heading")
    expect(section).toHaveAttribute("aria-labelledby", "newsletter-heading")
  })

  it("shows error when submitting empty email", async () => {
    render(<Newsletter />)

    fireEvent.click(screen.getByRole("button", { name: /inscrever-se/i }))

    await waitFor(() => {
      expect(screen.getByText("Por favor, insira seu e-mail")).toBeInTheDocument()
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("submits email and shows success message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: "Inscrito com sucesso" }),
    })

    render(<Newsletter />)

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "teste@exemplo.com" },
    })
    fireEvent.click(screen.getByRole("button", { name: /inscrever-se/i }))

    await waitFor(() => {
      expect(screen.getByText("Inscrito com sucesso")).toBeInTheDocument()
    })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/newsletter/subscribe"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "teste@exemplo.com" }),
      }),
    )
  })

  it("shows error message on network failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"))

    render(<Newsletter />)

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "teste@exemplo.com" },
    })
    fireEvent.click(screen.getByRole("button", { name: /inscrever-se/i }))

    await waitFor(() => {
      expect(screen.getByText("Erro de conexão. Tente novamente.")).toBeInTheDocument()
    })
  })

  it("shows error message on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, message: "Email inválido" }),
    })

    render(<Newsletter />)

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "teste@exemplo.com" },
    })
    fireEvent.click(screen.getByRole("button", { name: /inscrever-se/i }))

    await waitFor(() => {
      expect(screen.getByText("Email inválido")).toBeInTheDocument()
    })
  })

  describe("Acessibilidade", () => {
    it("should have no accessibility violations", async () => {
      const { container } = render(<Newsletter />)
      const results = await axe(container)

      expect(results).toHaveNoViolations()
    })
  })
})
