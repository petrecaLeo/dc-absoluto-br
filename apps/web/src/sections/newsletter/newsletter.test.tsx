import { beforeEach, describe, expect, it, vi } from "vitest"

import { axe, fireEvent, render, screen, waitFor } from "@/test/utils"
import { clearStoredUser, storeUser } from "@/components/header/auth.storage"

import Newsletter from "./index"

const mockFetch = vi.fn()
globalThis.fetch = mockFetch as unknown as typeof fetch
const mockUser = { id: "user-1", name: "Bruce Wayne", email: "bruce@wayne.com" }

describe("Newsletter Section", () => {
  beforeEach(() => {
    mockFetch.mockReset()
    clearStoredUser()
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

  it("opens login modal when unauthenticated and clicking submit", async () => {
    render(<Newsletter />)

    fireEvent.click(screen.getByRole("button", { name: /inscrever-se/i }))

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument()
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("prefills and disables the email input for authenticated users", async () => {
    storeUser(mockUser)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ subscribed: false }),
    })

    render(<Newsletter />)

    const input = screen.getByLabelText("E-mail")

    await waitFor(() => {
      expect(input).toHaveValue(mockUser.email)
    })

    expect(input).toBeDisabled()
  })

  it("disables the form and shows a message when already subscribed", async () => {
    storeUser(mockUser)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ subscribed: true }),
    })

    render(<Newsletter />)

    await waitFor(() => {
      expect(
        screen.getByText("Não se preocupe, você já está inscrito na newsletter."),
      ).toBeInTheDocument()
    })

    expect(screen.getByLabelText("E-mail")).toBeDisabled()
    expect(screen.getByRole("button", { name: /inscrever-se/i })).toBeDisabled()
  })

  it("submits email and shows success message", async () => {
    storeUser(mockUser)
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subscribed: false }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: "Inscrito com sucesso" }),
      })

    render(<Newsletter />)

    const button = screen.getByRole("button", { name: /inscrever-se/i })
    await waitFor(() => {
      expect(button).toBeEnabled()
    })

    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText("Inscrito com sucesso")).toBeInTheDocument()
    })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/newsletter/subscribe"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: mockUser.email }),
      }),
    )
  })

  it("shows error message on network failure", async () => {
    storeUser(mockUser)
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subscribed: false }),
      })
      .mockRejectedValueOnce(new Error("Network error"))

    render(<Newsletter />)

    const button = screen.getByRole("button", { name: /inscrever-se/i })
    await waitFor(() => {
      expect(button).toBeEnabled()
    })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText("Erro de conexão. Tente novamente.")).toBeInTheDocument()
    })
  })

  it("shows error message on non-ok response", async () => {
    storeUser(mockUser)
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subscribed: false }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, message: "Email inválido" }),
      })

    render(<Newsletter />)

    const button = screen.getByRole("button", { name: /inscrever-se/i })
    await waitFor(() => {
      expect(button).toBeEnabled()
    })
    fireEvent.click(button)

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
