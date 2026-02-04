import { Elysia } from "elysia"
import { characters } from "./characters"
import { comics } from "./comics"
import { newsletter } from "./newsletter"
import { proxy } from "./proxy"
import { report } from "./report"

export const routes = new Elysia({ prefix: "/api" })
  .use(comics)
  .use(characters)
  .use(newsletter)
  .use(proxy)
  .use(report)
