import React from 'react';
import { Boss, FloatingText } from '../types';
import { Flame, Shield, Zap, HelpCircle, Skull, VolumeX, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StatusBadges } from './StatusBadges';

interface BossPanelProps {
  boss: Boss;
  floatingTexts: FloatingText[];
  revealIntelMode: 'FULL_SECRET' | 'CARD_TYPE_ONLY' | 'REVEALED';
}

export const BossPanel: React.FC<BossPanelProps> = ({
  boss,
  floatingTexts,
  revealIntelMode,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (boss.hp / boss.maxHp) * 100));
  const isEnraged = boss.hp > 0 && hpPercent <= 30;

  return (
    <div id="boss-panel-card" className="relative bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl overflow-hidden">
      {/* Floating text animations overlay (Always on Top Layer) */}
      <div className="absolute inset-0 pointer-events-none z-[100] flex items-center justify-center">
        <AnimatePresence>
          {floatingTexts
            .filter((ft) => ft.targetId === boss.id || ft.targetId === 'ALL')
            .map((ft) => (
              <motion.div
                key={ft.id}
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: -45, scale: 1.4 }}
                exit={{ opacity: 0, y: -65 }}
                transition={{ duration: 0.8 }}
                className={`text-2xl font-black px-4 py-1.5 rounded-full shadow-[0_0_25px_rgba(0,0,0,0.9)] border-2 z-[100] ${
                  ft.type === 'damage'
                    ? 'text-rose-200 bg-rose-950/95 border-rose-500 ring-2 ring-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.9)]'
                    : ft.type === 'heal'
                    ? 'text-emerald-200 bg-emerald-950/95 border-emerald-500 ring-2 ring-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.9)]'
                    : ft.type === 'block'
                    ? 'text-cyan-200 bg-cyan-950/95 border-cyan-500 ring-2 ring-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.9)]'
                    : 'text-amber-200 bg-amber-950/95 border-amber-500 ring-2 ring-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.9)]'
                }`}
              >
                {ft.text}
              </motion.div>
            ))}
        </AnimatePresence>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Boss Identity & Status Bar */}
        <div className="flex-1 w-full">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center p-1 overflow-hidden ${isEnraged ? 'bg-rose-950 border-rose-600 text-rose-400 animate-pulse' : 'bg-amber-950 border-amber-600 text-amber-400'}`}>
                {boss.imageUrl ? (
                  <img
                    src={boss.imageUrl}
                    alt={boss.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-2xl">{boss.bossKey === 'CAT' ? '🐱' : '🐕'}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-100">{boss.name}</h2>
                  {isEnraged && (
                    <span className="bg-rose-950 text-rose-400 border border-rose-500 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 animate-bounce">
                      <Skull className="w-3 h-3" /> 狂暴狀態
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-medium">{boss.title}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-slate-300 text-xs bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>基礎敏捷: {boss.speed}</span>
              </div>
              {boss.shield > 0 && (
                <div className="flex items-center gap-1 text-cyan-300 text-xs bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-600 font-bold">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{boss.shield} 護甲</span>
                </div>
              )}
            </div>
          </div>

          {/* HP Bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-400">生命值 (HP)</span>
              <span className="text-slate-200">{boss.hp} / {boss.maxHp} ({Math.round(hpPercent)}%)</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-3.5 p-0.5 border border-slate-800 relative overflow-hidden">
              <motion.div
                className={`h-full rounded-full transition-all duration-300 ${
                  isEnraged ? 'bg-rose-600' : 'bg-purple-600'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Status Effects List */}
          <StatusBadges statuses={boss.statuses} isEnraged={isEnraged} />
        </div>

        {/* Synchronized Boss Card Intent Slot */}
        <div id="boss-intent-slot" className="w-full md:w-64 bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center text-center relative group">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            BOSS 出牌意圖
          </div>

          {boss.intent && boss.intent.selectedCards && boss.intent.selectedCards.length > 0 ? (
            <div className="w-full flex items-center gap-2 flex-wrap justify-center">
              {boss.intent.selectedCards.map((card, idx) => (
                <div key={`boss_intent_panel_${card.id}_${idx}`} className="bg-slate-900 border border-amber-500 rounded-lg p-2 text-left relative overflow-hidden flex-1 min-w-[100px]">
                  <span className="text-[10px] font-bold text-amber-400 block mb-0.5">#{idx + 1}</span>
                  <div className="text-xs font-bold text-slate-200 line-clamp-1">{card.name}</div>
                  <div className="text-[10px] text-amber-300">優先級: {card.priority} | 費 {card.cost}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-3 text-xs text-slate-500 italic">等待選定 BOSS 卡牌...</div>
          )}
        </div>
      </div>
    </div>
  );
};
