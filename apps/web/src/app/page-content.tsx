import { FullPageScroll, Header } from "@/components"
import Characters from "@/sections/characters"
import { Copyright } from "@/sections/copyright"
import Home from "@/sections/home"
import Newsletter from "@/sections/newsletter"
import Report from "@/sections/report"
import WhereToStart from "@/sections/where-to-start"
import type { LatestComic } from "@/sections/home/latest-launch"

export function PageContent({ latestComic }: { latestComic: LatestComic | null }) {
  return (
    <div className="min-h-screen bg-dc-black text-white">
      <FullPageScroll />
      <Header />
      <main id="main-content" tabIndex={-1} data-fullpage-root>
        <Home latestComic={latestComic} />
        <Characters />
        <WhereToStart />
        <Newsletter />
        <Report />
        <Copyright />
      </main>
    </div>
  )
}
