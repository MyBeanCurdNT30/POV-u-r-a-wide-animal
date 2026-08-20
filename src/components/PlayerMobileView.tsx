import React, { useState } from 'react';
import { Hero, Card, CardType, Boss, GamePhase, CommittedAction, PlayerRole, PlayerEquipmentSelection } from '../types';
import { HandCard } from './HandCard';
import { Phone, Wifi, Shield, Zap, Lock, Unlock, CheckCircle2, RotateCcw, Flame, Heart, Sparkles, Feather, Sword, Timer, Play, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { soundFx } from '../utils/audio';
import { PLAYER_CLASSES } from '../data/racesAndEquipment';
import { getCardCategoryBadgeInfo } from '../data/cards';
import { StatusBadges } from './StatusBadges';
import { PlayerCreationWizardModal } from './PlayerCreationWizardModal';

interface PlayerMobileViewProps {
  activeHero?: Hero;
  boss: Boss;
  allHeroes: Hero[];
  isCommitPhase: boolean;
  commitTimeLeft?: number;
  phase?: GamePhase;
  screenState?: 'COVER' | 'PREPARATION' | 'BATTLE';
  isGoClicked?: boolean;
  isBattleStarted?: boolean;
  currentAction?: CommittedAction;
  onToggleCard: (heroId: string, card: Card) => void;
  onToggleReady: (heroId: string) => void;
  onSwitchHero: (heroId: string) => void;
  onAddHero?: (name: string, role: PlayerRole, equipment?: PlayerEquipmentSelection) => void;
}

export const PlayerMobileView: React.FC<PlayerMobileViewProps> = ({
  activeHero,
  boss,
  allHeroes,
  isCommitPhase,
  commitTimeLeft = 60,
  phase = 'COMMIT',
  screenState = 'BATTLE',
  isGoClicked = true,
  isBattleStarted,
  currentAction,
  onToggleCard,
  onToggleReady,
  onSwitchHero,
  onAddHero,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(!activeHero);

  const isGameInBattle = isBattleStarted !== undefined ? isBattleStarted : (screenState === 'BATTLE' && Boolean(isGoClicked));

  if (!activeHero) {
    return (
      <div className="max-w-md mx-auto w-full bg-slate-950 border-2 border-slate-800 rounded-3xl p-6 text-center text-slate-100 shadow-2xl space-y-5 animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
          <UserPlus className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-amber-300">
            歡迎加入同步雙卡對戰！
          </h2>
          <p className="text-xs text-slate-400">
            請為自己建立一名台灣原生動物英雄（自訂暱稱、種族與防具），完成後即可連線進入戰局。
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsWizardOpen(true)}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 hover:from-amber-400 hover:to-emerald-300 text-slate-950 font-black text-sm transition flex items-center justify-center gap-2 shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          <span>立即建立角色加入遊戲</span>
        </button>

        {allHeroes.length > 0 && onSwitchHero && (
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <p className="text-[11px] text-slate-400">或選擇已存在的角色進入：</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {allHeroes.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => onSwitchHero(h.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition cursor-pointer"
                >
                  {h.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Player Creation Wizard Modal */}
        {onAddHero && (
          <PlayerCreationWizardModal
            isOpen={isWizardOpen}
            isMandatory={true}
            onClose={() => setIsWizardOpen(false)}
            onAddHero={(name, role, equipment) => {
              onAddHero(name, role, equipment);
              setIsWizardOpen(false);
            }}
          />
        )}
      </div>
    );
  }

  const isKnockedOut = activeHero.hp <= 0;
  const hand = activeHero.hand || [];
  const selectedCardIds = activeHero.selectedCardIds || [];

  // Calculate current selected energy cost
  const selectedCards = selectedCardIds
    .map((id) => hand.find((c) => c.id === id))
    .filter((c): c is Card => Boolean(c));

  const totalCost = selectedCards.reduce((sum, c) => sum + c.cost, 0);

  // Filter hand cards by category
  const filteredHand = hand.filter((card) => {
    if (activeCategory === 'ALL') return true;
    if (activeCategory === 'ATTACK') return card.type === 'ATTACK';
    if (activeCategory === 'DEFENSE') return card.type === 'DEFENSE';
    if (activeCategory === 'REST') return card.type === 'REST';
    return true;
  });

  const handleCardClick = (card: Card) => {
    if (isKnockedOut || !isGameInBattle || activeHero.isReady || !isCommitPhase) return;
    onToggleCard(activeHero.id, card);
    soundFx.playCardSelect();
  };

  return (
    <div className="max-w-md mx-auto w-full bg-slate-950 border-2 border-slate-800 rounded-3xl p-4 shadow-2xl relative overflow-hidden text-slate-100 flex flex-col gap-4">
      {/* Mobile Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          {PLAYER_CLASSES[activeHero.role]?.imageUrl ? (
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500 overflow-hidden p-0.5 shrink-0 flex items-center justify-center">
              <img
                src={PLAYER_CLASSES[activeHero.role].imageUrl}
                alt={activeHero.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500 text-cyan-400">
              <Phone className="w-4 h-4" />
            </div>
          )}
          <div>
            <div className="text-[11px] font-bold text-cyan-400 flex items-center gap-1">
              <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" />
              {isKnockedOut ? '已陣亡觀戰中' : isGameInBattle ? '手機玩家控制端' : '準備大廳連線中'}
            </div>
            <div className="text-sm font-black text-slate-100 flex items-center gap-1">
              <span>{activeHero.name}</span>
              <span className="text-[10px] bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded border border-slate-700 font-bold">
                {PLAYER_CLASSES[activeHero.role]?.name || activeHero.role}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Timer Badge during COMMIT phase */}
          {isKnockedOut ? (
            <div className="text-[11px] px-2.5 py-1 rounded-lg border border-rose-600 bg-rose-950/80 text-rose-300 font-bold flex items-center gap-1">
              💀 陣亡
            </div>
          ) : isGameInBattle && isCommitPhase ? (
            <div className={`text-xs px-2.5 py-1 rounded-lg border font-mono font-bold flex items-center gap-1.5 ${
              commitTimeLeft <= 10
                ? 'bg-rose-950 text-rose-300 border-rose-500 animate-bounce'
                : 'bg-slate-950 text-cyan-300 border-slate-800'
            }`}>
              <Timer className="w-3.5 h-3.5" />
              <span>{commitTimeLeft}s</span>
            </div>
          ) : (
            <div className="text-[11px] px-2.5 py-1 rounded-lg border border-amber-500/50 bg-amber-950/40 text-amber-300 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              準備中
            </div>
          )}
        </div>
      </div>

      {/* Preparation Waiting Stage Banner */}
      {!isGameInBattle && !isKnockedOut && (
        <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-2 border-dashed border-amber-400/80 rounded-2xl p-4 text-center space-y-3 shadow-xl animate-fadeIn">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto text-2xl animate-pulse">
            ⏳
          </div>
          <div className="space-y-1">
            <div className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              等待主持人開始戰鬥 (GO)
            </div>
            <h3 className="text-base font-black text-slate-100">
              【{activeHero.name}】已成功就位！
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              請注視主螢幕！待主持人按下「<span className="text-amber-300 font-bold">GO 進入戰場</span>」後，出牌與鎖定功能將立即開放。
            </p>
          </div>
        </div>
      )}

      {/* Active Resolution Banner during RESOLVING phase */}
      {phase === 'RESOLVING' && currentAction && !isKnockedOut && (
        <div className="bg-emerald-950 border border-emerald-500 rounded-2xl p-2.5 text-xs text-emerald-200 font-bold flex items-center justify-between shadow-lg animate-pulse">
          <span className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-400 animate-spin" />
            自動結算中：{currentAction.actorName} 發動【{currentAction.card.name}】
          </span>
          <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-emerald-400 border border-emerald-700">
            請觀看大螢幕
          </span>
        </div>
      )}

      {/* Hero Vitals & Stats Bar */}
      {(() => {
        const isMobileHeroResting = !isKnockedOut && phase === 'RESOLVING' && currentAction?.actorId === activeHero.id && currentAction?.card.type === 'REST';
        return (
          <div className={`relative bg-slate-900 border rounded-2xl p-3 space-y-2 transition-all ${
            isKnockedOut
              ? 'border-slate-800 opacity-60 grayscale'
              : isMobileHeroResting
              ? 'border-emerald-400 ring-4 ring-emerald-500 bg-emerald-950/60 shadow-2xl shadow-emerald-900/60'
              : 'border-slate-800'
          }`}>
            {/* Floating Green Crosses for REST */}
            {isMobileHeroResting && (
              <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden rounded-2xl">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={`mobile_rest_cross_${i}`}
                    initial={{ opacity: 0, y: 40, x: (i - 2) * 20 }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      y: [-10, -70],
                      scale: [0.8, 1.5, 0.9],
                    }}
                    transition={{
                      duration: 1.3,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: 'easeOut',
                    }}
                    className="absolute bottom-2 left-1/2 text-emerald-400 font-black text-xl drop-shadow-[0_0_10px_rgba(52,211,153,0.9)]"
                  >
                    ✚
                  </motion.div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 text-center relative z-10">
              {/* HP Bar */}
              <div className="bg-slate-950 p-2 rounded-xl border border-rose-500">
                <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1 mb-0.5">
                  <Heart className="w-3 h-3 text-rose-400" /> HP 生命
                </span>
                <div className="text-sm font-black text-rose-300">
                  {activeHero.hp} / {activeHero.maxHp}
                </div>
              </div>

              {/* Shield Bar */}
              <div className="bg-slate-950 p-2 rounded-xl border border-cyan-500">
                <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1 mb-0.5">
                  <Shield className="w-3 h-3 text-cyan-400" /> 護甲 Shield
                </span>
                <div className="text-sm font-black text-cyan-300">
                  {activeHero.shield}
                </div>
              </div>

              {/* Energy Bar */}
              <div className="bg-slate-950 p-2 rounded-xl border border-amber-500">
                <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1 mb-0.5">
                  <Zap className="w-3 h-3 text-amber-400" /> 能量 Energy
                </span>
                <div className="text-sm font-black text-amber-300">
                  {activeHero.energy} / {activeHero.maxEnergy}
                </div>
              </div>
            </div>

            {/* Calculated Stats Badges */}
            {activeHero.stats && (
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex items-center justify-between text-[11px] text-slate-300 relative z-10">
                <span>⚔️ 攻: <strong className="text-amber-400">{activeHero.stats.attack}</strong></span>
                <span>🛡️ 防: <strong className="text-cyan-400">{activeHero.stats.defense}</strong></span>
                <span>💨 閃: <strong className="text-emerald-400">{activeHero.stats.evasion}</strong></span>
                <span>❤️ 體: <strong className="text-purple-400">{activeHero.stats.stamina}</strong></span>
                <span>⚡ 敏: <strong className="text-indigo-400">{activeHero.stats.speed}</strong></span>
              </div>
            )}

            {/* Status Badges */}
            <StatusBadges
              statuses={activeHero.statuses || []}
              isStinking={activeHero.role === 'MELOGALE_MOSCHATA' && activeHero.hp > 0 && activeHero.hp <= activeHero.maxHp * 0.5}
            />
          </div>
        );
      })()}

      {/* Main Interactive Controls: Disabled when Knocked Out */}
      {isKnockedOut ? (
        <div className="bg-slate-900 border-2 border-rose-900/60 rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-rose-950/80 border-2 border-rose-600 text-3xl flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(225,29,72,0.4)]">
            💀
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-rose-400">
              【{activeHero.name}】已陣亡 (Knocked Out)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              生命值歸零，已退出戰鬥，不再執行任何出牌與攻擊動作。請注視主螢幕為隊友加油！
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Hand Cards Filter Tabs */}
          <div className="flex items-center justify-between gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
            <button
              onClick={() => setActiveCategory('ALL')}
              className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                activeCategory === 'ALL' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              全選
            </button>
            <button
              onClick={() => setActiveCategory('ATTACK')}
              className={`flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
                activeCategory === 'ATTACK' ? 'bg-rose-500 text-slate-100' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sword className="w-3 h-3" /> 攻擊
            </button>
            <button
              onClick={() => setActiveCategory('DEFENSE')}
              className={`flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
                activeCategory === 'DEFENSE' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3 h-3" /> 防禦
            </button>
            <button
              onClick={() => setActiveCategory('REST')}
              className={`flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
                activeCategory === 'REST' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Feather className="w-3 h-3" /> 休息
            </button>
          </div>

          {/* Selected Cards Dynamic Display Area */}
          <div className={`bg-slate-900 border rounded-2xl p-3 text-xs space-y-2 shadow-inner ${
            isGameInBattle ? 'border-amber-500' : 'border-slate-800 opacity-70'
          }`}>
            <div className="flex justify-between items-center font-bold">
              <span className="text-amber-300">
                {isGameInBattle
                  ? `📋 已選擇卡牌（選了 ${selectedCards.length} 張，能量剩餘 ${activeHero.energy - totalCost} / ${activeHero.energy}）：`
                  : '📋 戰鬥卡牌整備區（等待主持人按 GO 後可選牌）：'}
              </span>
            </div>

            {!isGameInBattle ? (
              <div className="text-slate-400 text-xs py-1.5 text-center font-bold flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>準備階段鎖定中，主持人按下 GO 後開放出牌</span>
              </div>
            ) : selectedCards.length === 0 ? (
              <div className="text-slate-500 text-xs italic py-1 text-center">
                點擊下方動作即可直接選定，再點一次可取消
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {selectedCards.map((card, idx) => (
                  <div
                    key={`player_selected_${card.id}_${idx}`}
                    className="flex items-center gap-1.5 bg-amber-950 border border-amber-500 px-2 py-1 rounded-xl shadow"
                  >
                    <span className="text-[10px] font-black text-amber-400">#{idx + 1}</span>
                    <span className="font-bold text-slate-100 text-xs">{card.name}</span>
                    <span className="text-[10px] text-amber-300">⚡{card.cost}費</span>
                    <button
                      type="button"
                      disabled={activeHero.isReady || !isCommitPhase}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!activeHero.isReady && isCommitPhase) {
                          onToggleCard(activeHero.id, card);
                        }
                      }}
                      className="text-slate-400 hover:text-rose-400 font-black ml-0.5 p-0.5 transition cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hand Cards List - Direct Click Selection */}
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredHand.length === 0 ? (
              <div className="text-center text-xs text-slate-500 py-6">此分類無可用卡牌</div>
            ) : (
              filteredHand.map((card) => {
                const selectedIndices = selectedCardIds
                  .map((id, idx) => (id === card.id ? idx + 1 : null))
                  .filter((val): val is number => val !== null);
                const isSelected = selectedIndices.length > 0;
                const isAffordable = totalCost + (isSelected ? 0 : card.cost) <= activeHero.energy;

                return (
                  <div
                    key={card.id}
                    onClick={() => handleCardClick(card)}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                      !isGameInBattle
                        ? 'bg-slate-900/60 border-slate-800 cursor-not-allowed opacity-75'
                        : isSelected
                        ? 'bg-amber-950 border-amber-400 ring-2 ring-amber-400 cursor-pointer'
                        : isAffordable
                        ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 cursor-pointer'
                        : 'bg-slate-950 border-slate-900 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-100">{card.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${getCardCategoryBadgeInfo(card).badgeClass}`}>
                          {getCardCategoryBadgeInfo(card).label}
                        </span>
                        {!isGameInBattle && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-slate-950 text-slate-400 border border-slate-800">
                            待命
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{card.description}</p>
                    </div>

                    <div className="text-right flex-shrink-0 pl-2">
                      <div className="text-xs font-bold text-amber-400">{card.cost} 費</div>
                      <div className="text-[10px] text-emerald-400 font-medium">優先級 {card.priority}</div>
                      {isSelected && (
                        <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded mt-1 block">
                          ✓ 已選 (# {selectedIndices.join(', #')})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Lock-In Commitment Button */}
          <button
            disabled={!isGameInBattle || !isCommitPhase}
            onClick={() => {
              if (!isGameInBattle) return;
              soundFx.playLockIn();
              onToggleReady(activeHero.id);
            }}
            className={`w-full py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-xl transition ${
              !isGameInBattle
                ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed opacity-80'
                : activeHero.isReady
                ? 'bg-slate-800 text-amber-400 border border-amber-500 hover:bg-slate-700 cursor-pointer'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
            }`}
          >
            {!isGameInBattle ? (
              <>
                <Lock className="w-4 h-4 text-slate-500" />
                ⏳ 等待主持人按 GO 開始戰鬥...
              </>
            ) : activeHero.isReady ? (
              <>
                <Lock className="w-4 h-4 text-amber-400" />
                已完成出牌鎖定 (點擊解鎖)
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                確認並鎖定出牌 (Lock-In)
              </>
            )}
          </button>
        </>
      )}

      {/* Player Creation Wizard Modal */}
      {onAddHero && (
        <PlayerCreationWizardModal
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          onAddHero={(name, role, equipment) => {
            onAddHero(name, role, equipment);
          }}
        />
      )}
    </div>
  );
};
