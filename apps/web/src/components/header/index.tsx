import { getServerAuthUser } from "./auth.server"
import { HeaderClient } from "./header-client"

export async function Header() {
  const authUser = await getServerAuthUser()
  return <HeaderClient initialAuthUser={authUser} />
}
