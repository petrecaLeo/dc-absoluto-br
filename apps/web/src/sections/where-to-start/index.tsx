import Image from "next/image"

const DRIVE_URL = "https://drive.google.com/file/d/1-8SAoB2wPI3rEH3bdwMjWTOHKooxQlGQ/view"
const READ_ONLINE_URL = "/ler/dc-all-in"
const DOWNLOAD_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/proxy/download?url=${encodeURIComponent(DRIVE_URL)}`

export default function WhereToStart() {
  return (
    <section
      id="where-to-start"
      aria-labelledby="where-to-start-heading"
      className="relative h-svh w-full"
    >
      <Image
        src="/images/start/background.webp"
        alt=""
        fill
        className="object-cover object-center"
        priority={false}
      />

      <div className="relative z-10 flex h-full items-center justify-center px-4">
        <div className="relative">
          <div
            className="absolute -inset-0.5 rounded-2xl opacity-80 animate-border-glow"
            style={{
              background:
                "linear-gradient(135deg, #e62429, transparent 40%, transparent 60%, #e62429)",
              backgroundSize: "200% 200%",
            }}
          />

          <div className="absolute -inset-4 rounded-3xl bg-dc-red/30 blur-2xl" />

          <div className="relative rounded-2xl bg-black/80 max-w-3xl p-8 text-center backdrop-blur-sm">
            <h2 id="where-to-start-heading" className="mb-6 text-5xl font-bold text-white">
              Por onde Começar
            </h2>

            <p className="mb-10 text-lg text-gray-300">
              A DC All In é uma iniciativa da DC que reorganiza seu universo de heróis em uma nova
              linha editorial. Para começar a acompanhar, leia ou baixe a edição especial{" "}
              <strong>DC All In</strong> abaixo.
            </p>

            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-6">
              <div className="relative w-full text-black sm:w-auto">
                <div
                  className="absolute -inset-0.5 rounded-lg opacity-80 animate-border-glow"
                  style={{
                    background:
                      "linear-gradient(135deg, #e62429, transparent 40%, transparent 60%, #e62429)",
                    backgroundSize: "200% 200%",
                  }}
                />
                <a
                  href={READ_ONLINE_URL}
                  className="relative block w-full rounded-lg bg-white px-8 py-3 text-center text-sm font-bold tracking-wider uppercase sm:w-auto"
                >
                  LER ONLINE
                </a>
              </div>

              <div className="relative w-full sm:w-auto">
                <div
                  className="absolute -inset-0.5 rounded-lg opacity-80 animate-border-glow"
                  style={{
                    background:
                      "linear-gradient(135deg, #e62429, transparent 40%, transparent 60%, #e62429)",
                    backgroundSize: "200% 200%",
                  }}
                />
                <a
                  href={DOWNLOAD_URL}
                  download
                  className="relative block w-full rounded-lg bg-black px-8 py-3 text-center text-sm font-bold tracking-wider text-white uppercase sm:w-auto"
                >
                  DOWNLOAD
                </a>
              </div>
            </div>

            <p className="mt-6 text-sm text-white italic">
              * O download pode demorar um pouco para iniciar, mas não se preocupe, é normal e logo
              você estará lendo!
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
