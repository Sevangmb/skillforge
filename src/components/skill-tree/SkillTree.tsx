
"use client";

import { useState, useRef, MouseEvent, WheelEvent, useMemo, useCallback } from 'react';
import type { Skill, User } from '@/lib/types';
import SkillNode from './SkillNode';
import SkillConnection from './SkillConnection';
import { useThrottledMouseCallback } from '@/hooks/useThrottledCallback';
import { getSkillStatus } from '@/lib/utils';

interface SkillTreeProps {
  skills: Skill[];
  user: User;
  onNodeClick: (skill: Skill) => void;
}

const STARS = [
  { top: '10%', left: '20%' },
  { top: '30%', left: '80%' },
  { top: '50%', left: '50%' },
  { top: '70%', left: '10%' },
  { top: '90%', left: '90%' },
  { top: '25%', left: '40%' },
  { top: '75%', left: '60%' },
] as const;

const Starfield = () => (
  <div className="absolute inset-0 z-0">
    {STARS.map((star, index) => (
      <div
        key={index}
        className="absolute w-px h-px bg-white rounded-full shadow-[0_0_8px_2px_#fff]"
        style={{ top: star.top, left: star.left }}
      />
    ))}
  </div>
);


export default function SkillTree({ skills, user, onNodeClick }: SkillTreeProps) {
  const [view, setView] = useState({ x: 0, y: 0, scale: 0.8 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPanPoint = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const skillMap = useMemo(() => {
    const map = new Map<string, Skill>();
    skills.forEach(skill => map.set(skill.id, skill));
    return map;
  }, [skills]);
  
  const completedSkillIds = useMemo(() => 
    new Set(Object.keys(user.competences).filter(id => user.competences[id].completed)),
    [user.competences]
  );
  
  const visibleSkills = useMemo(() => {
    return skills.filter(skill => {
        if (!skill.prereqs || skill.prereqs.length === 0) {
            return true;
        }
        return skill.prereqs.every(prereqId => completedSkillIds.has(prereqId));
    });
  }, [skills, completedSkillIds]);


  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Prevent panning when clicking on a skill node
    if (target.closest('[data-skill-node="true"]')) {
      return;
    }
    setIsPanning(true);
    lastPanPoint.current = { x: e.pageX, y: e.pageY };
    e.currentTarget.style.cursor = 'grabbing';
  };

  const handleMouseUp = (e: MouseEvent<HTMLDivElement>) => {
    setIsPanning(false);
    e.currentTarget.style.cursor = 'grab';
  };
  
  const handleMouseLeave = (e: MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      setIsPanning(false);
      e.currentTarget.style.cursor = 'grab';
    }
  };

  const handleMouseMoveBase = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    const dx = e.pageX - lastPanPoint.current.x;
    const dy = e.pageY - lastPanPoint.current.y;
    lastPanPoint.current = { x: e.pageX, y: e.pageY };
    setView(v => ({ ...v, x: v.x + dx, y: v.y + dy }));
  }, [isPanning]);

  const handleMouseMove = useThrottledMouseCallback(handleMouseMoveBase, 8);

  const handleWheelBase = useCallback((e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const scaleAmount = e.deltaY > 0 ? -0.1 : 0.1;
    let newScale = view.scale + scaleAmount;
    newScale = Math.min(Math.max(0.3, newScale), 1.5); // Fix min/max order
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newX = mouseX - (mouseX - view.x) * (newScale / view.scale);
    const newY = mouseY - (mouseY - view.y) * (newScale / view.scale);

    setView({ scale: newScale, x: newX, y: newY });
  }, [view]);

  const handleWheel = useThrottledMouseCallback(handleWheelBase, 10);
  
  const getStatus = useCallback((skill: Skill) => getSkillStatus(skill, user), [user]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-background overflow-hidden relative cursor-grab"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
    >
      <Starfield />
      <div
        className="absolute top-0 left-0 transition-transform duration-100 ease-linear"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
      >
        <svg width="2000" height="1200" className="absolute top-0 left-0 pointer-events-none">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5"
                markerWidth="6" markerHeight="6"
                orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--border))" />
            </marker>
          </defs>
          {visibleSkills.flatMap(skill => 
            skill.prereqs?.map(prereqId => {
              const prereqSkill = skillMap.get(prereqId);
              if (!prereqSkill || !visibleSkills.some(s => s.id === prereqId)) return null;
              return <SkillConnection key={`${prereqId}-${skill.id}`} from={prereqSkill} to={skill} />;
            }).filter(Boolean) || []
          )}
        </svg>

        {visibleSkills.map(skill => (
           <div key={skill.id} data-skill-node="true">
              <SkillNode
                skill={skill}
                status={getStatus(skill)}
                onClick={() => onNodeClick(skill)}
              />
            </div>
        ))}
      </div>
    </div>
  );
}
