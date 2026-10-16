import type { Character } from "@dc-absoluto/shared-types"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { getServerAdminSession } from "@/components/header/auth.server"
import { getCharactersUncached } from "@/services/characters"
import { AddComicForm } from "./add-comic-form"
import { AdminLogin } from "./admin-login"
import { AdminLogoutButton } from "./admin-logout-button"

export const metadata: Metadata = {
  title: "Adicionar HQ",
  robots: { index: false, follow: false },
}

async function loadCharacters(): Promise<Character[] | null> {
  try {
    const { data } = await getCharactersUncached()
    return data
  } catch {
    return null
  }
}

export default async function AdicionarPage() {
  // A sessão de admin é conferida no servidor: sem ela, o formulário nem chega ao navegador.
  const adminSession = await getServerAdminSession()
  const characters = adminSession ? await loadCharacters() : null

  return (
    <div className="min-h-svh bg-dc-black text-white">
      <header className="border-b border-white/5 bg-dc-black/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="shrink-0">
            <Image
              src="/images/logo.png"
              alt="DC Absoluto BR"
              width={140}
              height={46}
              className="h-10 w-auto"
              priority
            />
          </Link>
          {adminSession && <AdminLogoutButton />}
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="mb-2 text-3xl font-black uppercase tracking-wide">Adicionar HQ</h1>

        {adminSession ? (
          <>
            <p className="mb-8 text-sm text-white/50">Conectado como {adminSession.email}</p>
            {characters ? (
              <AddComicForm characters={characters} />
            ) : (
              <p role="alert" className="text-sm text-red-400">
                Não foi possível carregar os personagens. Recarregue a página.
              </p>
            )}
          </>
        ) : (
          <div className="mt-6">
            <AdminLogin />
          </div>
        )}
      </main>
    </div>
  )
}
