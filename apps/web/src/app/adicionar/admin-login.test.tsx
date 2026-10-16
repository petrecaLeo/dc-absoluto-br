import { beforeEach, describe, expect, it, vi } from "vitest"

import { fireEvent, render, screen, waitFor } from "@/test/utils"
import { AdminLogin } from "./admin-login"

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}))

const mockFetch = vi.fn()
globalThis.fetch = mockFetch as unknown as typeof fetch

function submitLogin() {
  fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: "admin@exemplo.com" } })
  fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: "Senha123" } })
  fireEvent.click(screen.getByRole("button", { name: /entrar/i }))
}

describe("AdminLogin", () => {
  beforeEach(() => {
    mockFetch.mockReset()
    refresh.mockReset()
  })

  it("recarrega a página após o login e não fica preso em 'Entrando...'", async () => {
    mockFetch.mockResolvedValue(Response.json({ success: true }, { status: 200 }))
    render(<AdminLogin />)

    submitLogin()

    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.getByRole("button", { name: "Entrar" })).toBeEnabled())
  })

  it("mostra a mensagem da API quando o login falha e limpa a senha", async () => {
    mockFetch.mockResolvedValue(
      Response.json({ success: false, message: "E-mail ou senha inválidos." }, { status: 401 }),
    )
    render(<AdminLogin />)

    submitLogin()

    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha inválidos.")
    expect(screen.getByLabelText(/senha/i)).toHaveValue("")
    expect(refresh).not.toHaveBeenCalled()
  })
})
