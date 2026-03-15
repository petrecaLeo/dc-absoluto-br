import { type ReactNode, act } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AUTH_COOKIE_KEY, encodeAuthCookie } from "@/components/header/auth.cookie"
import type { AuthUser } from "@/components/header/auth.types"
import { render, screen, waitFor } from "@/test/utils"
import type { Character, Comic } from "@dc-absoluto/shared-types"

const authState = vi.hoisted(() => {
  let listener: ((user: AuthUser | null) => void) | null = null

  return {
    emit(user: AuthUser | null) {
      listener?.(user)
    },
    reset() {
      listener = null
    },
    subscribeMock: vi.fn((callback: (user: AuthUser | null) => void) => {
      listener = callback
      return () => {
        if (listener === callback) {
          listener = null
        }
      }
    }),
    getReadComicsByCharacterMock: vi.fn(),
    getProgressMock: vi.fn(() => null),
  }
})

vi.mock("next/image", () => ({
  default: function MockImage(props: { alt: string; src: string; [key: string]: unknown }) {
    const { alt, src, fill: _fill, priority: _priority, ...rest } = props
    return <img {...rest} src={src} alt={alt} />
  },
}))

vi.mock("next/link", () => ({
  default: function MockLink(props: { href: string; children: ReactNode; [key: string]: unknown }) {
    const { href, children, ...rest } = props
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    )
  },
}))

vi.mock("@/components/header/auth.storage", () => ({
  subscribeAuthChanges: authState.subscribeMock,
}))

vi.mock("@/services/read-comics.client", () => ({
  getReadComicsByCharacter: authState.getReadComicsByCharacterMock,
}))

vi.mock("@/services/reading-progress", () => ({
  readingProgress: {
    getProgress: authState.getProgressMock,
    setProgress: vi.fn(),
    clearProgress: vi.fn(),
  },
}))

import { CharacterPageContent } from "./character-page-content"

const user: AuthUser = {
  id: "user-1",
  name: "Bruce Wayne",
  email: "bruce@wayneenterprises.com",
  profileImage: null,
}

const character: Character = {
  id: "character-1",
  slug: "batman",
  name: "Batman",
  alias: "Bruce Wayne",
  rating: 5,
  upvotes: 100,
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  updatedAt: new Date("2025-01-01T00:00:00.000Z"),
}

const comic: Comic = {
  id: "comic-1",
  title: "Batman #1",
  universe: "absolute",
  issueNumber: 1,
  downloadUrl: "https://example.com/batman-1.cbr",
  releaseDate: new Date("2025-02-01T00:00:00.000Z"),
  createdAt: new Date("2025-02-01T00:00:00.000Z"),
  updatedAt: new Date("2025-02-01T00:00:00.000Z"),
}

const theme = {
  image: "/images/batman.jpg",
  logo: "/images/batman-logo.png",
  gradientFrom: "#111111",
  gradientTo: "#333333",
  accentColor: "#0099ff",
}

function setAuthCookie(nextUser: AuthUser | null) {
  document.cookie = `${AUTH_COOKIE_KEY}=; Max-Age=0; Path=/`

  if (nextUser) {
    document.cookie = `${AUTH_COOKIE_KEY}=${encodeAuthCookie(nextUser)}; Path=/`
  }
}

describe("CharacterPageContent auth sync", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.reset()
    setAuthCookie(null)
    authState.getReadComicsByCharacterMock.mockResolvedValue({ data: [] })
  })

  it("hides authenticated controls when the current cookie is logged out", () => {
    render(
      <CharacterPageContent
        slug="batman"
        character={character}
        comics={[comic]}
        total={1}
        theme={theme}
        hasError={false}
        authUser={user}
        readComics={[{ comicId: comic.id, readAt: "2026-03-10T00:00:00.000Z" }]}
      />,
    )

    expect(screen.queryByText("Status de leitura:")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /marcar como lida/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/Lido em:/i)).not.toBeInTheDocument()
  })

  it("reloads read state after login and clears it again on logout", async () => {
    authState.getReadComicsByCharacterMock.mockResolvedValue({
      data: [{ comicId: comic.id, readAt: "2026-03-11T00:00:00.000Z" }],
    })

    render(
      <CharacterPageContent
        slug="batman"
        character={character}
        comics={[comic]}
        total={1}
        theme={theme}
        hasError={false}
        authUser={null}
        readComics={[]}
      />,
    )

    expect(screen.queryByRole("button", { name: /marcar como lida/i })).not.toBeInTheDocument()

    setAuthCookie(user)
    await act(async () => {
      authState.emit(user)
    })

    await waitFor(() => {
      expect(authState.getReadComicsByCharacterMock).toHaveBeenCalledWith("batman")
    })

    await waitFor(() => {
      expect(screen.getByText("Status de leitura:")).toBeInTheDocument()
    })

    expect(screen.getByText(/Lido em:/i)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /marcar como lida/i })).not.toBeInTheDocument()

    setAuthCookie(null)
    await act(async () => {
      authState.emit(null)
    })

    await waitFor(() => {
      expect(screen.queryByText("Status de leitura:")).not.toBeInTheDocument()
    })

    expect(screen.queryByText(/Lido em:/i)).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /marcar como lida/i })).not.toBeInTheDocument()
  })

  it("restores the mark-as-read action after login when there are no read comics yet", async () => {
    render(
      <CharacterPageContent
        slug="batman"
        character={character}
        comics={[comic]}
        total={1}
        theme={theme}
        hasError={false}
        authUser={null}
        readComics={[]}
      />,
    )

    setAuthCookie(user)
    await act(async () => {
      authState.emit(user)
    })

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /marcar como lida/i })).toBeInTheDocument()
    })

    expect(screen.queryByText("Status de leitura:")).not.toBeInTheDocument()
  })
})
