import { PUBLIC_API_URL } from "@/lib/env/public"

export interface UserProfile {
  id: string
  name: string
  profileImage: string | null
  createdAt: string
  readCount: number
  topCharacters: string[]
}

export interface UserProfileResponse {
  data: UserProfile | null
}

export async function getUserProfile(id: string): Promise<UserProfileResponse> {
  const response = await fetch(`${PUBLIC_API_URL}/api/users/${id}/profile`)

  if (!response.ok) {
    throw new Error(`Failed to fetch user profile: ${response.status}`)
  }

  return response.json()
}
