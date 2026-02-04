import { and, eq } from "drizzle-orm"
import { sendNewComicEmail, sendNewsletterNewComicEmail } from "../services/email"
import { db } from "./index"
import {
  characterNewsletterSubscribers,
  characters,
  comics,
  comicsToCharacters,
  newsletterSubscribers,
} from "./schema"

const batmanComics = [
  {
    title: "Batman Absoluto #1",
    issueNumber: 1,
    releaseDate: new Date("2024-10-09"),
    publisher: "DC Comics",
    writer: "Scott Snyder",
    artists: "Nick Dragotta, Frank Martin",
    downloadUrl: "https://drive.google.com/uc?export=download&id=1-yiVk_kv6pLEzU6dzjYS06FG2KvZFrzV",
  },
  {
    title: "Batman Absoluto #2",
    issueNumber: 2,
    releaseDate: new Date("2024-11-13"),
    publisher: "DC Comics",
    writer: "Scott Snyder",
    artists: "Frank Martin, Nick Dragotta",
    downloadUrl:
      "https://drive.google.com/file/d/1-yznXaCyWb5RFu-qnotcYw18FRUt1d-O/view?usp=sharing",
  },
  {
    title: "Batman Absoluto #3",
    issueNumber: 3,
    releaseDate: new Date("2024-12-18"),
    publisher: "DC Comics",
    writer: "Scott Snyder",
    artists: "Frank Martin, Nick Dragotta",
    downloadUrl:
      "https://drive.google.com/file/d/106XcNukcjKuamHVYGZe5RNVrN53Zlhen/view?usp=sharing",
  },
  {
    title: "Batman Absoluto #4",
    issueNumber: 4,
    releaseDate: new Date("2025-01-08"),
    publisher: "DC Comics",
    writer: "Scott Snyder",
    artists: "Frank Martin, Nick Dragotta, Gabriel Hernandez Walta",
    downloadUrl:
      "https://drive.google.com/file/d/107QrLoNUoXAU6cfQ9pV7QmK43n5YmaC0/view?usp=sharing",
  },
  {
    title: "Batman Absoluto #5",
    issueNumber: 5,
    releaseDate: new Date("2025-02-12"),
    publisher: "DC Comics",
    writer: "Scott Snyder",
    artists: "Frank Martin, Nick Dragotta",
    downloadUrl:
      "https://drive.google.com/file/d/108IvRxYcS8XJIGqpjOHDAU3tsL2F7OB6/view?usp=sharing",
  },
  {
    title: "Batman Absoluto #6",
    issueNumber: 6,
    releaseDate: new Date("2025-03-19"),
    publisher: "DC Comics",
    writer: "Scott Snyder",
    artists: "Frank Martin, Nick Dragotta",
    downloadUrl:
      "https://drive.google.com/file/d/10GvC-d3FbRzAKtzmK-X30TDNFvMbdWN8/view?usp=sharing",
  },
  {
    title: "Batman Absoluto #7",
    issueNumber: 7,
    releaseDate: new Date("2025-04-09"),
    publisher: "DC Comics",
    writer: "Scott Snyder",
    artists: "Frank Martin, Nick Dragotta, Marcos Martín, Muntsa Vicente",
    downloadUrl:
      "https://drive.google.com/file/d/1JJGKYkuLrTEicn4Ik5SWG0V2nO91xfYU/view?usp=sharing",
  },
  {
    title: "Batman Absoluto #8",
    issueNumber: 8,
    releaseDate: new Date("2025-05-14"),
    publisher: "DC Comics",
    writer: "Scott Snyder",
    artists: "Frank Martin, Nick Dragotta, Marcos Martín, Muntsa Vicente",
    downloadUrl:
      "https://drive.google.com/file/d/13OwSXq1K9t0avXhijSTiJgKh3wOK53V1/view?usp=sharing",
  },
  {
    title: "Batman Absoluto #9",
    issueNumber: 9,
    releaseDate: new Date("2025-06-11"),
    publisher: "DC Comics",
    writer: "Scott Snyder",
    artists: "Frank Martin, Nick Dragotta",
    downloadUrl:
      "https://drive.google.com/file/d/17WRAP-6Cign1AlC_T3wMB05HEW6sIH_J/view?usp=sharing",
  },
  {
    title: "Batman Absoluto #10",
    issueNumber: 10,
    releaseDate: new Date("2025-07-16"),
    publisher: "DC Comics",
    writer: "Scott Snyder",
    artists: "Frank Martin, Nick Dragotta",
    downloadUrl:
      "https://drive.google.com/file/d/1DDDA6RvmNliGAZe8OUAWecnsxCIqRi9_/view?usp=sharing",
  },
  {
    title: "Batman Absoluto #11",
    issueNumber: 11,
    releaseDate: new Date("2025-08-20"),
    publisher: "DC Comics",
    writer: "Scott Snyder",
    artists: "Frank Martin, Nick Dragotta, Clay Mann",
    downloadUrl:
      "https://drive.google.com/file/d/1wwjNqvpiRNqEcKcWtAIhXvpZqQXff186/view?usp=sharing",
  },
  {
    title: "Batman Absoluto #12",
    issueNumber: 12,
    releaseDate: new Date("2025-09-10"),
    publisher: "DC Comics",
    writer: "Scott Snyder",
    artists: "Nick Dragotta",
    downloadUrl:
      "https://drive.google.com/file/d/1gwwXpudmerEOr5PwITTA0dBN6cvazJpg/view?usp=sharing",
  },
  {
    title: "Batman Absoluto #13",
    issueNumber: 13,
    releaseDate: new Date("2025-10-08"),
    publisher: "DC Comics",
    writer: "Scott Snyder",
    artists: "Frank Martin, Nick Dragotta",
    downloadUrl:
      "https://drive.google.com/file/d/1OM-y33ZJKbDnRFasmAzxnF52aiTNm9eJ/view?usp=sharing",
  },
  {
    title: "Batman Absoluto 2025 Anual #1",
    issueNumber: 13.5,
    releaseDate: new Date("2025-10-29"),
    publisher: "DC Comics",
    writer: "Meredith McClaren, James Harren, Daniel Warren Johnson",
    artists: "Meredith McClaren, James Harren, Daniel Warren Johnson, Dave Stewart, Mike Spicer",
    downloadUrl:
      "https://drive.google.com/file/d/1lHsL6wgEgF3vyBFqot7SVpVIvcJDVTvq/view?usp=sharing",
  },
  {
    title: "Batman Absoluto #14",
    issueNumber: 14,
    releaseDate: new Date("2025-11-26"),
    publisher: "DC Comics",
    writer: "Scott Snyder",
    artists: "Frank Martin, Nick Dragotta",
    downloadUrl:
      "https://drive.google.com/file/d/1anlwlk456SwYECypZGV-6GQDEr9uKieo/view?usp=sharing",
  },
  {
    title: "Batman Absoluto #15",
    issueNumber: 15,
    releaseDate: new Date("2025-12-10"),
    publisher: "DC Comics",
    writer: "Scott Snyder",
    artists: "Frank Martin, Nick Dragotta",
    downloadUrl:
      "https://drive.google.com/file/d/18VqLToJMvetPG9mLTBOpepNoEVenZ-_M/view?usp=sharing",
  },
  {
    title: "Batman Absoluto Ark M #1",
    issueNumber: 15.5,
    releaseDate: new Date("2026-01-07"),
    publisher: "DC Comics",
    writer: "Frank Tieri, Scott Snyder",
    artists: "Joshua Hixson, Roman Stevens",
    downloadUrl:
      "https://drive.google.com/file/d/1YboPHunKXg1ZVcs02d9TP2-HQfel_KYT/view?usp=sharing",
  },
]

async function seed() {
  console.log("🌱 Iniciando seed...")

  await db
    .insert(characters)
    .values([
      {
        slug: "batman",
        name: "Batman",
        alias: "Bruce Wayne",
        rating: 0,
        upvotes: 0,
      },
      {
        slug: "superman",
        name: "Superman",
        alias: "Kal-el",
        rating: 0,
        upvotes: 0,
      },
      {
        slug: "wonder-woman",
        name: "Mulher Maravilha",
        alias: "Diana",
        rating: 0,
        upvotes: 0,
      },
      {
        slug: "green-lantern",
        name: "Lanterna Verde",
        alias: 'Sojourner "Jo" Mullein',
        rating: 0,
        upvotes: 0,
      },
      {
        slug: "flash",
        name: "Flash",
        alias: "Wally West",
        rating: 0,
        upvotes: 0,
      },
      {
        slug: "martian-manhunter",
        name: "Caçador de Marte",
        alias: "John Jones",
        rating: 0,
        upvotes: 0,
      },
    ])
    .onConflictDoNothing()

  const [batman] = await db.select().from(characters).where(eq(characters.slug, "batman"))

  console.log("✅ Personagens inseridos com sucesso!")

  const insertedComics = await db
    .insert(comics)
    .values(batmanComics)
    .onConflictDoNothing()
    .returning()

  console.log(`✅ ${insertedComics.length} HQs inseridas com sucesso!`)

  if (insertedComics.length > 0) {
    await db
      .insert(comicsToCharacters)
      .values(insertedComics.map((comic) => ({ comicId: comic.id, characterId: batman.id })))
      .onConflictDoNothing()

    console.log("✅ Relacionamentos inseridos com sucesso!")

    await notifySubscribers(batman.id, batman.name, insertedComics)
  }

  process.exit(0)
}

async function notifySubscribers(
  characterId: string,
  characterName: string,
  newComics: { title: string }[],
) {
  const charSubs = await db
    .select()
    .from(characterNewsletterSubscribers)
    .where(
      and(
        eq(characterNewsletterSubscribers.characterId, characterId),
        eq(characterNewsletterSubscribers.isActive, true),
      ),
    )

  const generalSubs = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.isActive, true))

  let sent = 0

  for (const comic of newComics) {
    for (const sub of charSubs) {
      await sendNewComicEmail({
        to: sub.email,
        characterName,
        comicTitle: comic.title,
        subscriberId: sub.id,
      })
      sent++
    }
    for (const sub of generalSubs) {
      await sendNewsletterNewComicEmail({
        to: sub.email,
        comicTitle: comic.title,
        subscriberId: sub.id,
      })
      sent++
    }
  }

  console.log(`✅ ${sent} notificações enviadas!`)
}

seed().catch((error) => {
  console.error("❌ Erro no seed:", error)
  process.exit(1)
})
