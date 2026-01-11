
import React, { useState, useMemo } from 'react';
import Button from './Button';
import { GameSettings, TimerType, TimeoutAction } from '../types';
import { DEFAULT_SETTINGS } from '../services/gameLogic';

interface LobbyProps {
  onCreate: (name: string, settings: GameSettings) => void;
  onJoin: (id: string, name: string) => void;
  onEnter: () => void;
  currentRoomId?: string;
  isCreator?: boolean;
  playerName?: string;
}

const Lobby: React.FC<LobbyProps> = ({ onCreate, onJoin, onEnter, currentRoomId, isCreator, playerName }) => {
  const [name, setName] = useState(playerName || '');
  const [roomIdInput, setRoomIdInput] = useState(currentRoomId || '');
  const [isCopied, setIsCopied] = useState(false);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);

  const inviteUrl = useMemo(() => {
    if (!currentRoomId) return '';
    try {
      let base = window.location.href.split('#')[0];
      if (base.startsWith('blob:')) base = window.location.origin + window.location.pathname;
      const url = new URL(base);
      url.hash = currentRoomId;
      return url.toString();
    } catch (e) {
      return `${window.location.origin}${window.location.pathname}#${currentRoomId}`;
    }
  }, [currentRoomId]);

  const copyInvite = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {}
  };

  const shareWhatsApp = () => {
    const text = `Join my Quoridor game! Challenge accepted? 🏆\nRoom: ${currentRoomId}\n${inviteUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareInvite = async () => {
    if (navigator.share && inviteUrl) {
      try {
        await navigator.share({
          title: 'Quoridor Online Challenge',
          text: `Join my game! Room: ${currentRoomId}`,
          url: inviteUrl,
        });
      } catch (err) {}
    } else {
      copyInvite();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-slate-100 overflow-hidden relative">
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl"></div>
        
        <div className="text-center mb-6 relative">
          <div className="w-16 h-16 bg-amber-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg transform -rotate-3">
            <i className="fa-solid fa-chess-pawn text-3xl text-white"></i>
          </div>
          <h1 className="heading-font text-3xl text-slate-900 font-bold mb-1 uppercase">Quoridor</h1>
          <p className="text-slate-500 font-medium text-xs tracking-widest uppercase">Championship Edition</p>
        </div>

        <div className="space-y-4 relative">
          {!currentRoomId ? (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Player Name"
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-amber-500 bg-slate-50/50 outline-none transition-all font-medium text-sm"
                />
              </div>

              {/* Tournament Mode Settings */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-trophy text-amber-500 text-xs"></i>
                    <span className="text-xs font-bold text-slate-700">Tournament Mode</span>
                  </div>
                  <button 
                    onClick={() => setSettings(s => ({ ...s, isTournament: !s.isTournament, timerType: !s.isTournament ? 'turn' : 'none' }))}
                    className={`w-10 h-5 rounded-full transition-all relative ${settings.isTournament ? 'bg-amber-600' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.isTournament ? 'left-6' : 'left-1'}`}></div>
                  </button>
                </div>

                {settings.isTournament && (
                  <div className="pt-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-2 gap-2">
                      {(['turn', 'match'] as TimerType[]).map(t => (
                        <button 
                          key={t}
                          onClick={() => setSettings(s => ({ ...s, timerType: t }))}
                          className={`py-2 text-[10px] font-bold rounded-lg border-2 uppercase tracking-widest transition-all ${settings.timerType === t ? 'border-amber-500 bg-white text-amber-600' : 'border-slate-100 text-slate-400 bg-white'}`}
                        >
                          {t} Timer
                        </button>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Limit</span>
                      <div className="flex items-center gap-3">
                         <button onClick={() => setSettings(s => ({ ...s, timerLimit: Math.max(10, s.timerLimit - 10) }))} className="text-slate-400 hover:text-amber-500"><i className="fa-solid fa-minus"></i></button>
                         <span className="text-xs font-bold font-mono">{settings.timerLimit}s</span>
                         <button onClick={() => setSettings(s => ({ ...s, timerLimit: s.timerLimit + 10 }))} className="text-slate-400 hover:text-amber-500"><i className="fa-solid fa-plus"></i></button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">On Timeout</span>
                       <div className="flex gap-1">
                         {(['forfeit', 'end'] as TimeoutAction[]).map(a => (
                            <button 
                              key={a}
                              onClick={() => setSettings(s => ({ ...s, timeoutAction: a }))}
                              className={`px-3 py-1 text-[9px] font-bold rounded-md transition-all ${settings.timeoutAction === a ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-500'}`}
                            >
                              {a === 'forfeit' ? 'FORFEIT TURN' : 'END GAME'}
                            </button>
                         ))}
                       </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 space-y-3">
                <Button onClick={() => name && onCreate(name, settings)} className="w-full py-3.5 rounded-xl shadow-lg" disabled={!name}>
                  Create Game
                </Button>
                <div className="flex items-center gap-2">
                  <div className="flex-1 border-t border-slate-100"></div>
                  <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">or Join</span>
                  <div className="flex-1 border-t border-slate-100"></div>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={roomIdInput}
                    onChange={(e) => setRoomIdInput(e.target.value)}
                    placeholder="Room ID"
                    className="flex-1 px-4 py-2 rounded-xl border-2 border-slate-100 bg-white outline-none text-xs font-mono"
                  />
                  <Button variant="secondary" onClick={() => name && roomIdInput && onJoin(roomIdInput, name)} className="px-5 rounded-xl" disabled={!name || !roomIdInput}>Join</Button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">Awaiting Opponent</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-600 bg-amber-100 px-2 py-0.5 rounded">#{currentRoomId}</span>
                </div>
                <div className="flex gap-2">
                  <input readOnly value={inviteUrl} className="flex-1 bg-white border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-900 outline-none truncate font-mono" />
                  <div className="flex gap-1 shrink-0">
                    <button 
                      onClick={copyInvite} 
                      title="Copy Link"
                      className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all ${isCopied ? 'bg-green-500 text-white' : 'bg-white border border-amber-200 text-amber-600 hover:bg-amber-100'}`}
                    >
                      {isCopied ? <i className="fa-solid fa-check"></i> : <i className="fa-solid fa-copy"></i>}
                    </button>
                    <button 
                      onClick={shareWhatsApp} 
                      title="Share via WhatsApp"
                      className="h-9 w-9 bg-[#25D366] text-white rounded-lg flex items-center justify-center hover:bg-[#128C7E] transition-colors"
                    >
                      <i className="fa-brands fa-whatsapp text-lg"></i>
                    </button>
                    <button 
                      onClick={shareInvite} 
                      title="System Share"
                      className="h-9 w-9 bg-amber-600 text-white rounded-lg flex items-center justify-center hover:bg-amber-700 transition-colors"
                    >
                      <i className="fa-solid fa-share-nodes"></i>
                    </button>
                  </div>
                </div>
              </div>

              {!playerName && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Your Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Player Name" className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-amber-500 bg-white outline-none text-sm" />
                </div>
              )}

              <Button onClick={() => { if (playerName) onEnter(); else if (name) { onJoin(currentRoomId, name); onEnter(); } }} className="w-full py-4 rounded-xl shadow-lg" disabled={!name && !playerName}>
                <i className="fa-solid fa-play-circle text-xl mr-2"></i> Start Match
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Lobby;
