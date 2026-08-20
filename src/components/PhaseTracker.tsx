import React from 'react';
import { GamePhase, DeviceMode } from '../types';
import { Lock, Play, RotateCcw, ShieldAlert, BookOpen, Settings, Volume2, VolumeX, ListOrdered, QrCode, Monitor, Phone, Layout, Timer } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface PhaseTrackerProps {
  currentTurn: number;
  phase: GamePhase;
  readyCount: number;
  totalHeroes: number;
  isBossReady: boolean;
  deviceMode: DeviceMode;
  roomCode: string;
  isPlayerMode?: boolean;
  commitTimeLeft?: number;
  onChangeDeviceMode: (mode: DeviceMode) => void;
  onOpenQrModal: () => void;
  onFastLockInAll: () => void;
  onExecuteTurn: () => void;
  onOpenRules: () => void;
  onOpenSettings: () => void;
  onToggleLog: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onRestartGame?: () => void;
}

export const PhaseTracker: React.FC<PhaseTrackerProps> = ({
  currentTurn,
  phase,
  readyCount,
  totalHeroes,
  isBossReady,
  deviceMode,
  roomCode,
  isPlayerMode = false,
  commitTimeLeft = 60,
  onChangeDeviceMode,
  onOpenQrModal,
  onFastLockInAll,
  onExecuteTurn,
  onOpenRules,
  onOpenSettings,
  onToggleLog,
  soundEnabled,
  onToggleSound,
  onRestartGame,
}) => {
  const allHeroesReady = readyCount === totalHeroes;
  const readyForResolution = allHeroesReady && isBossReady && phase === 'COMMIT';

  return (
    <header id="game-header-phase-tracker" className="bg-slate-900 border-b border-slate-800 text-slate-100 px-4 py-3 sticky top-0 z-30 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Title & Room Code QR trigger */}
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 text-slate-950 font-black text-sm px-3 py-1 rounded-full shadow-inner tracking-wider uppercase">
            Turn {currentTurn}
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              同步雙卡對戰
            </h1>
          </div>

          {/* QR Code Room Invitation Button */}
          <button
            onClick={onOpenQrModal}
            className="bg-cyan-950 text-cyan-300 border border-cyan-500 text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer hover:bg-cyan-900/60"
            title={isPlayerMode ? '房間代碼' : '開啟手機連線 QR Code'}
          >
            <QrCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>房間 {roomCode}</span>
          </button>
        </div>

        {/* Device Mode Switcher or Player Mode Badge */}
        {isPlayerMode ? (
          <div className="flex items-center gap-1.5 bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs px-3 py-1.5 rounded-xl font-bold shadow-inner">
            <Phone className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>📱 玩家手機控制端</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => onChangeDeviceMode('HOST_MAIN')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer ${
                deviceMode === 'HOST_MAIN'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="主螢幕 BOSS 視角"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">房長主螢幕</span>
            </button>

            <button
              onClick={() => onChangeDeviceMode('PLAYER_MOBILE')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer ${
                deviceMode === 'PLAYER_MOBILE'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="手機玩家控制端視角"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">手機控制端</span>
            </button>

            <button
              onClick={() => onChangeDeviceMode('SPLIT_SIMULATOR')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer ${
                deviceMode === 'SPLIT_SIMULATOR'
                  ? 'bg-purple-500 text-slate-100 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="雙螢幕同步對戰模擬器"
            >
              <Layout className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">雙螢幕模擬器</span>
            </button>
          </div>
        )}

        {/* Phase Timeline Stepper */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          {/* Step 1: Commit Phase */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
              phase === 'COMMIT'
                ? 'bg-amber-950 text-amber-300 border border-amber-500 shadow-sm'
                : 'text-slate-400 opacity-60'
            }`}
          >
            <Lock className={`w-3 h-3 ${phase === 'COMMIT' ? 'text-amber-400 animate-pulse' : ''}`} />
            <span>1. 雙卡鎖定</span>
          </div>

          <span className="text-slate-600 font-bold">→</span>

          {/* Step 2: Resolution Phase */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
              phase === 'RESOLVING'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500 shadow-sm'
                : 'text-slate-400 opacity-60'
            }`}
          >
            <Play className={`w-3 h-3 ${phase === 'RESOLVING' ? 'text-emerald-400 animate-spin' : ''}`} />
            <span>2. 交錯結算</span>
          </div>

          <span className="text-slate-600 font-bold">→</span>

          {/* Step 3: End Phase */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
              phase === 'END_TURN'
                ? 'bg-indigo-950 text-indigo-300 border border-indigo-500 shadow-sm'
                : 'text-slate-400 opacity-60'
            }`}
          >
            <RotateCcw className="w-3 h-3 text-indigo-400" />
            <span>3. 回合重整</span>
          </div>
        </div>

        {/* Action Controls & Readiness */}
        <div className="flex items-center gap-2">
          {phase === 'COMMIT' && (
            <>
              {/* Countdown Timer Badge */}
              <div className={`text-xs px-2.5 py-1 rounded-lg border font-mono font-bold flex items-center gap-1.5 shadow ${
                commitTimeLeft <= 10
                  ? 'bg-rose-950 text-rose-300 border-rose-500 animate-bounce'
                  : commitTimeLeft <= 25
                  ? 'bg-amber-950 text-amber-300 border-amber-500'
                  : 'bg-slate-950 text-cyan-300 border-slate-800'
              }`}>
                <Timer className="w-3.5 h-3.5" />
                <span>限時: {commitTimeLeft}s</span>
              </div>

              {readyForResolution ? (
                <div className="bg-emerald-950 text-emerald-300 border border-emerald-500 font-bold px-3 py-1.5 rounded-lg text-xs animate-pulse flex items-center gap-1.5 shadow-lg">
                  <Play className="w-3.5 h-3.5 fill-emerald-300 animate-spin" />
                  全員鎖定！自動開始交錯結算...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="text-xs bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300">
                    {totalHeroes === 0 ? (
                      <span className="text-cyan-400 font-bold">等待玩家掃碼加入...</span>
                    ) : (
                      <>
                        <span className="text-amber-400 font-bold">{readyCount}</span> / {totalHeroes} 鎖定
                      </>
                    )}
                    <span className="mx-1 text-slate-600">|</span>
                    BOSS: <span className={isBossReady ? 'text-emerald-400 font-bold' : 'text-slate-500'}>{isBossReady ? '已備戰' : '準備中...'}</span>
                  </div>
                  {!isPlayerMode && !allHeroesReady && totalHeroes > 0 && (
                    <button
                      id="btn-fast-lock-in"
                      onClick={() => {
                        soundFx.playLockIn();
                        onFastLockInAll();
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500 text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition cursor-pointer"
                      title="替尚未鎖定的玩家自動選擇卡牌並鎖定"
                    >
                      <Lock className="w-3 h-3" />
                      一鍵全員鎖定
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Quick Toolbar */}
          <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
            <button
              id="btn-toggle-sound"
              onClick={onToggleSound}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
              title={soundEnabled ? '關閉音效' : '開啟音效'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-600" />}
            </button>
            <button
              id="btn-toggle-log"
              onClick={onToggleLog}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
              title="戰鬥日誌"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              id="btn-open-rules"
              onClick={onOpenRules}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
              title="檢視同步雙卡交錯結算規則"
            >
              <BookOpen className="w-4 h-4" />
            </button>
            {!isPlayerMode && onRestartGame && (
              <button
                id="btn-restart-game"
                onClick={() => {
                  if (window.confirm('確定要重新開始關卡嗎？將從第 1 關【黃色土狗】重新開始！')) {
                    onRestartGame();
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition"
                title="重新開始關卡 (從土狗開始)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            {!isPlayerMode && (
              <button
                id="btn-open-settings"
                onClick={onOpenSettings}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
                title="遊戲機制設定"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

