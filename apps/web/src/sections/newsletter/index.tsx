"use client"

import Image from "next/image"

import { useNewsletter } from "./newsletter.hook"

export default function Newsletter() {
  const { email, setEmail, status, message, handleSubmit } = useNewsletter()

  return (
    <section
      id="newsletter"
      aria-labelledby="newsletter-heading"
      className="relative flex !min-h-0 flex-col overflow-hidden lg:!min-h-screen lg:h-screen lg:flex-row"
      style={{ backgroundColor: "#f9f2e2" }}
    >
      <div className="relative hidden w-full lg:block lg:w-[45%]">
        <Image
          src="/images/newsletter/background.webp"
          alt=""
          fill
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to left, #f9f2e2 0%, rgba(249,242,226,0) 50%)",
          }}
        />
      </div>

      <div className="relative flex w-full flex-col items-center justify-center px-8 py-12 lg:w-[55%] lg:px-16 lg:py-20">
        <div className="animate-scale-in relative w-full max-w-xl">
          <div className="mb-6 flex items-center gap-3 self-start">
            <div className="h-px w-12 bg-cyan-900/40" />
            <span className="text-xs font-bold tracking-[0.3em] text-cyan-900 uppercase">
              Newsletter
            </span>
            <div className="h-px w-12 bg-cyan-900/40" />
          </div>

          <h2
            id="newsletter-heading"
            className="mb-6 text-4xl leading-tight font-black text-dc-dark lg:text-5xl"
          >
            Não perca
            <br />
            <span className="animate-gradient-shift bg-linear-to-r from-lime-600 via-blue-600 to-lime-600 bg-clip-text text-transparent">
              nenhum lançamento
            </span>
          </h2>

          <p className="mb-10 text-lg leading-relaxed text-dc-dark/70">
            Receba alertas sobre novos lançamentos, traduções e novidades do universo Absolute da DC
            direto no seu e-mail.
          </p>

          <form onSubmit={handleSubmit} className="mb-6">
            <label htmlFor="newsletter-email" className="sr-only">
              E-mail
            </label>
            <div className="flex flex-col gap-4">
              <input
                id="newsletter-email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "loading"}
                autoComplete="email"
                className="animate-border-color w-full rounded-xl border-3 bg-white px-5 py-3 text-lg text-dc-dark shadow-sm transition-shadow duration-300 placeholder:text-dc-dark/60 focus:shadow-md focus:shadow-lime-500/20 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="animate-btn-glow w-full cursor-pointer rounded-xl bg-linear-to-r from-lime-600 via-blue-600 to-green-500 px-8 py-3 text-xl font-black tracking-widest text-white uppercase transition-all duration-300 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                {status === "loading" ? "CARREGANDO" : "INSCREVER-SE"}
              </button>
            </div>
          </form>

          <div aria-live="polite" className="min-h-7">
            {status === "success" && (
              <div className="animate-fade-in flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                <p className="text-sm font-semibold text-green-700">{message}</p>
              </div>
            )}
            {status === "error" && (
              <div className="animate-fade-in flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                <p className="text-sm font-semibold text-red-600">{message}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
