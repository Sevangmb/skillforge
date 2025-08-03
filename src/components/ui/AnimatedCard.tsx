"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'interactive' | 'success' | 'warning';
}

export function AnimatedCard({ 
  children, 
  className, 
  onClick, 
  disabled = false,
  variant = 'default' 
}: AnimatedCardProps) {
  const [isPressed, setIsPressed] = useState(false);

  const baseClasses = "transition-all duration-200 ease-in-out";
  
  const variantClasses = {
    default: "bg-card border border-border",
    interactive: "bg-card border border-border hover:border-primary/50 hover:shadow-md",
    success: "bg-green-50 border-green-200 hover:border-green-300",
    warning: "bg-yellow-50 border-yellow-200 hover:border-yellow-300",
  };

  const pressedClasses = isPressed ? "scale-95" : "";
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        pressedClasses,
        disabledClasses,
        className
      )}
      onClick={disabled ? undefined : onClick}
      onMouseDown={() => !disabled && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => !disabled && setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
    >
      {children}
    </div>
  );
} 