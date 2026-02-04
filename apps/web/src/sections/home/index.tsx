"use client"

import Image from "next/image"

import { useHome } from "./home.hook"
import { LatestLaunch, type LatestComic } from "./latest-launch"

interface HomeProps {
  latestComic: LatestComic | null
}

export default function Home({ latestComic }: HomeProps) {
  const { scrollToCharacters } = useHome()

  return (
    <section aria-label="Início" className="relative h-svh overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/home/home-1.webp"
          alt="Personagens da DC Comics"
          fill
          priority
          className="hidden object-cover object-center lg:block"
        />
        <Image
          src="/images/home/home-2.webp"
          alt="Personagens da DC Comics"
          fill
          priority
          className="object-cover object-center lg:hidden"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(to_top,_#00002b_0%,_transparent_70%)] sm:bg-[linear-gradient(135deg,_transparent_55%,_#00002b_76%)]" />

      <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-0 text-center sm:left-auto sm:right-0 sm:justify-end sm:pr-4 sm:text-right">
        <div className="rounded-2xl px-4 pt-6 pb-4">
          <Image
            src="/images/logo.png"
            alt="DC Absoluto BR"
            width={200}
            height={200}
            priority
            fetchPriority="high"
            className="mx-auto mb-4 sm:ml-auto sm:mr-0"
          />

          <p className="text-2xl font-bold text-gray-200">
            Catálogo de HQs do Universo
            <br />
            Absolute da DC em Português
          </p>
          <p className="text-lg text-gray-400 mb-2">
            Aproveite para ler e baixar as mais
            <br />
            novas histórias absolutas da DC!
          </p>

          <button
            type="button"
            onClick={scrollToCharacters}
            aria-label="Começar - ir para seção de personagens"
            className="mx-auto block cursor-pointer animate-pulse-brightness sm:ml-auto sm:mr-0"
          >
            <Image
              src="/images/home/button.png"
              alt="Começar"
              width={150}
              height={40}
              className="w-full h-auto"
            />
          </button>
        </div>
      </div>

      <LatestLaunch comic={latestComic} />
    </section>
  )
}
