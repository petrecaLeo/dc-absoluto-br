import { ComicReader } from "@/components/comic-reader"

const DOWNLOAD_URL = "https://drive.google.com/file/d/1-8SAoB2wPI3rEH3bdwMjWTOHKooxQlGQ/view"

export default function DcAllInReaderPage() {
  return (
    <ComicReader
      comicId="dc-all-in"
      downloadUrl={DOWNLOAD_URL}
      comicTitle="DC All In"
      backUrl="/#where-to-start"
    />
  )
}
