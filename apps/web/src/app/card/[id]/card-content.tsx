"use client"

import Image from "next/image"
import Link from "next/link"

import { UserAvatar } from "@/components/user-avatar"
import { LEVEL_STYLES } from "@/lib/levels"
import { useCardBackground } from "./card-background.hook"
import { useCardPage } from "./card-page.hook"

function formatTopCharacters(names: string[]): string {
  if (names.length === 0) return ""
  if (names.length === 1) return names[0] ?? ""
  if (names.length === 2) return `${names[0]} e ${names[1]}`
  return `${names.slice(0, -1).join(", ")} e ${names.at(-1)}`
}

export function CardContent({ userId }: { userId: string }) {
  const { canvasRef } = useCardBackground()
  const {
    profile,
    currentLevel,
    joinDate,
    isLoading,
    isError,
    copyStatus,
    shareWhatsApp,
    copyLink,
  } = useCardPage(userId)

  return (
    <div className="relative min-h-svh bg-dc-black">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        tabIndex={-1}
        className="pointer-events-none fixed inset-0 h-full w-full"
      />

      <div className="relative z-10 flex min-h-svh flex-col items-center justify-center px-4 py-12">
        {isLoading ? (
          <div className="w-full max-w-lg animate-pulse space-y-6">
            <div className="h-80 rounded-2xl border border-white/10 bg-white/5" />
          </div>
        ) : isError || !profile ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Perfil não encontrado</h1>
            <p className="mt-2 text-white/60">Este card de perfil não existe ou foi removido.</p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold uppercase tracking-widest text-white/70 transition-colors hover:border-white/40 hover:text-white"
            >
              Voltar à página inicial
            </Link>
          </div>
        ) : (
          <>
            <div className="w-full max-w-lg">
              <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-1 shadow-2xl shadow-dc-blue/10 backdrop-blur-xl transition-all duration-500 hover:border-white/20 hover:shadow-dc-blue/20">
                <div className="absolute inset-0 bg-gradient-to-br from-dc-blue/5 via-transparent to-red-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative rounded-xl bg-gradient-to-br from-[rgba(10,10,26,0.95)] to-[rgba(10,10,26,0.98)] p-8">
                  <div className="absolute top-0 left-1/2 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-dc-blue/50 to-transparent" />

                  <div className="flex flex-col items-center text-center">
                    <div className="relative">
                      <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-dc-blue/30 to-red-500/30 blur-lg opacity-60 transition-opacity duration-500 group-hover:opacity-100" />
                      <div className="relative">
                        <UserAvatar
                          name={profile.name}
                          profileImage={profile.profileImage}
                          size="lg"
                          className="h-40 w-40 border-2 border-white/20 text-4xl sm:h-48 sm:w-48"
                        />
                        {currentLevel && (
                          <div
                            className={`absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full border-2 border-dc-black p-1.5 shadow-lg ${LEVEL_STYLES[currentLevel.key].card}`}
                          >
                            <Image
                              src={currentLevel.image}
                              alt={`Moeda ${currentLevel.label}`}
                              width={70}
                              height={70}
                              className="shrink-0"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <h1 className="mt-8 text-2xl font-black uppercase tracking-wide text-white sm:text-3xl">
                      {profile.name.split(" ")[0]}
                    </h1>

                    {currentLevel && (
                      <div className="mt-3 flex items-center justify-center gap-3">
                        <span
                          className={`h-px w-12 ${LEVEL_STYLES[currentLevel.key].dot} opacity-40`}
                        />
                        <span
                          className={`text-sm font-bold uppercase tracking-widest ${LEVEL_STYLES[currentLevel.key].text}`}
                        >
                          Nível {currentLevel.label}
                        </span>
                        <span
                          className={`h-px w-12 ${LEVEL_STYLES[currentLevel.key].dot} opacity-40`}
                        />
                      </div>
                    )}

                    <div className="mt-6 w-full space-y-3">
                      <div className="flex items-center justify-center gap-2 text-sm text-white/70">
                        <svg
                          className="h-4 w-4 text-dc-blue"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                        <span>
                          <span className="font-semibold text-white">{profile.readCount}</span>{" "}
                          {profile.readCount === 1 ? "HQ lida" : "HQs lidas"}
                        </span>
                      </div>

                      {joinDate && (
                        <div className="flex items-center justify-center gap-2 text-sm text-white/70">
                          <svg
                            className="h-4 w-4 text-dc-blue"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span>
                            Membro desde <span className="text-white">{joinDate}</span>
                          </span>
                        </div>
                      )}

                      {profile.topCharacters.length > 0 && (
                        <div className="flex items-center justify-center gap-2 text-sm text-white/70">
                          <svg
                            className="h-4 w-4 text-dc-blue"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          <span>
                            {profile.topCharacters.length === 1
                              ? "Personagem mais lido: "
                              : "Personagens mais lidos: "}
                            <span className="font-semibold text-white">
                              {formatTopCharacters(profile.topCharacters)}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-dc-blue/30 to-transparent" />
                </div>
              </div>

              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={shareWhatsApp}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-3 text-sm font-semibold uppercase tracking-widest text-green-300 transition-all duration-300 hover:border-green-500/50 hover:bg-green-500/20"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Compartilhar
                </button>

                <button
                  type="button"
                  onClick={() => void copyLink()}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold uppercase tracking-widest text-white/70 transition-all duration-300 hover:border-white/30 hover:bg-white/10 hover:text-white"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  {copyStatus === "copied" ? "Copiado!" : "Copiar link"}
                </button>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-sm text-white/50">
                Inicie sua leitura nesse universo absoluto também!
              </p>
              <Link
                href="/"
                className="mt-3 inline-block rounded-xl bg-gradient-to-r from-dc-blue to-blue-700 px-8 py-3 text-sm font-bold uppercase tracking-widest text-white transition-all duration-300 hover:brightness-110"
              >
                Página inicial
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
