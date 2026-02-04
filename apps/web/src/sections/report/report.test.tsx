import { beforeEach, describe, expect, it, vi } from "vitest"

import { axe, fireEvent, render, screen, waitFor } from "@/test/utils"

import Report from "./index"

const mockFetch = vi.fn()
globalThis.fetch = mockFetch as unknown as typeof fetch

describe("Report Section", () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it("renders the main heading", () => {
    render(<Report />)

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(/reportes/i)
  })

  it("renders the textarea and submit button", () => {
    render(<Report />)

    expect(screen.getByLabelText("Mensagem")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /enviar reporte/i })).toBeInTheDocument()
  })

  it("has accessible section with aria-labelledby", () => {
    render(<Report />)

    const section = screen.getByRole("region")
    const heading = screen.getByRole("heading", { level: 2 })

    expect(heading).toHaveAttribute("id", "report-heading")
    expect(section).toHaveAttribute("aria-labelledby", "report-heading")
  })

  it("shows error when submitting empty message", async () => {
    render(<Report />)

    fireEvent.click(screen.getByRole("button", { name: /enviar reporte/i }))

    await waitFor(() => {
      expect(
        screen.getByText("Por favor, escreva sua mensagem antes de enviar."),
      ).toBeInTheDocument()
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("submits message and shows success feedback", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: "Reporte enviado com sucesso!" }),
    })

    render(<Report />)

    fireEvent.change(screen.getByLabelText("Mensagem"), {
      target: { value: "O link está quebrado" },
    })
    fireEvent.click(screen.getByRole("button", { name: /enviar reporte/i }))

    await waitFor(() => {
      expect(screen.getByText("Reporte enviado com sucesso!")).toBeInTheDocument()
    })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/report/send"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ message: "O link está quebrado" }),
      }),
    )
  })

  it("shows error message on network failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"))

    render(<Report />)

    fireEvent.change(screen.getByLabelText("Mensagem"), {
      target: { value: "Teste" },
    })
    fireEvent.click(screen.getByRole("button", { name: /enviar reporte/i }))

    await waitFor(() => {
      expect(screen.getByText("Erro de conexão. Tente novamente.")).toBeInTheDocument()
    })
  })

  it("shows character counter", () => {
    render(<Report />)

    expect(screen.getByText("2000")).toBeInTheDocument()
  })

  it("updates character counter on input", () => {
    render(<Report />)

    fireEvent.change(screen.getByLabelText("Mensagem"), {
      target: { value: "Hello" },
    })

    expect(screen.getByText("1995")).toBeInTheDocument()
  })

  describe("Acessibilidade", () => {
    it("should have no accessibility violations", async () => {
      const { container } = render(<Report />)
      const results = await axe(container)

      expect(results).toHaveNoViolations()
    })
  })
})
