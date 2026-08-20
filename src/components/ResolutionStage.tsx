import React, { useEffect, useState } from 'react';
import { CommittedAction, Boss, Hero } from '../types';
import { Play, FastForward, CheckCircle2, Zap, ArrowRight, Shield, Heart, Sword, Sparkles, Skull } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../utils/audio';
import { getCardCategoryBadgeInfo } from '../data/cards';

interface ResolutionStageProps {
  actionQueue: CommittedAction[];
  currentActionIndex: number;
  boss: Boss;
  heroes: Hero[];
  onExecuteNextStep: () => void;
  onFinishResolution: () => void;
}

export const ResolutionStage: React.FC<ResolutionStageProps> = ({
  actionQueue,
  currentActionIndex,
  boss,
  heroes,
  onExecuteNextStep,
  onFinishResolution,
}) => {
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const isFinished = currentActionIndex >= actionQueue.length;

  // Auto playback interval (2.0s interval between cards)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAutoPlaying && !isFinished) {
      timer = setTimeout(() => {
        onExecuteNextStep();
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [isAutoPlaying, currentActionIndex, isFinished, onExecuteNextStep]);

  const currentAction = actionQueue[currentActionIndex];

  return (
    <div id="resolution-stage-modal" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
      {/* Stage Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-800 pb-4 mb-4 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-950 text-emerald-300 border border-emerald-500 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 animate-pulse">
              <Zap className="w-3.5 h-3.5 text-emerald-400" /> 同步卡牌順序結算中 (Simultaneous Resolution)
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-100 mt-1">
            行動序列 (Calculated Action Queue)
          </h2>
          <p className="text-xs text-slate-400">
            算牌優先度：<strong className="text-cyan-300">🛡️ 防禦牌</strong> ＞ <strong className="text-emerald-300">🍃 休息</strong> ＞ <strong className="text-purple-300">⚡ 威嚇</strong> ＞ <strong className="text-rose-300">⚔️ 攻擊</strong>；同類型牌依照敏捷度與優先級排序。
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          {!isFinished && (
            <>
              <button
                id="btn-auto-play-toggle"
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                  isAutoPlaying
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <FastForward className="w-3.5 h-3.5" />
                {isAutoPlaying ? '自動播放中...' : '手動單步'}
              </button>

              <button
                id="btn-next-action-step"
                onClick={() => {
                  soundFx.playCardSelect();
                  onExecuteNextStep();
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-md flex items-center gap-1 cursor-pointer transition active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                下一步動作
              </button>
            </>
          )}

          {isFinished && (
            <button
              id="btn-finish-resolution"
              onClick={() => {
                soundFx.playPhaseTransition();
                onFinishResolution();
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-bold px-5 py-2 rounded-xl text-xs sm:text-sm shadow-lg flex items-center gap-2 animate-bounce cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              結算完畢！進入回合重整 (End Phase)
            </button>
          )}
        </div>
      </div>

      {/* Action Queue Cards Line */}
      <div className="my-4">
        <div className="text-xs font-bold text-slate-400 mb-2 flex items-center justify-between">
          <span>結算優先順序（防禦 ＞ 休息 ＞ 威嚇 ＞ 攻擊）</span>
          <span>{currentActionIndex} / {actionQueue.length} 已發動</span>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-slate-700">
          {actionQueue.map((item, idx) => {
            const isCurrent = idx === currentActionIndex;
            const isPast = idx < currentActionIndex;
            const isActorBoss = item.actorType === 'BOSS';
            const isDeadPlayer = !isActorBoss && heroes.some((h) => h.id === item.actorId && h.hp <= 0);
            const categoryBadge = getCardCategoryBadgeInfo(item.card);

            return (
              <div
                key={item.id}
                className={`flex-shrink-0 w-36 sm:w-44 rounded-xl p-3 border transition-all duration-300 relative ${
                  isDeadPlayer
                    ? 'bg-slate-950 border-slate-800 opacity-40 grayscale'
                    : isCurrent
                    ? 'bg-slate-800 border-amber-400 ring-2 ring-amber-400 shadow-xl scale-105 z-10'
                    : isPast
                    ? 'bg-slate-950 border-slate-800 opacity-50 grayscale'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                {/* Order Badge & Slot Index */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300">
                    #{idx + 1}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-purple-950 text-purple-300 border-purple-500">
                    第 {item.cardOrder || item.slotIndex || 1} 張
                  </span>
                </div>

                {/* Actor Info */}
                <div className="text-xs font-bold text-slate-100 flex items-center gap-1 line-clamp-1">
                  {isActorBoss ? (
                    <Skull className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  {item.actorName}
                </div>

                {/* Category & Priority Badge */}
                <div className="mt-1.5 flex items-center justify-between gap-1">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${categoryBadge.badgeClass}`}>
                    {categoryBadge.label}
                  </span>
                </div>

                {/* Card Info */}
                <div className="mt-2 bg-slate-900 rounded-lg p-2 border border-slate-800 text-center">
                  <div className="text-xs font-bold text-amber-300">{item.card.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    優先級: {item.card.priority}
                  </div>
                </div>

                {/* Execution Status */}
                <div className="mt-2 text-[10px] text-center font-semibold">
                  {isDeadPlayer ? (
                    <span className="text-rose-400">💀 已陣亡 (跳過)</span>
                  ) : isCurrent ? (
                    <span className="text-amber-400 animate-pulse">⚡ 正在發動中...</span>
                  ) : isPast ? (
                    <span className="text-emerald-400">✓ 已執行</span>
                  ) : (
                    <span className="text-slate-500">等待發動</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Currently Executing Spotlight View */}
      <AnimatePresence mode="wait">
        {currentAction && !isFinished && (
          <motion.div
            key={currentAction.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-950 border border-amber-500 rounded-xl p-4 my-2 flex flex-col md:flex-row items-center justify-between gap-4 shadow-inner"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-950 border border-amber-500 text-amber-400">
                <Sparkles className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <div className="text-xs text-amber-400 font-bold uppercase tracking-wider flex items-center gap-2">
                  <span>發動者: {currentAction.actorName}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getCardCategoryBadgeInfo(currentAction.card).badgeClass}`}>
                    {getCardCategoryBadgeInfo(currentAction.card).label}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2 mt-0.5">
                  <span>{currentAction.card.name}</span>
                  <span className="text-xs bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-500">
                    優先級 {currentAction.card.priority}
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">{currentAction.card.description}</p>
              </div>
            </div>

            <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 text-xs text-slate-300 text-center md:text-right">
              <span className="text-slate-400 block mb-0.5">預計影響:</span>
              <span className="font-bold text-emerald-400">
                {currentAction.card.damage ? `${currentAction.card.damage} 傷害` : ''}
                {currentAction.card.block ? ` +${currentAction.card.block} 護甲` : ''}
                {currentAction.card.heal ? ` +${currentAction.card.heal} 治癒` : ''}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
