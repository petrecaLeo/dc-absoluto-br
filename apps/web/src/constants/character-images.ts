export interface CharacterImages {
  image: string
  logo: string
  accentColor: string
  gradientFrom: string
  gradientTo: string
}

export const characterImages: Record<string, CharacterImages> = {
  batman: {
    image: "/images/characters/batman/character.webp",
    logo: "/images/characters/batman/logo.webp",
    accentColor: "#5C6BC0",
    gradientFrom: "#2C2C54",
    gradientTo: "#6B5B95",
  },
  superman: {
    image: "/images/characters/superman/character.webp",
    logo: "/images/characters/superman/logo.webp",
    accentColor: "#3b8fd4",
    gradientFrom: "#3b8fd4",
    gradientTo: "#C8102E",
  },
  "wonder-woman": {
    image: "/images/characters/wonder-woman/character.webp",
    logo: "/images/characters/wonder-woman/logo.webp",
    accentColor: "#8B0000",
    gradientFrom: "#8B0000",
    gradientTo: "#FFD700",
  },
  "green-lantern": {
    image: "/images/characters/green-lantern/character.webp",
    logo: "/images/characters/green-lantern/logo.webp",
    accentColor: "#00C853",
    gradientFrom: "#1B5E20",
    gradientTo: "#00E676",
  },
  flash: {
    image: "/images/characters/flash/character.webp",
    logo: "/images/characters/flash/logo.webp",
    accentColor: "#D50000",
    gradientFrom: "#B71C1C",
    gradientTo: "#FFD600",
  },
  "martian-manhunter": {
    image: "/images/characters/martian-manhunter/character.webp",
    logo: "/images/characters/martian-manhunter/logo.webp",
    accentColor: "#00BFA5",
    gradientFrom: "#1A237E",
    gradientTo: "#00897B",
  },
}

export const defaultCharacterImages: CharacterImages = {
  image: "/images/characters/default/character.webp",
  logo: "/images/characters/default/logo.webp",
  accentColor: "#FFCC00",
  gradientFrom: "#1A1A2E",
  gradientTo: "#3D3D5C",
}

export function getCharacterImages(slug: string): CharacterImages {
  return characterImages[slug] || defaultCharacterImages
}
