"use client"

import { useCopyright } from "./copyright.hook"

export function Copyright() {
  const { canvasRef } = useCopyright()

  return (
    <footer
      data-fullpage-noheight
      className="relative w-full overflow-hidden bg-dc-black py-6 md:py-10"
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
      />

      <div className="relative z-10 mx-auto max-w-2xl px-4 text-center">
        <p className="text-sm text-neutral-400">
          &copy; {new Date().getFullYear()} DC Absoluto BR. Todos os direitos reservados.
        </p>

        <p className="mt-2 text-xs text-neutral-500">
          Projeto pessoal sem fins lucrativos. Todas as HQs, personagens e marcas pertencem a seus
          respectivos detentores. Traduções feitas pelo{" "}
          <a
            href="https://site.ds-club.net/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-dc-blue transition-colors hover:text-white"
          >
            Darkseid Club
          </a>
          .
        </p>
      </div>
    </footer>
  )
}
