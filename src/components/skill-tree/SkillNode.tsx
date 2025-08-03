import type { Skill, SkillStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Code, Database, Cloud, Cpu, GitBranch, Lock, Star, Atom, FlaskConical, Dna, Scroll, Languages, Globe, Cog, BrainCircuit, Landmark, Milestone, Zap } from "lucide-react";

interface SkillNodeProps {
  skill: Skill;
  status: SkillStatus;
  onClick: (skill: Skill) => void;
}

const ICONS: Record<string, React.ElementType> = {
  Code,
  Database,
  Cloud,
  Cpu,
  GitBranch,
  Atom,
  FlaskConical,
  Dna,
  Scroll,
  Languages,
  Globe,
  Cog,
  Helix: Zap, // Use Zap as replacement for missing Helix icon
  BrainCircuit,
  Landmark,
  Milestone,
  Default: Star,
};

const statusStyles = {
  completed: "bg-skill-completed/20 border-skill-completed text-skill-completed",
  available: "bg-skill-available/20 border-skill-available text-skill-available cursor-pointer hover:bg-skill-available/40 hover:shadow-[0_0_20px_theme(colors.skill.available)]",
  locked: "bg-skill-locked/20 border-skill-locked text-skill-locked opacity-70",
  secret: "bg-skill-secret/20 border-skill-secret text-skill-secret opacity-70",
};

export default function SkillNode({ skill, status, onClick }: SkillNodeProps) {
  const Icon = ICONS[skill.icon] || ICONS.Default;

  return (
    <div
      className={cn(
        "absolute w-48 h-28 flex flex-col items-center justify-center p-2 border-2 rounded-lg transition-all duration-300 transform hover:-translate-y-1 shadow-lg",
        statusStyles[status]
      )}
      style={{ left: skill.position.x, top: skill.position.y }}
      onClick={() => onClick(skill)}
    >
      <div className="flex items-center gap-2">
        {status === "locked" || status === "secret" ? <Lock className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
        <h3 className="font-headline font-bold text-base truncate">{skill.name}</h3>
      </div>
      <p className="text-xs text-center text-current/80 mt-1 line-clamp-2">
        {skill.description}
      </p>
      <div className="absolute bottom-1 right-2 text-xs font-bold flex items-center gap-1">
        <Star className="w-3 h-3 text-yellow-400" />
        <span>{skill.cost}</span>
      </div>
    </div>
  );
}
