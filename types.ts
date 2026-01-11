
export type PlayerId = 0 | 1;

export type Theme = 'classic' | 'cyber' | 'minimalist';

export interface Position {
  r: number;
  c: number;
}

export type FenceOrientation = 'h' | 'v';

export interface Fence {
  r: number;
  c: number;
  orientation: FenceOrientation;
  placedBy: PlayerId;
}

export type TimerType = 'none' | 'turn' | 'match';
export type TimeoutAction = 'forfeit' | 'end';

export interface GameSettings {
  isTournament: boolean;
  timerType: TimerType;
  timerLimit: number; // in seconds
  timeoutAction: TimeoutAction;
}

export interface Player {
  id: PlayerId;
  name: string;
  pos: Position;
  fencesRemaining: number;
  targetRow: number;
  timeRemaining: number; // For match clock (seconds)
}

export interface GameState {
  players: [Player, Player];
  currentTurn: PlayerId;
  fences: Fence[];
  winner: PlayerId | null;
  history: string[];
  lastActionAt: number;
  settings: GameSettings;
}

export interface SyncMessage {
  type: 'JOIN' | 'MOVE' | 'SYNC' | 'RESET' | 'CHAT' | 'THEME' | 'SETTINGS';
  payload: any;
  sender: string;
}
