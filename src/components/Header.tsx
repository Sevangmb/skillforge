import { SidebarTrigger } from "./ui/sidebar";
import AuthButton from "./auth/AuthButton";

export default function Header() {
  return (
    <header className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-4">
         <SidebarTrigger className="md:hidden" />
         <h1 className="text-2xl font-bold font-headline text-primary">SkillForge AI</h1>
      </div>
      <div className="flex items-center gap-4">
        <AuthButton />
      </div>
    </header>
  );
}
