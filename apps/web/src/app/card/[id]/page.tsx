import type { Metadata } from "next"

import { CardContent } from "./card-content"

interface CardPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: CardPageProps): Promise<Metadata> {
  const { id } = await params

  return {
    title: "Card de Perfil | DC Absoluto BR",
    description: "Confira este card de perfil no DC Absoluto BR!",
    openGraph: {
      title: "Card de Perfil | DC Absoluto BR",
      description: "Confira este card de perfil no DC Absoluto BR!",
      url: `/card/${id}`,
    },
  }
}

export default async function CardPage({ params }: CardPageProps) {
  const { id } = await params

  return <CardContent userId={id} />
}
