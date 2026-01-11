
import React from 'react';
import { Position, PlayerId, Theme } from '../types';
import { soundEngine } from '../services/soundEngine';

interface SquareProps {
  pos: Position;
  isPawn?: PlayerId | null;
  isValidMove?: boolean;
  onMove?: (pos: Position) => void;
  activePlayerId: PlayerId;
  isMyTurn: boolean;
  theme: Theme;
}

const Square: React.FC<SquareProps> = ({ pos, isPawn, isValidMove, onMove, activePlayerId, isMyTurn, theme }) => {
  const handleClick = () => {
    if (isMyTurn && !isPawn) {
      if (isValidMove && onMove) {
        onMove(pos);
      } else {
        soundEngine.play('error');
      }
    }
  };

  const getThemeClasses = () => {
    switch (theme) {
      case 'cyber':
        return isValidMove 
          ? 'bg-cyan-900/40 ring-4 ring-cyan-400/50 z-20 scale-105' 
          : 'bg-slate-800 border border-slate-700/50';
      case 'minimalist':
        return isValidMove
          ? 'bg-slate-200 ring-4 ring-black/20 z-20 scale-105'
          : 'bg-white border border-slate-100';
      case 'classic':
      default:
        return isValidMove 
          ? 'bg-amber-100 ring-4 ring-amber-400/50 z-20 scale-105' 
          : 'bg-[#d2b48c]';
    }
  };

  const getPawnClasses = (id: PlayerId) => {
    const isActive = id === activePlayerId;
    switch (theme) {
      case 'cyber':
        return id === 0 
          ? `bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] ${isActive ? 'ring-4 ring-white' : ''}`
          : `bg-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.8)] ${isActive ? 'ring-4 ring-white' : ''}`;
      case 'minimalist':
        return id === 0
          ? `bg-black ${isActive ? 'ring-4 ring-slate-300' : ''}`
          : `bg-white border-2 border-black ${isActive ? 'ring-4 ring-slate-300' : ''}`;
      case 'classic':
      default:
        return id === 0 
          ? `bg-gradient-to-br from-slate-50 to-slate-300 border-2 border-slate-400 ${isActive ? 'ring-4 ring-amber-500/60 ring-offset-2' : ''}`
          : `bg-gradient-to-br from-slate-700 to-slate-900 border-2 border-slate-950 ${isActive ? 'ring-4 ring-amber-500/60 ring-offset-2' : ''}`;
    }
  };

  return (
    <div 
      className={`
        w-8 h-8 md:w-14 md:h-14 rounded-md flex items-center justify-center relative cursor-pointer
        ${getThemeClasses()}
        transition-all duration-300 ease-out shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]
      `}
      onClick={handleClick}
    >
      {/* Texture for classic */}
      {theme === 'classic' && (
        <div className="absolute inset-0 opacity-20 pointer-events-none border border-black/5 rounded-md" />
      )}

      {/* Target Row Indicator */}
      {(pos.r === 0 || pos.r === 8) && (
        <div className={`absolute inset-0 opacity-5 rounded-md ${pos.r === 0 ? 'bg-white' : 'bg-black'}`} />
      )}

      {isValidMove && (
        <div className={`absolute inset-0 rounded-md animate-ping pointer-events-none ${theme === 'cyber' ? 'bg-cyan-400/30' : 'bg-amber-400/30'}`} />
      )}

      {isPawn !== null && isPawn !== undefined && (
        <div 
          className={`
            w-4/5 h-4/5 rounded-full shadow-2xl transform transition-all duration-500 z-30
            ${getPawnClasses(isPawn)}
            ${isPawn === activePlayerId ? 'scale-110' : 'scale-90 opacity-90'}
          `}
        >
          {theme === 'classic' && <div className="absolute top-1 left-2 w-1/2 h-1/4 bg-white/20 rounded-full" />}
        </div>
      )}
    </div>
  );
};

export default Square;
