import { useMemo } from 'react';
import { useUser, useSkills } from '@/stores/useAppStore';

export function useAvailableSkills() {
  const user = useUser();
  const skills = useSkills();

  return useMemo(() => {
    if (!user || !skills.length) return [];
    
    return skills.filter(skill => {
      const isCompleted = user.competences[skill.id]?.completed;
      if (isCompleted) return false;
      
      const prereqsMet = skill.prereqs.every(prereqId => 
        user.competences[prereqId]?.completed
      );
      return prereqsMet;
    });
  }, [user, skills]);
}

export function useCompletedSkills() {
  const user = useUser();
  const skills = useSkills();

  return useMemo(() => {
    if (!user || !skills.length) return [];
    
    return skills.filter(skill => user.competences[skill.id]?.completed);
  }, [user, skills]);
} 