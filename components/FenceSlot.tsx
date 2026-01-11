
import React from 'react';
import { FenceOrientation, PlayerId, Theme } from '../types';

interface FenceSlotProps {
  r: number;
  c: number;
  orientation: FenceOrientation;
  isPlaced?: boolean;
  isHovered?: boolean;
  isValid?: boolean;
  onHover?: (r: number, c: number, orientation: FenceOrientation | null) => void;
  onClick?: (r: number, c: number, orientation: FenceOrientation) => void;
  placedBy?: PlayerId | null;
  theme: Theme;
}

const FenceSlot: React.FC<FenceSlotProps> = ({ 
  r, c, orientation, isPlaced, isHovered, isValid = true, onHover, onClick, placedBy, theme 
}) => {
  const isHorizontal = orientation === 'h';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPlaced && isValid && onClick) {
      onClick(r, c, orientation);
    }
  };

  const baseClasses = `absolute z-10 transition-all duration-150`;
  const orientationClasses = isHorizontal
    ? `h-1.5 w-[calc(200%+0.5rem)] md:h-2 md:w-[calc(200%+0.75rem)]`
    : `w-1.5 h-[calc(200%+0.5rem)] md:w-2 md:h-[calc(200%+0.75rem)]`;

  let stateClasses = 'bg-transparent';
  let cursorClass = 'cursor-pointer';

  if (isPlaced) {
    if (theme === 'cyber') {
      stateClasses = placedBy === 0 
        ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]' 
        : 'bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.8)]';
    } else if (theme === 'minimalist') {
      stateClasses = placedBy === 0 ? 'bg-black' : 'bg-slate-400';
    } else {
      stateClasses = placedBy === 0 ? 'bg-slate-300 shadow-md ring-1 ring-slate-400' : 'bg-slate-950 shadow-md ring-1 ring-slate-800';
    }
    cursorClass = 'cursor-default';
  } else if (isHovered) {
    if (isValid) {
      stateClasses = theme === 'cyber' ? 'bg-cyan-400/50 ring-2 ring-cyan-400' : 'bg-amber-400/80 ring-2 ring-amber-500';
    } else {
      stateClasses = 'bg-rose-500/60 ring-2 ring-rose-600';
      cursorClass = 'cursor-not-allowed';
    }
  }

  const positionClasses = isHorizontal
    ? `top-[calc(100%-0.18rem)] md:top-[calc(100%-0.25rem)] left-0`
    : `left-[calc(100%-0.18rem)] md:left-[calc(100%-0.25rem)] top-0`;

  return (
    <div 
      className={`${baseClasses} ${orientationClasses} ${stateClasses} ${positionClasses} ${cursorClass} rounded-full`}
      onMouseEnter={() => onHover && onHover(r, c, orientation)}
      onMouseLeave={() => onHover && onHover(r, c, null)}
      onClick={handleClick}
    />
  );
};

export default FenceSlot;
