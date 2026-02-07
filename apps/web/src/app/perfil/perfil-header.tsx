"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { clearStoredUser } from "@/components/header/auth.storage"

export function PerfilHeader() {
  const router = useRouter()

  const handleLogout = () => {
    clearStoredUser()
    router.push("/")
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-dc-black/60 backdrop-blur-xl border-b border-white/5">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
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

        <button
          type="button"
          onClick={handleLogout}
          className="group relative cursor-pointer text-sm font-semibold tracking-wider text-white/80 transition-colors duration-150 hover:text-white"
        >
          SAIR
          <span className="absolute -bottom-1 right-0 h-0.5 w-0 bg-dc-blue shadow-[0_0_8px_2px_rgba(4,118,242,0.6)] transition-all duration-150 group-hover:w-full" />
        </button>
      </div>
    </header>
  )
}
