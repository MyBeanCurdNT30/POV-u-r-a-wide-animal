import React from 'react';
import { Hero, Card, FloatingText } from '../types';
import { Shield, Lock, Unlock, Zap, Heart, Sparkles, Target, HeartPulse } from 'lucide-react';
import { HandCard } from './HandCard';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../utils/audio';
import { PLAYER_CLASSES } from '../data/racesAndEquipment';
import { StatusBadges } from './StatusBadges';

interface HeroCardProps {
  hero: Hero;
  allHeroes: Hero[];
  isCommitPhase: boolean;
  floatingTexts: FloatingText[];
  onSelectCard: (heroId: string, card: Card) => void;
  onSetTarget: (heroId: string, targetId: string) => void;
  onToggleReady: (heroId: string) => void;
  allowCancelLockIn: boolean;
}

const HERO_AVATARS: Record<string, React.ReactNode> = {
  Shield: <Shield className="w-5 h-5 text-amber-400" />,
  Sparkles: <Sparkles className="w-5 h-5 text-purple-400" />,
  Target: <Target className="w-5 h-5 text-emerald-400" />,
  HeartPulse: <HeartPulse className="w-5 h-5 text-rose-400" />,
};

export const HeroCard: React.FC<HeroCardProps> = ({
  hero,
  allHeroes,
  isCommitPhase,
  floatingTexts,
  onSelectCard,
  onSetTarget,
  onToggleReady,
  allowCancelLockIn,
}) => {
  const hand = hero?.hand || [];
  const selectedCard = hand.find((c) => c.id === hero.selectedCardId);
  const hpPercent = Math.max(0, Math.min(100, (hero.hp / hero.maxHp) * 100));
  const isKnockedOut = hero.hp <= 0;

  return (
    <div
      id={`hero-card-${hero.id}`}
      className={`relative bg-slate-900 border rounded-2xl p-4 shadow-xl transition-all duration-300 flex flex-col justify-between ${
        isKnockedOut
          ? 'border-slate-800 opacity-40 grayscale'
          : hero.isReady
          ? 'border-amber-500 ring-2 ring-amber-500 bg-slate-900'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Floating text animation */}
      <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
        <AnimatePresence>
          {floatingTexts
            .filter((ft) => ft.targetId === hero.id)
            .map((ft) => (
              <motion.div
                key={ft.id}
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: -40, scale: 1.3 }}
                exit={{ opacity: 0, y: -60 }}
                transition={{ duration: 0.8 }}
                className={`text-lg font-black px-3 py-1 rounded-full shadow-lg border ${
                  ft.type === 'damage'
                    ? 'text-rose-400 bg-rose-950 border-rose-600'
                    : ft.type === 'heal'
                    ? 'text-emerald-300 bg-emerald-950 border-emerald-600'
                    : 'text-cyan-300 bg-cyan-950 border-cyan-600'
                }`}
              >
                {ft.text}
              </motion.div>
            ))}
        </AnimatePresence>
      </div>

      {/* Hero Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden p-0.5 shrink-0">
              {PLAYER_CLASSES[hero.role]?.imageUrl ? (
                <img
                  src={PLAYER_CLASSES[hero.role].imageUrl}
                  alt={hero.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              ) : (
                HERO_AVATARS[hero.avatarIcon] || <Shield className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">{hero.name}</h3>
                <span className="text-[10px] bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">
                  敏捷 {hero.speed}
                </span>
              </div>
              <p className="text-[11px] text-amber-300 font-medium">
                {hero.role === 'PYCNONOTUS'
                  ? '🐦 白頭翁'
                  : hero.role === 'MUS_CAROLI'
                  ? '🐭 月鼠'
                  : hero.role === 'PAGUMA_LARVATA'
                  ? '🦡 白鼻心'
                  : '🦨 鼬獾'}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          {hero.isReady ? (
            <span className="bg-amber-950 text-amber-300 border border-amber-500 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm animate-pulse">
              <Lock className="w-3 h-3 text-amber-400" /> 已出牌鎖定
            </span>
          ) : (
            <span className="bg-slate-800 text-slate-400 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
              <Unlock className="w-3 h-3 text-slate-500" /> 選擇卡牌中...
            </span>
          )}
        </div>

        {/* HP, Shield, & Energy Bars */}
        <div className="grid grid-cols-2 gap-2 my-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
          {/* Health & Shield */}
          <div>
            <div className="flex justify-between items-center text-[10px] font-semibold text-slate-300 mb-1">
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-400 fill-rose-400" /> 生命值
              </span>
              <span>{hero.hp}/{hero.maxHp}</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-rose-600 h-full transition-all duration-300"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
            {hero.shield > 0 && (
              <div className="text-[10px] text-cyan-300 mt-1 font-bold flex items-center gap-1">
                <Shield className="w-3 h-3 text-cyan-400" /> 護甲: {hero.shield}
              </div>
            )}
          </div>

          {/* Energy */}
          <div>
            <div className="flex justify-between items-center text-[10px] font-semibold text-slate-300 mb-1">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400 fill-amber-400" /> 能量 (Energy)
              </span>
              <span>{hero.energy}/{hero.maxEnergy}</span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: hero.maxEnergy }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    idx < hero.energy ? 'bg-amber-400' : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Status Effects & Passive Trait Badges */}
        <StatusBadges
          statuses={hero.statuses || []}
          isStinking={hero.role === 'MELOGALE_MOSCHATA' && hero.hp > 0 && hero.hp <= hero.maxHp * 0.5}
        />

        {/* Target Selector for Healing/Buffing Allies */}
        {selectedCard && (selectedCard.targetType === 'SINGLE_ALLY' || selectedCard.targetType === 'SINGLE_ENEMY') && isCommitPhase && !hero.isReady && (
          <div className="my-2 bg-slate-950 p-2 rounded-xl border border-amber-500 flex items-center justify-between text-xs">
            <span className="text-amber-300 font-semibold flex items-center gap-1">
              <Target className="w-3.5 h-3.5" /> 選擇目標:
            </span>
            {selectedCard.targetType === 'SINGLE_ALLY' ? (
              <select
                value={hero.targetId || hero.id}
                onChange={(e) => onSetTarget(hero.id, e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-amber-400"
              >
                {allHeroes.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} (HP: {h.hp})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-slate-400 font-medium">BOSS</span>
            )}
          </div>
        )}
      </div>

      {/* Hand Cards Horizontal Scroll Container */}
      {!isKnockedOut && (
        <div className="my-3 space-y-2">
          <div className="text-[11px] font-bold text-slate-400 mb-1 flex items-center justify-between">
            <span>點擊選擇卡牌 (共 7 張手牌：3 攻擊 / 3 防禦 / 1 休息)</span>
            <span className="text-amber-400 text-[10px]">已選 {(hero.selectedCardIds || []).length} 張</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
            {hand.map((card) => {
              const isSelected = (hero.selectedCardIds || []).includes(card.id);

              return (
                <HandCard
                  key={card.id}
                  card={card}
                  heroEnergy={hero.energy}
                  isSelected={isSelected}
                  isHeroReady={hero.isReady}
                  onSelectCard={(c) => onSelectCard(hero.id, c)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Lock-In Button (出牌鎖定按鈕) */}
      {!isKnockedOut && isCommitPhase && (
        <div className="mt-2">
          <button
            id={`btn-hero-lock-${hero.id}`}
            disabled={(hero.selectedCardIds || []).length === 0 || (hero.isReady && !allowCancelLockIn)}
            onClick={() => {
              if (hero.isReady) soundFx.playCardSelect();
              else soundFx.playLockIn();
              onToggleReady(hero.id);
            }}
            className={`w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              hero.isReady
                ? 'bg-slate-800 text-amber-400 border border-amber-500 hover:bg-slate-700'
                : (hero.selectedCardIds || []).length > 0
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-lg active:scale-98'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
            }`}
          >
            {hero.isReady ? (
              <>
                <Lock className="w-4 h-4 text-amber-400" />
                {allowCancelLockIn ? '已鎖定 (點擊取消)' : '已鎖定 (無法變更)'}
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                {(hero.selectedCardIds || []).length > 0 ? '鎖定出牌 (Lock-In)' : '請先挑選卡牌'}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
