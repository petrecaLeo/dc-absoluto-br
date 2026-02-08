export const PROFILE_IMAGE_OPTIONS = [
  { id: "bane", label: "Bane", file: "bane.webp" },
  { id: "barry", label: "Barry Allen", file: "barry.webp" },
  { id: "batman", label: "Batman", file: "batman.webp" },
  { id: "batman-1", label: "Batman (Alt)", file: "batman-1.webp" },
  { id: "batwoman", label: "Batwoman", file: "batwoman.webp" },
  { id: "brainiac", label: "Brainiac", file: "brainiac.webp" },
  { id: "catwoman", label: "Catwoman", file: "catwoman.webp" },
  { id: "flash", label: "Flash", file: "flash.webp" },
  { id: "flash-1", label: "Flash (Alt)", file: "flash-1.webp" },
  { id: "hal", label: "Hal Jordan", file: "hal.webp" },
  { id: "john", label: "John Stewart", file: "john.webp" },
  { id: "joker", label: "Joker", file: "joker.webp" },
  { id: "lantern", label: "Lanterna", file: "lantern.webp" },
  { id: "martian", label: "Martian Manhunter", file: "martian.webp" },
  { id: "mulher", label: "Mulher-Maravilha", file: "mulher.webp" },
  { id: "mulher-1", label: "Mulher-Maravilha (Alt)", file: "mulher-1.webp" },
  { id: "stewart", label: "Stewart", file: "stewart.webp" },
  { id: "superman", label: "Superman", file: "superman.webp" },
  { id: "superman-1", label: "Superman (Alt)", file: "superman-1.webp" },
  { id: "zatanna", label: "Zatanna", file: "zatanna.webp" },
] as const

export type ProfileImageOption = (typeof PROFILE_IMAGE_OPTIONS)[number]
export type ProfileImageId = ProfileImageOption["id"]
