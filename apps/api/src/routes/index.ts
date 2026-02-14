import { Elysia } from "elysia"
import { auth } from "./auth"
import { characters } from "./characters"
import { comics } from "./comics"
import { newsletter } from "./newsletter"
import { proxy } from "./proxy"
import { report } from "./report"
import { usersRoute } from "./users"

export const routes = new Elysia({ prefix: "/api" })
  .use(comics)
  .use(characters)
  .use(auth)
  .use(newsletter)
  .use(proxy)
  .use(report)
  .use(usersRoute)
