import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  real,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

export const comics = pgTable(
  "comics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    issueNumber: real("issue_number"),
    coverUrl: varchar("cover_url", { length: 500 }),
    downloadUrl: varchar("download_url", { length: 500 }),
    releaseDate: timestamp("release_date"),
    publisher: varchar("publisher", { length: 100 }).default("DC Comics"),
    writer: varchar("writer", { length: 255 }),
    artists: varchar("artists", { length: 500 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [unique("comics_title_issue_number_unique").on(table.title, table.issueNumber)],
)

export const characters = pgTable("characters", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  alias: varchar("alias", { length: 255 }),
  rating: real("rating").default(0).notNull(),
  upvotes: integer("upvotes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const comicsToCharacters = pgTable(
  "comics_to_characters",
  {
    comicId: uuid("comic_id")
      .notNull()
      .references(() => comics.id),
    characterId: uuid("character_id")
      .notNull()
      .references(() => characters.id),
  },
  (table) => [primaryKey({ columns: [table.comicId, table.characterId] })],
)

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
})

export const characterNewsletterSubscribers = pgTable("character_newsletter_subscribers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  characterId: uuid("character_id")
    .notNull()
    .references(() => characters.id),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
})

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const userEmailVerifications = pgTable("user_email_verifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const userReadComics = pgTable(
  "user_read_comics",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    comicId: uuid("comic_id")
      .notNull()
      .references(() => comics.id),
    readAt: timestamp("read_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.comicId] })],
)
