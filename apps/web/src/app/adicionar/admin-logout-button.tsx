"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function AdminLogoutButton() {
  const router = useRouter()
  const [isLeaving, setIsLeaving] = useState(false)

  const handleLogout = async () => {
    setIsLeaving(true)
    try {
      await fetch("/api/admin/logout", { method: "POST" })
    } finally {
      router.refresh()
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLeaving}
      className="cursor-pointer text-sm font-semibold tracking-wider text-white/70 transition-colors hover:text-white disabled:opacity-50"
    >
      SAIR
    </button>
  )
}
