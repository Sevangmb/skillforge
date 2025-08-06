import type { Skill } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SkillConnectionProps {
  from: Skill;
  to: Skill;
}

export default function SkillConnection({ from, to }: SkillConnectionProps) {
  const nodeWidth = 192; // 12rem
  const nodeHeight = 112; // 7rem

  const x1 = from.position.x + nodeWidth / 2;
  const y1 = from.position.y + nodeHeight / 2;
  const x2 = to.position.x + nodeWidth / 2;
  const y2 = to.position.y + nodeHeight / 2;

  // Simple connection for now
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      className={cn("stroke-current text-border transition-all duration-300")}
      strokeWidth="2"
      markerEnd="url(#arrow)"
    />
  );
}
