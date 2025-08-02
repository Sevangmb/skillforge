"use client";

import { useState, useRef, MouseEvent, WheelEvent, useMemo } from 'react';
import type { Skill, User } from '@/lib/types';
import SkillNode from './SkillNode';
import SkillConnection from './SkillConnection';

interface SkillTreeProps {
  skills: Skill[];
  user: User;
  onNodeClick: (skill: Skill) => void;
}

const Starfield = () => (
  <div className="absolute inset-0 z-0">
    <div className="absolute top-0 left-0 w-px h-px bg-white rounded-full shadow-[0_0_8px_2px_#fff]" style={{ top: '10%', left: '20%' }}></div>
    <div className="absolute top-0 left-0 w-px h-px bg-white rounded-full shadow-[0_0_8px_2px_#fff]" style={{ top: '30%', left: '80%' }}></div>
    <div className="absolute top-0 left-0 w-px h-px bg-white rounded-full shadow-[0_0_8px_2px_#fff]" style={{ top: '50%', left: '50%' }}></div>
    <div className="absolute top-0 left-0 w-px h-px bg-white rounded-full shadow-[0_0_8px_2px_#fff]" style={{ top: '70%', left: '10%' }}></div>
    <div className="absolute top-0 left-0 w-px h-px bg-white rounded-full shadow-[0_0_8px_2px_#fff]" style={{ top: '90%', left: '90%' }}></div>
    <div className="absolute top-0 left-0 w-px h-px bg-white rounded-full shadow-[0_0_8px_2px_#fff]" style={{ top: '25%', left: '40%' }}></div>
    <div className="absolute top-0 left-0 w-px h-px bg-white rounded-full shadow-[0_0_8px_2px_#fff]" style={{ top: '75%', left: '60%' }}></div>
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

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    setIsPanning(true);
    lastPanPoint.current = { x: e.pageX, y: e.pageY };
    e.currentTarget.style.cursor = 'grabbing';
  };

  const handleMouseUp = (e: MouseEvent<HTMLDivElement>) => {
    setIsPanning(false);
    e.currentTarget.style.cursor = 'grab';
  };
  
  const handleMouseLeave = (e: MouseEvent<HTMLDivElement>) => {
    setIsPanning(false);
    e.currentTarget.style.cursor = 'grab';
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    const dx = e.pageX - lastPanPoint.current.x;
    const dy = e.pageY - lastPanPoint.current.y;
    lastPanPoint.current = { x: e.pageX, y: e.pageY };
    setView(v => ({ ...v, x: v.x + dx, y: v.y + dy }));
  };

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const scaleAmount = e.deltaY > 0 ? -0.1 : 0.1;
    let newScale = view.scale + scaleAmount;
    newScale = Math.min(Math.max(0.3, newScale), 1.5);
    
    // Zoom towards cursor
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newX = mouseX - (mouseX - view.x) * (newScale / view.scale);
    const newY = mouseY - (mouseY - view.y) * (newScale / view.scale);

    setView({ scale: newScale, x: newX, y: newY });
  };
  

  const getStatus = (skill: Skill) => {
    if (user.competences[skill.id]?.completed) return 'completed';
    const prereqsMet = skill.prereqs.every(id => user.competences[id]?.completed);
    if (prereqsMet) return 'available';
    return skill.isSecret ? 'secret' : 'locked';
  }

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
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ width: 2000, height: 1000 }}>
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5"
                markerWidth="6" markerHeight="6"
                orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--border))" />
            </marker>
          </defs>
          {skills.map(skill => (
            skill.prereqs.map(prereqId => {
              const prereqSkill = skillMap.get(prereqId);
              if (!prereqSkill) return null;
              return <SkillConnection key={`${prereqId}-${skill.id}`} from={prereqSkill} to={skill} />;
            })
          ))}
        </svg>

        {skills.map(skill => (
          <SkillNode
            key={skill.id}
            skill={skill}
            status={getStatus(skill)}
            onClick={() => onNodeClick(skill)}
          />
        ))}
      </div>
    </div>
  );
}
