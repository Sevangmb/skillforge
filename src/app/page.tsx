import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">SkillForge AI</h1>
      <p className="text-xl mb-8">L'aventure de l'apprentissage commence ici.</p>
      <Button size="lg">Commencer</Button>
    </main>
  );
}
