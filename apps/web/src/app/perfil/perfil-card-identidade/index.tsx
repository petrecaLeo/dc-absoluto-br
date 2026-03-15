"use client"

import Image from "next/image"

import type { AuthUser } from "@/components/header/auth.types"
import { ShareModal } from "@/components/share-modal"
import { UserAvatar } from "@/components/user-avatar"
import { LEVEL_STYLES } from "@/lib/levels"
import { usePerfilCardIdentidade } from "./perfil-card-identidade.hook"

interface PerfilCardIdentidadeProps {
  initialAuthUser: AuthUser
}

function formatTopCharacters(names: string[]): string {
  if (names.length === 0) return ""
  if (names.length === 1) return names[0] ?? ""
  if (names.length === 2) return `${names[0]} e ${names[1]}`
  return `${names.slice(0, -1).join(", ")} e ${names.at(-1)}`
}

export function PerfilCardIdentidade({ initialAuthUser }: PerfilCardIdentidadeProps) {
  const {
    authUser,
    count,
    currentLevel,
    isLoading,
    topCharacterNames,
    joinDate,
    cardUrl,
    openCardInNewTab,
    isShareModalOpen,
    openShareModal,
    closeShareModal,
  } = usePerfilCardIdentidade(initialAuthUser)

  return (
    <>
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
            Identidade
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Veja aqui sua identidade absoluta nesse universo
          </h2>
        </div>

        {isLoading ? (
          <div className="mt-6 space-y-4">
            <div className="h-32 w-full animate-pulse rounded-xl border border-white/10 bg-white/10" />
            <div className="h-14 w-full animate-pulse rounded-xl border border-white/10 bg-white/10" />
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:gap-6">
              <UserAvatar
                name={authUser.name}
                profileImage={authUser.profileImage}
                size="lg"
                className="h-24 w-24 shrink-0 border-white/20 sm:h-28 sm:w-28"
              />

              <div className="min-w-0 flex-1 space-y-2">
                <h3 className="truncate text-lg font-bold text-white">{authUser.name}</h3>

                {currentLevel && (
                  <div className="flex items-center gap-2">
                    <Image
                      src={currentLevel.image}
                      alt={`Moeda ${currentLevel.label}`}
                      width={20}
                      height={20}
                      className="shrink-0"
                    />
                    <span
                      className={`text-sm font-semibold ${LEVEL_STYLES[currentLevel.key].text}`}
                    >
                      {currentLevel.label}
                    </span>
                  </div>
                )}

                <p className="text-sm text-white/70">
                  <span className="font-semibold text-white/90">{count}</span>{" "}
                  {count === 1 ? "HQ lida" : "HQs lidas"} no universo Absolute
                </p>

                <p className="text-sm text-white/50">
                  Membro desde <span className="text-white/70">{joinDate ?? "--/--/----"}</span>
                </p>

                <p className="text-sm text-white/50">
                  {topCharacterNames.length <= 1
                    ? "Personagem mais lido: "
                    : "Personagens mais lidos: "}
                  <span className="font-semibold text-white/80">
                    {topCharacterNames.length > 0
                      ? formatTopCharacters(topCharacterNames)
                      : "nenhum"}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={openCardInNewTab}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-white/70 transition-all duration-300 hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M15 3h6v6" />
                  <path d="M10 14 21 3" />
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                </svg>
                Ver card de perfil
              </button>

              <button
                type="button"
                onClick={openShareModal}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-white/70 transition-all duration-300 hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                Compartilhar card
              </button>
            </div>
          </div>
        )}
      </section>

      <ShareModal isOpen={isShareModalOpen} onClose={closeShareModal} url={cardUrl} />
    </>
  )
}
