
import { Position, Fence, PlayerId, GameState, Player, GameSettings } from '../types';

export const BOARD_SIZE = 9;

export const DEFAULT_SETTINGS: GameSettings = {
  isTournament: false,
  timerType: 'none',
  timerLimit: 30,
  timeoutAction: 'forfeit'
};

export const createInitialState = (settings: GameSettings = DEFAULT_SETTINGS): GameState => ({
  players: [
    {
      id: 0,
      name: 'Player 1',
      pos: { r: 8, c: 4 },
      fencesRemaining: 10,
      targetRow: 0,
      timeRemaining: settings.timerType === 'match' ? settings.timerLimit : settings.timerLimit,
    },
    {
      id: 1,
      name: 'Player 2',
      pos: { r: 0, c: 4 },
      fencesRemaining: 10,
      targetRow: 8,
      timeRemaining: settings.timerType === 'match' ? settings.timerLimit : settings.timerLimit,
    },
  ],
  currentTurn: 0,
  fences: [],
  winner: null,
  history: ['Game started'],
  lastActionAt: Date.now(),
  settings: settings,
});

export const INITIAL_STATE = createInitialState();

export const isBlockedByFence = (p1: Position, p2: Position, fences: Fence[]): boolean => {
  const rMin = Math.min(p1.r, p2.r);
  const cMin = Math.min(p1.c, p2.c);
  if (p1.c === p2.c) {
    return fences.some(f => f.orientation === 'h' && f.r === rMin && (f.c === cMin || f.c === cMin - 1));
  }
  if (p1.r === p2.r) {
    return fences.some(f => f.orientation === 'v' && f.c === cMin && (f.r === rMin || f.r === rMin - 1));
  }
  return false;
};

export const getValidMoves = (playerId: PlayerId, state: GameState): Position[] => {
  const player = state.players[playerId];
  const opponent = state.players[1 - playerId];
  const pos = player.pos;
  const oppPos = opponent.pos;
  const moves: Position[] = [];
  const directions = [{ dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }];

  directions.forEach(({ dr, dc }) => {
    const next = { r: pos.r + dr, c: pos.c + dc };
    if (next.r < 0 || next.r >= BOARD_SIZE || next.c < 0 || next.c >= BOARD_SIZE) return;
    if (isBlockedByFence(pos, next, state.fences)) return;

    if (next.r === oppPos.r && next.c === oppPos.c) {
      const jump = { r: next.r + dr, c: next.c + dc };
      const isJumpBlocked = jump.r < 0 || jump.r >= BOARD_SIZE || jump.c < 0 || jump.c >= BOARD_SIZE || isBlockedByFence(next, jump, state.fences);
      if (!isJumpBlocked) {
        moves.push(jump);
      } else {
        const sideDirs = dr !== 0 ? [{ dr: 0, dc: -1 }, { dr: 0, dc: 1 }] : [{ dr: -1, dc: 0 }, { dr: 1, dc: 0 }];
        sideDirs.forEach(sd => {
          const diag = { r: next.r + sd.dr, c: next.c + sd.dc };
          if (diag.r >= 0 && diag.r < BOARD_SIZE && diag.c >= 0 && diag.c < BOARD_SIZE && !isBlockedByFence(next, diag, state.fences)) {
            moves.push(diag);
          }
        });
      }
    } else {
      moves.push(next);
    }
  });
  return moves;
};

export const isValidFencePlacement = (fence: Fence, state: GameState): boolean => {
  const { r, c, orientation } = fence;
  if (r < 0 || r >= BOARD_SIZE - 1 || c < 0 || c >= BOARD_SIZE - 1) return false;
  if (state.fences.some(f => f.r === r && f.c === c)) return false;
  if (orientation === 'h') {
    if (state.fences.some(f => f.orientation === 'h' && f.r === r && (f.c === c - 1 || f.c === c + 1))) return false;
  } else {
    if (state.fences.some(f => f.orientation === 'v' && f.c === c && (f.r === r - 1 || f.r === r + 1))) return false;
  }
  const hypotheticalFences = [...state.fences, fence];
  return state.players.every(player => hasPathToGoal(player, hypotheticalFences));
};

const hasPathToGoal = (player: Player, fences: Fence[]): boolean => {
  const queue: Position[] = [player.pos];
  const visited = new Set<string>();
  visited.add(`${player.pos.r},${player.pos.c}`);
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.r === player.targetRow) return true;
    const neighbors = [{ r: current.r - 1, c: current.c }, { r: current.r + 1, c: current.c }, { r: current.r, c: current.c - 1 }, { r: current.r, c: current.c + 1 }];
    for (const next of neighbors) {
      const key = `${next.r},${next.c}`;
      if (next.r >= 0 && next.r < BOARD_SIZE && next.c >= 0 && next.c < BOARD_SIZE && !visited.has(key) && !isBlockedByFence(current, next, fences)) {
        visited.add(key);
        queue.push(next);
      }
    }
  }
  return false;
};
