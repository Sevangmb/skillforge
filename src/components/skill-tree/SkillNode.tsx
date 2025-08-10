import { memo } from 'react';
import type { Skill, SkillStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
// Optimized icon imports - only import what we need
import { 
  Code, Database, Cloud, Cpu, GitBranch, Lock, Star, 
  Atom, FlaskConical, Dna, Scroll, Languages, Globe, 
  Cog, BrainCircuit, Landmark, Milestone, Zap,
  Calculator, Variable, Shapes, BarChart,
  Microscope, Monitor, Users, FileText,
  Presentation, Target, Kanban, Server
} from "lucide-react";

interface SkillNodeProps {
  skill: Skill;
  status: SkillStatus;
  onClick: (skill: Skill) => void;
}

// Memoized icon mapping for better performance
const ICONS: Record<string, React.ElementType> = {
  Code,
  Database, 
  Cloud,
  Cpu,
  GitBranch,
  Atom,
  FlaskConical,
  Flask: FlaskConical, // Use FlaskConical as replacement for Flask
  Dna,
  Scroll,
  Languages,
  Globe,
  Cog,
  Helix: Zap, // Use Zap as replacement for missing Helix icon
  BrainCircuit,
  Brain: BrainCircuit, // Use BrainCircuit as replacement for Brain
  Landmark,
  Milestone,
  Calculator,
  Variable,
  Shapes,
  BarChart,
  Function: Calculator, // Use Calculator as replacement for Function
  Microscope,
  Monitor,
  Users,
  FileText,
  Presentation,
  Target,
  Kanban,
  Server,
  Default: Star,
} as const;

const statusStyles = {
  completed: "bg-skill-completed/20 border-skill-completed text-skill-completed",
  available: "bg-skill-available/20 border-skill-available text-skill-available cursor-pointer hover:bg-skill-available/40 hover:shadow-[0_0_20px_theme(colors.skill.available)]",
  locked: "bg-skill-locked/20 border-skill-locked text-skill-locked opacity-70",
  secret: "bg-skill-secret/20 border-skill-secret text-skill-secret opacity-70",
};

function SkillNode({ skill, status, onClick }: SkillNodeProps) {
  const Icon = ICONS[skill.icon] || ICONS.Default;

  return (
    <div
      className={cn(
        "absolute w-48 h-28 flex flex-col items-center justify-center p-2 border-2 rounded-lg transition-all duration-300 transform shadow-lg select-none",
        statusStyles[status],
        status === 'available' && "hover:-translate-y-1 hover:scale-105 cursor-pointer",
        status === 'locked' && "cursor-not-allowed",
        status === 'completed' && "cursor-pointer hover:scale-102",
        status === 'secret' && "cursor-help"
      )}
      style={{ left: skill.position.x, top: skill.position.y }}
      onClick={() => {
        // Only allow clicking on available skills
        if (status === 'available') {
          onClick(skill);
        } else if (status === 'locked') {
          // Show a tooltip or message about prerequisites
          console.log('Skill locked - prerequisites not met');
        } else if (status === 'completed') {
          // Could show review option or stats
          console.log('Skill already completed');
        }
      }}
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
      
      {/* Status indicator */}
      {status === 'available' && (
        <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" 
             title="Cliquez pour commencer le quiz !" />
      )}
      {status === 'completed' && (
        <div className="absolute top-1 right-1 w-3 h-3 bg-blue-500 rounded-full" 
             title="Compétence maîtrisée" />
      )}
      {status === 'locked' && (
        <div className="absolute top-1 left-1 w-4 h-4 text-gray-400" 
             title="Terminez les prérequis d'abord">
          <Lock className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}

// Optimized memo comparison with shallow equality check
export default memo(SkillNode, (prevProps, nextProps) => {
  // Most common case - same skill object reference
  if (prevProps.skill === nextProps.skill && prevProps.status === nextProps.status) {
    return true;
  }
  
  // Deep comparison for skill properties that affect rendering
  return (
    prevProps.skill.id === nextProps.skill.id &&
    prevProps.skill.name === nextProps.skill.name &&
    prevProps.skill.description === nextProps.skill.description &&
    prevProps.skill.icon === nextProps.skill.icon &&
    prevProps.skill.cost === nextProps.skill.cost &&
    prevProps.skill.position.x === nextProps.skill.position.x &&
    prevProps.skill.position.y === nextProps.skill.position.y &&
    prevProps.status === nextProps.status
    // Note: onClick is excluded from comparison as it should be stable
  );
});
