import { getServerAuthUser } from "./auth.server"
import { HeaderClient } from "./header-client"

export function Header() {
  const authUser = getServerAuthUser()
  return <HeaderClient initialAuthUser={authUser} />
}
