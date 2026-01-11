
import React, { useState, useMemo } from 'react';
import { GameState, Position, FenceOrientation, PlayerId, Theme } from '../types';
import Square from './Square';
import FenceSlot from './FenceSlot';
import { BOARD_SIZE, isValidFencePlacement } from '../services/gameLogic';
import { soundEngine } from '../services/soundEngine';

interface BoardProps {
  state: GameState;
  onMove: (pos: Position) => void;
  onPlaceFence: (r: number, c: number, orientation: FenceOrientation) => void;
  validMoves: Position[];
  isMyTurn: boolean;
  myId: PlayerId;
  theme: Theme;
}

const Board: React.FC<BoardProps> = ({ state, onMove, onPlaceFence, validMoves, isMyTurn, myId, theme }) => {
  const [hoveredFence, setHoveredFence] = useState<{r: number, c: number, orientation: FenceOrientation} | null>(null);

  const isSquareValidMove = (r: number, c: number) => {
    return validMoves.some(m => m.r === r && m.c === c);
  };

  const getPawnAt = (r: number, c: number): PlayerId | null => {
    const p1 = state.players[0].pos;
    const p2 = state.players[1].pos;
    if (p1.r === r && p1.c === c) return 0;
    if (p2.r === r && p2.c === c) return 1;
    return null;
  };

  const isFenceAt = (r: number, c: number, orientation: FenceOrientation) => {
    return state.fences.find(f => f.r === r && f.c === c && f.orientation === orientation);
  };

  const isHoveredFenceValid = useMemo(() => {
    if (!hoveredFence) return true;
    if (state.players[myId].fencesRemaining <= 0) return false;
    return isValidFencePlacement({ ...hoveredFence, placedBy: myId }, state);
  }, [hoveredFence, state, myId]);

  const handleFenceClick = (r: number, c: number, orientation: FenceOrientation) => {
    if (!isMyTurn) return;
    
    const isValid = isValidFencePlacement({ r, c, orientation, placedBy: myId }, state);
    if (isValid && state.players[myId].fencesRemaining > 0) {
      onPlaceFence(r, c, orientation);
    } else {
      soundEngine.play('error');
    }
  };

  const getBoardContainerStyle = () => {
    switch (theme) {
      case 'cyber':
        return 'bg-slate-950 border-[12px] border-slate-900 ring-2 ring-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.2)]';
      case 'minimalist':
        return 'bg-white border-[12px] border-black shadow-lg';
      case 'classic':
      default:
        return 'bg-[#5d2e0d] border-[12px] border-[#3e1f09] shadow-2xl';
    }
  };

  const getLabelColor = () => {
    switch (theme) {
      case 'cyber': return 'text-cyan-400';
      case 'minimalist': return 'text-black';
      case 'classic':
      default: return 'text-[#d2b48c]';
    }
  };

  const renderSquares = () => {
    const boardRows = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      const rowSquares = [];
      for (let c = 0; c < BOARD_SIZE; c++) {
        rowSquares.push(
          <div key={`${r}-${c}`} className="relative">
            <Square 
              pos={{r, c}} 
              isPawn={getPawnAt(r, c)}
              isValidMove={isMyTurn && isSquareValidMove(r, c)}
              onMove={onMove}
              activePlayerId={state.currentTurn}
              isMyTurn={isMyTurn}
              theme={theme}
            />
            
            {r < BOARD_SIZE - 1 && c < BOARD_SIZE - 1 && (
              <FenceSlot 
                r={r} c={c} orientation="h"
                isPlaced={!!isFenceAt(r, c, 'h')}
                placedBy={isFenceAt(r, c, 'h')?.placedBy}
                isHovered={isMyTurn && hoveredFence?.r === r && hoveredFence?.c === c && hoveredFence?.orientation === 'h'}
                isValid={hoveredFence?.r === r && hoveredFence?.c === c && hoveredFence?.orientation === 'h' ? isHoveredFenceValid : true}
                onHover={(r, c, orientation) => isMyTurn && setHoveredFence(orientation ? {r, c, orientation} : null)}
                onClick={handleFenceClick}
                theme={theme}
              />
            )}

            {r < BOARD_SIZE - 1 && c < BOARD_SIZE - 1 && (
              <FenceSlot 
                r={r} c={c} orientation="v"
                isPlaced={!!isFenceAt(r, c, 'v')}
                placedBy={isFenceAt(r, c, 'v')?.placedBy}
                isHovered={isMyTurn && hoveredFence?.r === r && hoveredFence?.c === c && hoveredFence?.orientation === 'v'}
                isValid={hoveredFence?.r === r && hoveredFence?.c === c && hoveredFence?.orientation === 'v' ? isHoveredFenceValid : true}
                onHover={(r, c, orientation) => isMyTurn && setHoveredFence(orientation ? {r, c, orientation} : null)}
                onClick={handleFenceClick}
                theme={theme}
              />
            )}
          </div>
        );
      }
      boardRows.push(
        <div key={`row-${r}`} className="flex gap-1.5 md:gap-2 mb-1.5 md:mb-2">
          {rowSquares}
        </div>
      );
    }
    return boardRows;
  };

  return (
    <div className={`${getBoardContainerStyle()} p-3 md:p-6 rounded-2xl inline-block relative overflow-visible transition-all duration-500`}>
      <div className="flex flex-col">
        {renderSquares()}
      </div>
      
      {/* Coordinates */}
      <div className={`absolute -left-6 md:-left-8 top-0 bottom-0 flex flex-col justify-between py-5 md:py-6 ${getLabelColor()} font-bold text-[10px] md:text-xs`}>
        {Array.from({length: 9}).map((_, i) => <span key={i}>{9-i}</span>)}
      </div>
      <div className={`absolute -bottom-6 md:-bottom-8 left-0 right-0 flex justify-between px-5 md:px-6 ${getLabelColor()} font-bold text-[10px] md:text-xs uppercase`}>
        {['a','b','c','d','e','f','g','h','i'].map((char) => <span key={char}>{char}</span>)}
      </div>
    </div>
  );
};

export default Board;
