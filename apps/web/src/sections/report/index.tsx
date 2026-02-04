"use client"

import Image from "next/image"

import { useReport } from "./report.hook"

export default function Report() {
  const { message, handleMessageChange, status, feedback, handleSubmit, charactersLeft } =
    useReport()

  return (
    <section
      id="report"
      aria-labelledby="report-heading"
      data-fullpage-noheight
      className="relative flex flex-col overflow-hidden lg:flex-row"
      style={{ backgroundColor: "#cc2c2c" }}
    >
      <div className="relative flex w-full flex-col items-center justify-center px-8 py-12 lg:w-[55%] lg:px-16 lg:py-20">
        <div className="animate-scale-in relative w-full max-w-xl">
          <div className="mb-6 flex items-center gap-3 self-start">
            <div className="h-px w-12 bg-white/40" />
            <span className="text-xs font-bold tracking-[0.3em] text-white uppercase">
              Feedback
            </span>
            <div className="h-px w-12 bg-white/40" />
          </div>

          <h2
            id="report-heading"
            className="mb-6 text-4xl leading-tight font-black text-white lg:text-5xl"
          >
            Reportes
          </h2>

          <p className="mb-10 text-lg leading-relaxed text-white">
            Encontrou um link quebrado? O site está com algum bug? Tem alguma sugestão para
            melhorar? Mande sua mensagem, toda ajuda é bem-vinda para manter o catálogo nos trilhos!
          </p>

          <form onSubmit={handleSubmit} className="mb-6">
            <label htmlFor="report-message" className="sr-only">
              Mensagem
            </label>
            <div className="flex flex-col gap-4">
              <div className="relative">
                <textarea
                  id="report-message"
                  placeholder="Descreva o problema ou sugestão..."
                  value={message}
                  onChange={(e) => handleMessageChange(e.target.value)}
                  disabled={status === "loading"}
                  rows={5}
                  maxLength={2000}
                  aria-describedby="report-characters-left"
                  className="animate-border-color-red w-full resize-none rounded-xl border-3 bg-white/10 px-5 py-3 text-lg text-white shadow-sm transition-shadow duration-300 placeholder:text-white focus:shadow-md focus:shadow-red-400/20 focus:outline-none disabled:opacity-50"
                />
                <span
                  id="report-characters-left"
                  className={`absolute right-3 bottom-3 text-xs font-semibold ${
                    charactersLeft < 100 ? "text-yellow-300" : "text-white"
                  }`}
                >
                  {charactersLeft}
                </span>
              </div>
              <button
                type="submit"
                disabled={status === "loading"}
                className="animate-btn-glow-red w-full cursor-pointer rounded-xl bg-linear-to-r from-red-900 via-red-700 to-red-900 px-8 py-3 text-xl font-black tracking-widest text-white uppercase transition-all duration-300 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                {status === "loading" ? "ENVIANDO..." : "ENVIAR REPORTE"}
              </button>
            </div>
          </form>

          <div aria-live="polite" className="min-h-7">
            {status === "success" && (
              <div className="animate-fade-in flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
                <p className="text-sm font-semibold text-green-300">{feedback}</p>
              </div>
            )}
            {status === "error" && (
              <div className="animate-fade-in flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-yellow-400" />
                <p className="text-sm font-semibold text-yellow-300">{feedback}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative hidden w-full lg:block lg:w-[45%]">
        <Image
          src="/images/report/background.webp"
          alt=""
          fill
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to right, #cc2c2c 0%, rgba(204,44,44,0) 50%)",
          }}
        />
      </div>
    </section>
  )
}
