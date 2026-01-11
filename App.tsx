
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, SyncMessage, PlayerId, Position, FenceOrientation, Theme, GameSettings } from './types';
import { createInitialState, getValidMoves, isValidFencePlacement, DEFAULT_SETTINGS } from './services/gameLogic';
import { MultiplayerService, ConnectionStatus } from './services/multiplayer';
import { soundEngine } from './services/soundEngine';
import Lobby from './components/Lobby';
import Board from './components/Board';
import Button from './components/Button';

const App: React.FC = () => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [myPlayerId, setMyPlayerId] = useState<PlayerId | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [opponentName, setOpponentName] = useState('Waiting...');
  const [isMuted, setIsMuted] = useState(false);
  const [theme, setTheme] = useState<Theme>('classic');
  const [hasEnteredGame, setHasEnteredGame] = useState(false);
  const [connStatus, setConnStatus] = useState<ConnectionStatus>('disconnected');
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  const multiplayerRef = useRef<MultiplayerService | null>(null);
  const stateRef = useRef<GameState>(gameState);
  const playerInfoRef = useRef({ name: playerName, id: myPlayerId });

  useEffect(() => { stateRef.current = gameState; }, [gameState]);
  useEffect(() => { playerInfoRef.current = { name: playerName, id: myPlayerId }; }, [playerName, myPlayerId]);

  // Tick logic for timers
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 100);
    return () => clearInterval(interval);
  }, []);

  // Timer check effect
  useEffect(() => {
    if (gameState.winner !== null || gameState.settings.timerType === 'none') return;

    const currentTurn = gameState.currentTurn;
    const lastAction = gameState.lastActionAt;
    const elapsed = (currentTime - lastAction) / 1000;
    
    let timeRemaining = 0;
    if (gameState.settings.timerType === 'turn') {
      timeRemaining = gameState.settings.timerLimit - elapsed;
    } else {
      timeRemaining = gameState.players[currentTurn].timeRemaining - elapsed;
    }

    // Heartbeat logic
    if (timeRemaining < 5 && timeRemaining > 0 && Math.floor(timeRemaining * 2) !== Math.floor((timeRemaining + 0.1) * 2)) {
      soundEngine.play('heartbeat');
    }

    // Timeout logic
    if (timeRemaining <= 0) {
      handleTimeout();
    }
  }, [currentTime, gameState]);

  const handleTimeout = () => {
    if (myPlayerId !== 0) return; // Host handles logic to keep sync simple
    
    const { settings, currentTurn } = gameState;
    const newState = { ...gameState };

    if (settings.timeoutAction === 'end') {
      newState.winner = (1 - currentTurn) as PlayerId;
      newState.history = [`${gameState.players[currentTurn].name} timed out!`, ...newState.history];
    } else {
      // Forfeit Turn
      newState.history = [`${gameState.players[currentTurn].name} forfeited turn due to timeout`, ...newState.history];
      newState.currentTurn = (1 - currentTurn) as PlayerId;
      newState.lastActionAt = Date.now();
      // Match clock needs special care: update the player's bank
      if (settings.timerType === 'match') {
        newState.players[currentTurn].timeRemaining = Math.max(0, newState.players[currentTurn].timeRemaining - settings.timerLimit);
      }
    }
    
    syncState(newState);
  };

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash) {
      setRoomId(hash);
      if (myPlayerId === null) setMyPlayerId(1);
    }
  }, [myPlayerId]);

  const handleMessage = useCallback((msg: SyncMessage) => {
    const currentGameState = stateRef.current;
    const { name: currentPlayerName, id: currentPlayerId } = playerInfoRef.current;

    switch (msg.type) {
      case 'JOIN':
        if (currentPlayerId === 0) {
          setOpponentName(msg.sender);
          multiplayerRef.current?.sendMessage('SYNC', { ...currentGameState, opponentName: currentPlayerName }, currentPlayerName);
        }
        break;
      case 'SYNC':
        setGameState(msg.payload);
        if (currentPlayerId === 1) setOpponentName(msg.sender);
        break;
      case 'THEME': setTheme(msg.payload as Theme); break;
      case 'RESET': setGameState(createInitialState(currentGameState.settings)); break;
    }
  }, []);

  useEffect(() => {
    if (roomId && playerName && myPlayerId !== null && hasEnteredGame) {
      if (multiplayerRef.current) multiplayerRef.current.close();
      const svc = new MultiplayerService(roomId, handleMessage, (status) => setConnStatus(status), myPlayerId === 0);
      multiplayerRef.current = svc;
      const timeout = setTimeout(() => svc.sendMessage('JOIN', { name: playerName }, playerName), 2000);
      return () => { clearTimeout(timeout); svc.close(); multiplayerRef.current = null; };
    }
  }, [roomId, playerName, myPlayerId, hasEnteredGame, handleMessage]);

  const handleCreateGame = (name: string, settings: GameSettings) => {
    const newRoomId = Math.random().toString(36).substring(2, 9);
    setPlayerName(name);
    setRoomId(newRoomId);
    setMyPlayerId(0);
    setGameState(createInitialState(settings));
    window.location.hash = newRoomId;
  };

  const handleJoinGame = (id: string, name: string) => {
    setPlayerName(name);
    setRoomId(id);
    setMyPlayerId(1);
    window.location.hash = id;
  };

  // Fix: Added missing handleEnterGame function to allow users to start the match from the lobby
  const handleEnterGame = () => {
    setHasEnteredGame(true);
  };

  const syncState = (newState: GameState) => {
    setGameState(newState);
    multiplayerRef.current?.sendMessage('SYNC', newState, playerName);
  };

  const handleMove = (pos: Position) => {
    if (gameState.currentTurn !== myPlayerId || gameState.winner !== null) return;
    soundEngine.play('move');
    const newState = { ...gameState };
    
    // Update match clock bank if necessary
    if (gameState.settings.timerType === 'match') {
      const elapsed = (Date.now() - gameState.lastActionAt) / 1000;
      newState.players[myPlayerId].timeRemaining = Math.max(0, newState.players[myPlayerId].timeRemaining - elapsed);
    }

    newState.players[myPlayerId].pos = pos;
    newState.history = [`${playerName} moved`, ...newState.history].slice(0, 50);
    if (pos.r === newState.players[myPlayerId].targetRow) newState.winner = myPlayerId;
    newState.currentTurn = (1 - myPlayerId) as PlayerId;
    newState.lastActionAt = Date.now();
    syncState(newState);
  };

  const handlePlaceFence = (r: number, c: number, orientation: FenceOrientation) => {
    if (gameState.currentTurn !== myPlayerId || gameState.winner !== null) return;
    const fence = { r, c, orientation, placedBy: myPlayerId };
    if (!isValidFencePlacement(fence, gameState)) { soundEngine.play('error'); return; }
    soundEngine.play('fence');
    const newState = { ...gameState };

    if (gameState.settings.timerType === 'match') {
      const elapsed = (Date.now() - gameState.lastActionAt) / 1000;
      newState.players[myPlayerId].timeRemaining = Math.max(0, newState.players[myPlayerId].timeRemaining - elapsed);
    }

    newState.fences = [...newState.fences, fence];
    newState.players[myPlayerId].fencesRemaining -= 1;
    newState.history = [`${playerName} wall @ ${String.fromCharCode(65+c)}${9-r}`, ...newState.history].slice(0, 50);
    newState.currentTurn = (1 - myPlayerId) as PlayerId;
    newState.lastActionAt = Date.now();
    syncState(newState);
  };

  if (!hasEnteredGame || !roomId || myPlayerId === null) {
    return <Lobby onCreate={handleCreateGame} onJoin={handleJoinGame} onEnter={handleEnterGame} currentRoomId={roomId || undefined} isCreator={myPlayerId === 0} playerName={playerName} />;
  }

  const isMyTurn = gameState.currentTurn === myPlayerId && gameState.winner === null;
  const validMoves = getValidMoves(myPlayerId, gameState);

  return (
    <div className={`min-h-screen ${theme === 'cyber' ? 'bg-slate-950 text-white' : 'bg-slate-50'} flex flex-col md:flex-row p-4 md:p-8 gap-8 items-center justify-center relative overflow-hidden`}>
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none select-none overflow-hidden">
        <h1 className="text-[20vw] font-black absolute -top-10 -left-10 rotate-12">QUORIDOR</h1>
      </div>

      <div className="w-full md:w-80 flex flex-col gap-4 z-10">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connStatus === 'connected' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></div>
              <h2 className="font-bold text-slate-800 text-sm">Room {roomId}</h2>
            </div>
            <div className="flex gap-1">
              {gameState.settings.isTournament && (
                <div className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter">TOURNAMENT</div>
              )}
              <Button variant="ghost" onClick={() => { soundEngine.setMuted(!isMuted); setIsMuted(!isMuted); }} className="p-0 h-8 w-8">
                <i className={`fa-solid ${isMuted ? 'fa-volume-xmark text-rose-500' : 'fa-volume-high text-slate-300'}`}></i>
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {[1, 0].map(id => {
              const isActive = gameState.currentTurn === id;
              const isMe = id === myPlayerId;
              const player = gameState.players[id];
              
              // Calculate specific time display
              let timeRemaining = player.timeRemaining;
              if (isActive && gameState.winner === null && gameState.settings.timerType !== 'none') {
                const elapsed = (currentTime - gameState.lastActionAt) / 1000;
                if (gameState.settings.timerType === 'turn') {
                  timeRemaining = Math.max(0, gameState.settings.timerLimit - elapsed);
                } else {
                  timeRemaining = Math.max(0, player.timeRemaining - elapsed);
                }
              }
              const isDanger = isActive && timeRemaining < 5;

              return (
                <div key={id} className={`p-4 rounded-2xl border-2 transition-all relative ${isActive ? 'border-amber-500 bg-amber-50/50' : 'border-transparent bg-slate-50 opacity-80'}`}>
                  {isActive && isDanger && (
                    <div className="absolute inset-0 bg-rose-500/10 rounded-2xl animate-pulse pointer-events-none"></div>
                  )}
                  <div className="flex items-center gap-3 relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${id === 0 ? 'bg-white border-2 border-slate-200 shadow-sm' : 'bg-slate-800 text-white shadow-lg'}`}>
                       <i className="fa-solid fa-user text-[10px]"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black truncate text-slate-800 tracking-tight">{isMe ? playerName : (opponentName || 'Opponent')}</p>
                      <div className="flex gap-2">
                         <span className="text-[8px] text-slate-400 font-black tracking-widest uppercase">{isMe ? 'You' : 'Opp'}</span>
                         <span className="text-[8px] text-slate-400 font-black tracking-widest uppercase">{player.fencesRemaining} walls</span>
                      </div>
                    </div>
                    {gameState.settings.timerType !== 'none' && (
                      <div className={`text-right px-2 py-1 rounded-lg ${isDanger ? 'bg-rose-600 text-white animate-bounce' : 'bg-slate-100 text-slate-800'}`}>
                        <p className="text-xs font-mono font-black">{Math.ceil(timeRemaining)}s</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex gap-2">
            <Button variant="secondary" onClick={() => { if(confirm('Reset match?')) { const ns = createInitialState(gameState.settings); setGameState(ns); multiplayerRef.current?.sendMessage('RESET', null, playerName); }}} className="flex-1 text-[10px] py-2 rounded-xl font-black uppercase">Restart</Button>
            <Button variant="ghost" onClick={() => window.location.reload()} className="flex-1 text-[10px] py-2 rounded-xl font-black uppercase">Exit</Button>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 flex-1 overflow-hidden min-h-[150px] flex flex-col">
           <h3 className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-4">Live Match Feed</h3>
           <div className="space-y-3 overflow-y-auto pr-1">
              {gameState.history.map((h, i) => (
                <p key={i} className={`text-[10px] leading-tight flex gap-2 ${i === 0 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                  <span className="opacity-30">#{(gameState.history.length - i).toString().padStart(2, '0')}</span>
                  {h}
                </p>
              ))}
           </div>
        </div>
      </div>

      <div className="flex flex-col items-center z-10">
        <Board state={gameState} onMove={handleMove} onPlaceFence={handlePlaceFence} validMoves={validMoves} isMyTurn={isMyTurn} myId={myPlayerId} theme={theme} />
      </div>

      {/* Winner Overlay */}
      {gameState.winner !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-in fade-in duration-500">
           <div className="bg-white rounded-[2rem] p-10 max-w-sm w-full text-center shadow-[0_0_50px_rgba(245,158,11,0.3)] animate-in zoom-in slide-in-from-bottom-10 duration-500">
              <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fa-solid fa-trophy text-5xl text-amber-500"></i>
              </div>
              <h2 className="heading-font text-4xl font-bold text-slate-900 mb-2">Checkmate!</h2>
              <p className="text-slate-500 mb-8 font-medium">
                {gameState.winner === myPlayerId ? 
                  "Congratulations! You've claimed the Quoridor championship title." : 
                  `${opponentName} has outmaneuvered you in this session.`
                }
              </p>
              <div className="flex flex-col gap-3">
                <Button onClick={() => { const ns = createInitialState(gameState.settings); setGameState(ns); multiplayerRef.current?.sendMessage('RESET', null, playerName); }} className="w-full py-4 text-lg">Play Again</Button>
                <Button variant="ghost" onClick={() => window.location.reload()} className="w-full">Return to Menu</Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
