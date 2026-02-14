import { redirect } from "next/navigation"

import { getServerAuthUser } from "@/components/header/auth.server"
import { PerfilCardIdentidade } from "./perfil-card-identidade"
import { PerfilConquistas } from "./perfil-conquistas"
import { PerfilHeader } from "./perfil-header"
import { PerfilHqsLidas } from "./perfil-hqs-lidas"
import { PerfilIdentidade } from "./perfil-identidade"
import { PerfilSenha } from "./perfil-senha"

export default async function PerfilPage() {
  const authUser = await getServerAuthUser()

  if (!authUser) {
    redirect("/")
  }

  return (
    <div className="min-h-svh bg-dc-black text-white">
      <PerfilHeader />
      <main className="mx-auto max-w-7xl space-y-6 px-4 pt-28 pb-16 sm:px-6">
        <PerfilIdentidade initialAuthUser={authUser} />
        <PerfilConquistas />
        <PerfilCardIdentidade initialAuthUser={authUser} />
        <PerfilHqsLidas />
        <PerfilSenha />
      </main>
    </div>
  )
}
