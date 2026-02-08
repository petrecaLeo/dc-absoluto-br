"use client"

import Image from "next/image"
import { createPortal } from "react-dom"

import type { AuthUser } from "@/components/header/auth.types"
import { UserAvatar } from "@/components/user-avatar"
import { usePerfilIdentidade } from "./perfil-identidade.hook"

interface PerfilIdentidadeProps {
  initialAuthUser: AuthUser
}

export function PerfilIdentidade({ initialAuthUser }: PerfilIdentidadeProps) {
  const {
    authUser,
    isModalOpen,
    options,
    status,
    message,
    isSaving,
    canSave,
    accentColor,
    openModal,
    closeModal,
    selectImage,
    saveImage,
  } = usePerfilIdentidade(initialAuthUser)

  const modal =
    isModalOpen && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center px-4">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
              onClick={closeModal}
              aria-hidden="true"
            />

            <div
              role="dialog"
              aria-modal="true"
              className="relative w-full max-w-4xl animate-fade-in-up"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.stopPropagation()
                  closeModal()
                }
              }}
            >
              <div
                className="absolute -inset-[2px] rounded-2xl opacity-80 animate-border-glow"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}, transparent 40%, transparent 60%, ${accentColor})`,
                  backgroundSize: "200% 200%",
                }}
              />

              <div
                className="absolute -inset-4 rounded-3xl blur-2xl opacity-30"
                style={{ backgroundColor: accentColor }}
              />

              <div
                className="relative max-h-[80svh] overflow-hidden rounded-2xl"
                style={{
                  background:
                    "linear-gradient(160deg, rgba(10,10,26,0.97) 0%, rgba(10,10,26,0.99) 50%, rgba(10,10,26,0.97) 100%)",
                }}
              >
                <div
                  className="absolute inset-0 opacity-[0.07]"
                  style={{
                    background: `radial-gradient(ellipse at top left, ${accentColor} 0%, transparent 50%), radial-gradient(ellipse at bottom right, ${accentColor} 0%, transparent 50%)`,
                  }}
                />

                <div className="relative max-h-[80svh] overflow-y-auto overflow-x-hidden px-6 py-6 perfil-modal-scroll sm:px-8 sm:py-8">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm text-gray-400 transition-colors hover:border-white/30 hover:text-white"
                    aria-label="Fechar"
                  >
                    ✕
                  </button>

                  <div className="mb-4">
                    <div className="mb-2 flex items-center gap-3">
                      <div
                        className="h-px w-8 transition-colors duration-300"
                        style={{ backgroundColor: accentColor }}
                      />
                      <span
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: accentColor }}
                      >
                        Foto do perfil
                      </span>
                    </div>

                    <h3 className="mb-2 text-2xl font-black uppercase tracking-wide text-white">
                      Escolha seu herói
                    </h3>
                    <p className="text-sm leading-relaxed text-gray-400">
                      Selecione uma das imagens abaixo para personalizar seu perfil.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    {options.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => selectImage(option.id)}
                        className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-2 text-left transition-all ${
                          option.isSelected
                            ? "border-white/50 bg-white/10 shadow-[0_0_20px_rgba(4,118,242,0.35)]"
                            : "border-white/10 bg-white/5 hover:border-white/30"
                        }`}
                      >
                        <div className="relative aspect-square w-full overflow-hidden rounded-xl">
                          <Image
                            src={option.src}
                            alt={`Foto de ${option.label}`}
                            fill
                            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 200px"
                            className="object-cover"
                          />
                        </div>
                        {option.isSelected && (
                          <span className="absolute top-3 right-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-dc-black">
                            ✓
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {status === "error" && message && (
                    <p role="alert" className="mt-4 text-sm text-red-400">
                      {message}
                    </p>
                  )}

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="inline-flex select-none cursor-pointer items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-white/60 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white focus:outline-none"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => void saveImage()}
                      disabled={!canSave}
                      className="inline-flex select-none cursor-pointer items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-white/60 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="relative z-10">
                        {isSaving ? "Salvando..." : "Salvar foto"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Perfil</p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
            <UserAvatar
              name={authUser.name}
              profileImage={authUser.profileImage}
              size="lg"
              className="border-white/20"
            />
            <div>
              <h1 className="line-clamp-1 text-2xl font-bold text-white sm:text-3xl">
                {authUser.name}
              </h1>
              <p className="mt-1 line-clamp-1 text-white/70">{authUser.email}</p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <button
              type="button"
              onClick={openModal}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white/70 transition-colors hover:border-white/40 hover:text-white"
            >
              Editar foto
            </button>
            {status === "success" && message && (
              <p role="status" className="text-xs font-semibold text-emerald-300">
                {message}
              </p>
            )}
          </div>
        </div>
      </section>
      {modal}
    </>
  )
}
