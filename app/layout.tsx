import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SkillForge - Développez vos compétences',
  description: 'Plateforme d\'apprentissage et de développement des compétences',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}