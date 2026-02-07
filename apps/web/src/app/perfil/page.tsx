import { redirect } from "next/navigation"

import { getServerAuthUser } from "@/components/header/auth.server"
import { PerfilHeader } from "./perfil-header"
import { PerfilConquistas } from "./perfil-conquistas"
import { PerfilHqsLidas } from "./perfil-hqs-lidas"

export default async function PerfilPage() {
  const authUser = await getServerAuthUser()

  if (!authUser) {
    redirect("/")
  }

  return (
    <div className="min-h-svh bg-dc-black text-white">
      <PerfilHeader />
      <main className="mx-auto max-w-7xl space-y-6 px-4 pt-28 pb-16 sm:px-6">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Perfil</p>
          <h1 className="mt-3 line-clamp-1 text-2xl font-bold text-white sm:text-3xl">
            {authUser.name}
          </h1>
          <p className="mt-1 line-clamp-1 text-white/70">{authUser.email}</p>
        </section>
        <PerfilConquistas />
        <PerfilHqsLidas />
      </main>
    </div>
  )
}
