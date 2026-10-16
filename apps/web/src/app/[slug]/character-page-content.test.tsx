import { type ReactNode, act } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { AuthUser } from "@/components/header/auth.types"
import { fireEvent, render, screen, waitFor } from "@/test/utils"
import type { Character, Comic } from "@dc-absoluto/shared-types"

const authState = vi.hoisted(() => {
  let listener: ((user: AuthUser | null) => void) | null = null

  return {
    storedUser: null as AuthUser | null,
    emit(user: AuthUser | null) {
      listener?.(user)
    },
    reset() {
      listener = null
      this.storedUser = null
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
  getStoredUser: () => authState.storedUser,
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

const comicsWithMixedReleaseOrder: Comic[] = [
  {
    ...comic,
    id: "comic-1",
    title: "Batman #1",
    issueNumber: 1,
    releaseDate: new Date("2025-02-01T00:00:00.000Z"),
  },
  {
    ...comic,
    id: "comic-2",
    title: "Batman #2",
    issueNumber: 2,
    releaseDate: new Date("2025-01-01T00:00:00.000Z"),
  },
  {
    ...comic,
    id: "comic-3",
    title: "Batman #3",
    issueNumber: 3,
    releaseDate: new Date("2025-03-01T00:00:00.000Z"),
  },
]

const theme = {
  image: "/images/batman.jpg",
  logo: "/images/batman-logo.png",
  gradientFrom: "#111111",
  gradientTo: "#333333",
  accentColor: "#0099ff",
}

function setStoredUser(nextUser: AuthUser | null) {
  authState.storedUser = nextUser
}

describe("CharacterPageContent auth sync", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.reset()
    setStoredUser(null)
    authState.getReadComicsByCharacterMock.mockResolvedValue({ data: [] })
  })

  it("hides authenticated controls when the browser has no stored session", () => {
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

    setStoredUser(user)
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

    setStoredUser(null)
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

    setStoredUser(user)
    await act(async () => {
      authState.emit(user)
    })

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /marcar como lida/i })).toBeInTheDocument()
    })

    expect(screen.queryByText("Status de leitura:")).not.toBeInTheDocument()
  })
})

describe("CharacterPageContent sorting", () => {
  it("uses issue number on the initial render and keeps date sorting for explicit actions", () => {
    act(() => {
      render(
        <CharacterPageContent
          slug="batman"
          character={character}
          comics={comicsWithMixedReleaseOrder}
          total={comicsWithMixedReleaseOrder.length}
          theme={theme}
          hasError={false}
          authUser={null}
          readComics={[]}
        />,
      )
    })

    const getComicTitles = () =>
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)

    expect(getComicTitles()).toEqual(["Batman #1", "Batman #2", "Batman #3"])

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Mais recente" }))
    })
    expect(getComicTitles()).toEqual(["Batman #3", "Batman #1", "Batman #2"])

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Mais antigo" }))
    })
    expect(getComicTitles()).toEqual(["Batman #2", "Batman #1", "Batman #3"])
  })
})
