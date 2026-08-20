import React, { useState } from 'react';
import { Boss, Hero, GamePhase, FloatingText, CommittedAction, Card, PlayerRole, PlayerEquipmentSelection } from '../types';
import { Shield, Zap, Heart, Lock, Unlock, Play, Pause, QrCode, Sparkles, Flame, Volume2, UserPlus, Trash2, X, Plus, Timer, RotateCcw, Swords, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResolutionStage } from './ResolutionStage';
import { EquipmentSelector } from './EquipmentSelector';
import { PlayerCreationWizardModal } from './PlayerCreationWizardModal';
import { DEFAULT_EQUIPMENT_SELECTION, PLAYER_CLASSES } from '../data/racesAndEquipment';
import { DOG_BOSS_CARDS, CAT_BOSS_CARDS, getCardCategoryBadgeInfo } from '../data/cards';
import { checkFullTurnRestSlotLock, validateTotalStaminaCost, DOG_BOSS_IMAGE_URL, CAT_BOSS_IMAGE_URL, WILDLIFE_TEAM_IMAGE_URL } from '../data/bosses';

interface HostManagerViewProps {
  boss: Boss;
  heroes: Hero[];
  phase: GamePhase;
  readyCount: number;
  totalHeroes: number;
  isBossReady: boolean;
  roomCode: string;
  actionQueue: CommittedAction[];
  currentActionIndex: number;
  floatingTexts: FloatingText[];
  revealIntelMode: 'FULL_SECRET' | 'CARD_TYPE_ONLY' | 'REVEALED';
  commitTimeLeft?: number;
  screenState?: 'COVER' | 'PREPARATION' | 'BATTLE';
  isGoClicked?: boolean;
  isPaused?: boolean;
  onStartGame?: () => void;
  onPressGo?: () => void;
  onTogglePause?: () => void;
  onOpenQrModal: () => void;
  onExecuteTurn: () => void;
  onFastLockInAll: () => void;
  onSelectSlot1Card: (heroId: string, card: Card) => void;
  onSelectSlot2Card: (heroId: string, card: Card) => void;
  onToggleReady: (heroId: string) => void;
  onExecuteNextStep: () => void;
  onFinishResolution: () => void;
  onAddHero?: (name: string, role: PlayerRole, equipment?: PlayerEquipmentSelection) => void;
  onRemoveHero?: (heroId: string) => void;
  onSelectBossKey?: (bossKey: 'DOG' | 'CAT') => void;
  onSetBossIntent?: (selectedCards: Card[], targetIds?: string[]) => void;
  onRandomizeBossIntent?: () => void;
}

export const HostManagerView: React.FC<HostManagerViewProps> = ({
  boss,
  heroes,
  phase,
  readyCount,
  totalHeroes,
  isBossReady,
  roomCode,
  actionQueue,
  currentActionIndex,
  floatingTexts,
  revealIntelMode,
  commitTimeLeft = 60,
  screenState = 'COVER',
  isGoClicked = false,
  isPaused = false,
  onStartGame,
  onPressGo,
  onTogglePause,
  onOpenQrModal,
  onExecuteTurn,
  onFastLockInAll,
  onSelectSlot1Card,
  onSelectSlot2Card,
  onToggleReady,
  onExecuteNextStep,
  onFinishResolution,
  onAddHero,
  onRemoveHero,
  onSelectBossKey,
  onSetBossIntent,
  onRandomizeBossIntent,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (boss.hp / boss.maxHp) * 100));

  const half = Math.ceil(heroes.length / 2);
  const leftHeroes = heroes.slice(0, half);
  const rightHeroes = heroes.slice(half);

  const currentAction = actionQueue[currentActionIndex];
  const isBossActor = phase === 'RESOLVING' && currentAction?.actorType === 'BOSS';
  const isBossTarget = phase === 'RESOLVING' && (currentAction?.targetId === boss.id || currentAction?.targetId === 'ALL');
  const isTargetLeft = leftHeroes.some((h) => h.id === currentAction?.targetId);
  const isTargetRight = rightHeroes.some((h) => h.id === currentAction?.targetId);

  const [isAddHeroModalOpen, setIsAddHeroModalOpen] = useState<boolean>(false);
  const [isBossCardModalOpen, setIsBossCardModalOpen] = useState<boolean>(false);
  const [newHeroName, setNewHeroName] = useState<string>('');
  const [newHeroRole, setNewHeroRole] = useState<PlayerRole>('PYCNONOTUS');
  const [newHeroEquipment, setNewHeroEquipment] = useState<PlayerEquipmentSelection>(DEFAULT_EQUIPMENT_SELECTION);

  // Boss Card Selection State for Host
  const currentBossPool = boss.bossKey === 'CAT' ? CAT_BOSS_CARDS : DOG_BOSS_CARDS;
  const [selectedBossCards, setSelectedBossCards] = useState<Card[]>([]);

  const handleOpenBossCardModal = () => {
    if (boss.intent?.selectedCards) {
      setSelectedBossCards([...boss.intent.selectedCards]);
    } else {
      setSelectedBossCards([]);
    }
    setIsBossCardModalOpen(true);
  };

  const handleApplyBossCards = () => {
    if (onSetBossIntent) {
      onSetBossIntent(selectedBossCards);
    }
    setIsBossCardModalOpen(false);
  };

  const handleToggleBossCardPool = (card: Card) => {
    const existingIndex = selectedBossCards.findIndex((c) => c.id === card.id);
    if (existingIndex >= 0) {
      setSelectedBossCards((prev) => prev.filter((_, idx) => idx !== existingIndex));
    } else {
      if (checkFullTurnRestSlotLock(card)) {
        setSelectedBossCards([card]);
      } else {
        const currentTotalCost = selectedBossCards.reduce((acc, c) => acc + c.cost, 0);
        if (currentTotalCost + card.cost <= boss.maxStamina) {
          setSelectedBossCards((prev) => [...prev, card]);
        }
      }
    }
  };

  const totalBossCardCost = selectedBossCards.reduce((acc, c) => acc + c.cost, 0);

  const allReady = readyCount === totalHeroes;
  const canExecute = allReady && isBossReady && phase === 'COMMIT' && heroes.length > 0;

  const handleCreateHero = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = newHeroName.trim() || `玩家 ${heroes.length + 1}`;
    if (onAddHero) {
      onAddHero(finalName, newHeroRole, newHeroEquipment);
    }
    setNewHeroName('');
    setIsAddHeroModalOpen(false);
  };

  // 1. COVER SCREEN VIEW (開始畫面)
  if (screenState === 'COVER') {
    return (
      <div className="relative w-full min-h-[85vh] bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col items-center justify-between text-center overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-950/20 via-slate-950 to-purple-950/20 pointer-events-none" />

        {/* Center Artwork Illustrations: Dog & Cat (Image 1) VS Wildlife Team (Image 5) */}
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-12 my-auto w-full max-w-5xl py-8">
          {/* Left Team: Dog & Cat (Image 1) */}
          <div className="flex flex-col items-center bg-slate-900/80 border border-amber-500/40 p-6 rounded-3xl shadow-xl flex-1">
            <CoverDogAndCatIllustration />
          </div>

          {/* Center VS */}
          <div className="text-4xl sm:text-6xl font-black text-rose-500 animate-pulse drop-shadow-[0_0_25px_rgba(244,63,94,0.8)]">
            VS
          </div>

          {/* Right Team: Wildlife (Image 5) */}
          <div className="flex flex-col items-center bg-slate-900/80 border border-emerald-500/40 p-6 rounded-3xl shadow-xl flex-1">
            <WildlifeTeamIllustration />
          </div>
        </div>

        {/* Start Game Button */}
        <div className="relative z-10 my-6">
          <button
            type="button"
            onClick={onStartGame}
            className="px-12 py-4 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-xl sm:text-2xl rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95 transition cursor-pointer flex items-center gap-3"
          >
            <Play className="w-7 h-7 fill-slate-950" />
            <span>開始遊戲 (START GAME)</span>
          </button>
        </div>
      </div>
    );
  }

  // Common Header Bar rendered for PREPARATION and BATTLE screens
  return (
    <div className={`relative w-full min-h-[85vh] bg-slate-950 border rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col justify-between overflow-hidden transition-all ${
      isPaused
        ? 'border-[6px] border-rose-600 shadow-[inset_0_0_80px_rgba(244,63,94,0.8),0_0_50px_rgba(244,63,94,0.6)] ring-8 ring-rose-500/40'
        : 'border-slate-800'
    }`}>
      {/* Pause Banner Bar when Game is Paused */}
      {isPaused && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 bg-rose-600 text-white font-black text-xs sm:text-sm px-6 py-1.5 rounded-b-2xl shadow-2xl border-x border-b border-rose-300 flex items-center justify-center gap-3 animate-pulse">
          <span>⏸ 遊戲已暫停 (PAUSED)</span>
          <button
            type="button"
            onClick={onTogglePause}
            className="bg-white text-rose-950 px-3 py-0.5 rounded-lg text-xs font-black hover:bg-rose-100 transition cursor-pointer flex items-center gap-1"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            繼續遊戲
          </button>
        </div>
      )}

      {/* TOP HEADER BAR */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-slate-800 pb-3">
        {/* Top Left: Fixed Stage Progress Indicator (順序固定先狗再貓) */}
        <div className="flex items-center gap-2 bg-slate-900 px-3.5 py-1.5 rounded-2xl border border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400">關卡進度:</span>
          {boss.bossKey === 'DOG' ? (
            <span className="text-xs font-black text-amber-400 bg-amber-950 px-2.5 py-1 rounded-xl border border-amber-600 flex items-center gap-1">
              🐕 1/2 黃色土狗
            </span>
          ) : (
            <span className="text-xs font-black text-rose-300 bg-rose-950 px-2.5 py-1 rounded-xl border border-rose-600 flex items-center gap-1">
              🐱 2/2 三花貓
            </span>
          )}
        </div>

        {/* Top Center: Red BOSS HP Bar (BOSS 血條) */}
        <div className="flex-1 min-w-[240px] max-w-md mx-auto flex flex-col items-center">
          <div className="flex items-center justify-between w-full text-xs font-black text-rose-400 mb-1 px-1">
            <span className="flex items-center gap-1.5 text-sm uppercase tracking-wider">
              {boss.bossKey === 'CAT' ? '🐱' : '🐕'} {boss.name}
              <span className="text-slate-400 text-xs font-normal">({boss.title})</span>
            </span>
            <span className="text-rose-300 font-bold bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
              {boss.hp} / {boss.maxHp} HP
            </span>
          </div>

          {/* Red Boss Health Bar Container */}
          <div className="relative w-full h-5 bg-slate-900 rounded-full border-2 border-rose-600 p-0.5 shadow-lg overflow-hidden">
            <motion.div
              className="h-full bg-rose-600 rounded-full shadow-inner"
              initial={{ width: '100%' }}
              animate={{ width: `${hpPercent}%` }}
              transition={{ duration: 0.5 }}
            />
            {boss.shield > 0 && (
              <div className="absolute right-2 top-0 bottom-0 flex items-center text-[10px] font-bold text-cyan-300 bg-cyan-950 px-1.5 my-0.5 rounded border border-cyan-600">
                <Shield className="w-3 h-3 mr-0.5" /> {boss.shield}
              </div>
            )}
          </div>
        </div>

        {/* Top Right: Host Manual Card Button, Pause Button & Room Info Modal Trigger Button */}
        <div className="flex items-center gap-2">
          {screenState === 'BATTLE' && (
            <button
              onClick={handleOpenBossCardModal}
              className="bg-purple-600 hover:bg-purple-500 text-slate-100 font-bold text-xs sm:text-sm px-3 py-2 rounded-xl shadow-lg border border-purple-400 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              title="房主選擇 BOSS 出牌"
            >
              <Sparkles className="w-4 h-4 text-purple-200" />
              <span>房主選卡牌</span>
            </button>
          )}

          {/* Pause / Resume Button */}
          {screenState === 'BATTLE' && onTogglePause && (
            <button
              onClick={onTogglePause}
              className={`p-2 rounded-xl border transition cursor-pointer flex items-center justify-center ${
                isPaused
                  ? 'bg-rose-500 border-rose-300 text-slate-950 animate-bounce'
                  : 'bg-rose-950/80 hover:bg-rose-900 border-rose-600 text-rose-300'
              }`}
              title={isPaused ? '繼續遊戲' : '暫停遊戲'}
            >
              {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
            </button>
          )}

          {onAddHero && (
            <button
              onClick={() => {
                if (heroes.length >= 6) {
                  alert('玩家人數已達上限 (最多 6 人)！');
                  return;
                }
                setIsAddHeroModalOpen(true);
              }}
              disabled={heroes.length >= 6}
              className={`font-bold text-xs sm:text-sm px-3 py-2 rounded-xl shadow-lg flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                heroes.length >= 6
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              }`}
              title={heroes.length >= 6 ? '玩家人數已達上限 (最多 6 人)' : '新增玩家角色'}
            >
              <UserPlus className="w-4 h-4" />
              <span>新增角色 ({heroes.length}/6)</span>
            </button>
          )}

          <button
            onClick={onOpenQrModal}
            className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-cyan-400 shadow-lg flex items-center gap-2 transition active:scale-95 cursor-pointer"
            title="開啟房間 QR Code 與加入碼"
          >
            <QrCode className="w-4 h-4 text-slate-950 fill-slate-950" />
            <span>房間資訊 {roomCode}</span>
          </button>
        </div>
      </div>

      {/* Add Hero Modal Dialog (Step-by-Step Wizard) */}
      <PlayerCreationWizardModal
        isOpen={isAddHeroModalOpen}
        onClose={() => setIsAddHeroModalOpen(false)}
        onAddHero={(name, role, equipment) => {
          if (onAddHero) {
            onAddHero(name, role, equipment);
          }
        }}
      />

      {/* Host Boss Card Selection Modal */}
      {isBossCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950 animate-fadeIn">
          <div className="bg-slate-900 border border-purple-500 rounded-3xl w-full max-w-lg p-5 shadow-2xl relative text-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsBossCardModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="font-bold text-base text-purple-300">
                  🎮 房主（管理員）手動選擇 BOSS 卡牌
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  目前操作：{boss.name}（體力限制：{boss.maxStamina} 點）
                </p>
              </div>
            </div>

            {/* Selected Cards Dynamic Display Area */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-purple-500 text-xs space-y-2">
              <div className="flex justify-between items-center font-bold">
                <span className="text-purple-300">
                  📋 已選擇卡牌（選了 {selectedBossCards.length} 張，體力剩餘 {boss.maxStamina - totalBossCardCost} / {boss.maxStamina}）：
                </span>
              </div>

              {selectedBossCards.length === 0 ? (
                <div className="text-slate-500 text-xs italic py-2 text-center">
                  點擊下方「手牌池」點選卡牌加入，再點一次可取消
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedBossCards.map((card, idx) => (
                    <div
                      key={`selected_card_${card.id}_${idx}`}
                      className="flex items-center gap-2 bg-purple-950 border border-purple-400 px-2.5 py-1.5 rounded-xl shadow-md"
                    >
                      <span className="text-[10px] font-black text-purple-400">#{idx + 1}</span>
                      <span className="font-bold text-slate-100 text-xs">{card.name}</span>
                      <span className="text-[10px] text-amber-300">⚡{card.cost}費</span>
                      <button
                        type="button"
                        onClick={() => setSelectedBossCards((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-400 font-black ml-1 p-0.5 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Single Card Pool List */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider">
                BOSS 手牌池列表（點擊加入 / 取消選擇）：
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {currentBossPool.map((card) => {
                  const selectedIndices = selectedBossCards
                    .map((c, i) => (c.id === card.id ? i + 1 : null))
                    .filter(Boolean);
                  const isSelected = selectedIndices.length > 0;

                  return (
                    <button
                      key={`pool_${card.id}`}
                      type="button"
                      onClick={() => handleToggleBossCardPool(card)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer relative ${
                        isSelected
                          ? 'bg-purple-950 border-purple-400 ring-2 ring-purple-400 text-purple-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-xs text-slate-100">
                        <span className="line-clamp-1">{card.name}</span>
                        {isSelected && (
                          <span className="text-[9px] bg-purple-500 text-slate-950 font-black px-1.5 py-0.5 rounded ml-1">
                            ✓ #{selectedIndices.join(', #')}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-amber-400 mt-1 flex items-center justify-between">
                        <span>體力消耗: {card.cost}</span>
                        <span>優先級: {card.priority}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{card.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center gap-2 pt-3 border-t border-slate-800">
              {onRandomizeBossIntent && (
                <button
                  type="button"
                  onClick={() => {
                    onRandomizeBossIntent();
                    setIsBossCardModalOpen(false);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  🎲 AI 隨機出牌
                </button>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBossCardModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleApplyBossCards}
                  disabled={totalBossCardCost > boss.maxStamina}
                  className={`px-5 py-2 rounded-xl text-xs font-black transition ${
                    totalBossCardCost <= boss.maxStamina
                      ? 'bg-purple-600 hover:bg-purple-500 text-slate-100 shadow-lg cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  🔒 鎖定 BOSS 出牌
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CENTER STAGE CONTENT */}
      <div className="relative z-10 grid grid-cols-12 gap-4 items-center flex-1 my-2">
        {/* LEFT COLUMN: Players 1 & 2 */}
        <div className="col-span-12 lg:col-span-3 space-y-3">
          {leftHeroes.map((hero) => (
            <CompactHeroSideCard
              key={hero.id}
              hero={hero}
              floatingTexts={floatingTexts}
              currentAction={currentAction}
              phase={phase}
              side="left"
              onToggleReady={onToggleReady}
              onRemoveHero={onRemoveHero}
            />
          ))}
          {leftHeroes.length === 0 && (
            <div className="text-center py-6 px-4 text-xs text-slate-400 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/40 space-y-2">
              <div className="text-cyan-400 font-bold flex items-center justify-center gap-1.5">
                <QrCode className="w-4 h-4 text-cyan-400" />
                <span>等待玩家加入對戰 ({heroes.length}/6)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                請玩家掃描「房間 QR Code」自訂角色加入
              </p>
            </div>
          )}
        </div>

        {/* CENTER COLUMN: Giant Boss Illustration Art & Overlapping Attack Animations */}
        <div className="col-span-12 lg:col-span-6 flex flex-col items-center justify-center relative min-h-[280px] p-2">
          {/* Floating Damage, Heal, Shield & Status Texts for Boss (Always on Top Layer) */}
          <div className="absolute inset-0 pointer-events-none z-[100] flex items-center justify-center">
            <AnimatePresence>
              {floatingTexts
                .filter((ft) => ft.targetId === boss.id || ft.targetId === 'ALL')
                .map((ft) => (
                  <motion.div
                    key={ft.id}
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: -50, scale: 1.4 }}
                    exit={{ opacity: 0, y: -70 }}
                    transition={{ duration: 0.8 }}
                    className={`text-2xl font-black px-4 py-1.5 rounded-full shadow-[0_0_25px_rgba(0,0,0,0.95)] border-2 z-[100] ${
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

          {/* Boss Illustration Artwork with OVERLAPPING Motion Range */}
          <motion.div
            animate={
              isBossActor && currentAction?.card.type === 'ATTACK'
                ? isTargetLeft
                  ? { x: [0, -380, 0], scale: [1, 1.3, 1], zIndex: 50 }
                  : isTargetRight
                  ? { x: [0, 380, 0], scale: [1, 1.3, 1], zIndex: 50 }
                  : { y: [0, 80, 0], scale: [1, 1.35, 1], rotate: [0, -4, 4, 0], zIndex: 50 }
                : isBossTarget && currentAction?.card.type === 'ATTACK'
                ? { x: [0, -12, 12, -10, 10, 0], scale: [1, 0.95, 1] }
                : { x: 0, y: 0, scale: isBossActor ? 1.05 : 1 }
            }
            transition={{
              duration: isBossActor && currentAction?.card.type === 'ATTACK' ? 0.7 : isBossTarget ? 0.4 : 0.3,
              repeat: (isBossActor && currentAction?.card.type === 'ATTACK') || isBossTarget ? Infinity : 0,
              repeatDelay: 0.2,
              ease: 'easeInOut',
            }}
            className={`flex flex-col items-center justify-center my-2 relative group p-3 rounded-2xl transition-all duration-300 ${
              isBossActor && currentAction?.card.type === 'REST'
                ? 'border-2 border-emerald-400 ring-4 ring-emerald-500 bg-emerald-950/60 shadow-2xl shadow-emerald-900/80 z-20'
                : isBossActor && currentAction?.card.type === 'ATTACK'
                ? 'border-2 border-rose-500 ring-4 ring-rose-500 bg-rose-950/30 shadow-2xl shadow-rose-900/80 z-20'
                : isBossActor && currentAction?.card.type === 'DEFENSE'
                ? 'border-2 border-cyan-400 ring-4 ring-cyan-500 bg-cyan-950/30 shadow-2xl shadow-cyan-900/80 z-20'
                : isBossActor
                ? 'ring-4 ring-rose-500 bg-rose-950/20 scale-105 shadow-2xl z-20'
                : isBossTarget
                ? 'ring-4 ring-amber-500 bg-amber-950/20 animate-pulse z-10'
                : ''
            }`}
          >
            {/* Active Boss Action Badge Floating directly on Boss Artwork */}
            {isBossActor && (
              <div className={`absolute -top-3 text-white font-black text-xs px-3 py-1 rounded-full shadow-xl border flex items-center gap-1 animate-bounce z-30 ${
                currentAction?.card.type === 'REST'
                  ? 'bg-emerald-600 border-emerald-300 text-slate-950 font-black'
                  : 'bg-rose-600 border-rose-300'
              }`}>
                <Zap className="w-3.5 h-3.5" />
                BOSS 發動: {currentAction?.card.name}
              </div>
            )}

            {/* Floating Green Crosses for BOSS REST */}
            {isBossActor && currentAction?.card.type === 'REST' && (
              <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden rounded-2xl">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={`boss_rest_cross_${i}`}
                    initial={{ opacity: 0, y: 50, x: (i - 2.5) * 32 }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      y: [10, -110],
                      scale: [0.8, 1.8, 1],
                    }}
                    transition={{
                      duration: 1.4,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: 'easeOut',
                    }}
                    className="absolute bottom-2 left-1/2 text-emerald-400 font-black text-2xl drop-shadow-[0_0_12px_rgba(52,211,153,0.9)]"
                  >
                    ✚
                  </motion.div>
                ))}
              </div>
            )}

            {/* Vector Boss Artwork matching the Wireframe */}
            {boss.bossKey === 'DOG' ? (
              <DogIllustration />
            ) : boss.bossKey === 'CAT' ? (
              <CatIllustration />
            ) : (
              <DragonIllustration />
            )}

            {/* Boss Title Badge */}
            <div className="mt-3 bg-slate-900 border border-amber-500 text-amber-300 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              {boss.name} ・ 敏捷 {boss.speed}
            </div>
          </motion.div>
        </div>

        {/* RIGHT COLUMN: Players 3 & 4 */}
        <div className="col-span-12 lg:col-span-3 space-y-3">
          {rightHeroes.map((hero) => (
            <CompactHeroSideCard
              key={hero.id}
              hero={hero}
              floatingTexts={floatingTexts}
              currentAction={currentAction}
              phase={phase}
              side="right"
              onToggleReady={onToggleReady}
              onRemoveHero={onRemoveHero}
            />
          ))}
          {rightHeroes.length === 0 && leftHeroes.length > 0 && (
            <div className="text-center py-4 text-xs text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
              無更多角色（最多可容納 6 位玩家）
            </div>
          )}
        </div>
      </div>

      {/* 2. PREPARATION SCREEN GO BUTTON (準備畫面 GO 按鈕) */}
      {screenState === 'PREPARATION' && !isGoClicked && (
        <div className="relative z-10 flex flex-col items-center justify-center my-4 pt-2 border-t border-slate-800 animate-fadeIn">
          <button
            type="button"
            onClick={onPressGo}
            className="w-72 sm:w-80 h-28 sm:h-32 border-4 border-amber-400 bg-slate-950/90 rounded-3xl flex flex-col items-center justify-center shadow-[0_0_50px_rgba(251,191,36,0.3)] hover:shadow-[0_0_80px_rgba(251,191,36,0.6)] hover:scale-105 active:scale-95 transition cursor-pointer group"
          >
            <span className="text-5xl sm:text-6xl font-black text-amber-400 tracking-widest group-hover:text-amber-300 font-mono drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]">
              G O
            </span>
            <span className="text-xs font-bold text-amber-500 mt-1">點擊進入對戰畫面</span>
          </button>
        </div>
      )}

      {/* 3. BATTLE SCREEN BOTTOM FOOTER PANEL (遊戲介面底欄如附圖2) */}
      {screenState === 'BATTLE' && (
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-3 border-t border-slate-800 animate-fadeIn">
          {/* BOTTOM LEFT: Boss Pre-selected Cards List (附圖2: BOSS 預選卡牌) */}
          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
            <div className="text-xs font-bold text-amber-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md">
              <span>👑 BOSS【{boss.name}】預選卡牌 (體力上限 {boss.maxStamina}):</span>
            </div>

            {boss.intent && boss.intent.selectedCards && boss.intent.selectedCards.length > 0 ? (
              <div className="flex items-center gap-2 flex-wrap">
                {boss.intent.selectedCards.map((card, idx) => (
                  <div
                    key={`boss_intent_${card.id}_${idx}`}
                    className="w-28 sm:w-32 bg-amber-950 border-2 border-amber-500 rounded-xl p-2 text-left shadow-lg relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between text-[10px] font-black text-amber-400 uppercase mb-0.5">
                      <span>第 {idx + 1} 張</span>
                      <span>⚡ 費 {card.cost}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-100 line-clamp-1">
                      {card.name}
                    </div>
                    <div className="text-[10px] text-amber-300 flex items-center justify-between mt-1 pt-1 border-t border-amber-500">
                      <span>優先級: {card.priority}</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950 text-amber-300 font-bold">
                        {card.type === 'ATTACK' ? '⚔️攻擊' : card.type === 'DEFENSE' ? '🛡️防禦' : '🍃休息'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
                尚無選定 BOSS 卡牌（點擊右上角「房主選卡牌」）
              </div>
            )}
          </div>

          {/* BOTTOM RIGHT: Round Circle Lock-in / Countdown Status Badge (附圖2 右下角 0/4 準備中 圓形計時) */}
          <div className="flex items-center gap-3">
            {!allReady && phase === 'COMMIT' && (
              <button
                onClick={onFastLockInAll}
                className="bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500 text-xs px-3.5 py-2 rounded-xl font-bold transition cursor-pointer shadow-md"
              >
                一鍵全員鎖定
              </button>
            )}

            <button
              disabled={!canExecute}
              onClick={onExecuteTurn}
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center border-4 shadow-2xl transition-all cursor-pointer relative ${
                canExecute
                  ? 'bg-amber-500 border-amber-300 text-slate-950 font-black animate-bounce hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(245,158,11,0.6)]'
                  : 'bg-slate-950 border-amber-400 text-amber-300 font-bold'
              }`}
              title={canExecute ? '點擊開始交錯結算！' : `等待全員鎖定 (${readyCount}/${totalHeroes})`}
            >
              <span className="text-2xl sm:text-3xl font-black tracking-tight leading-none">
                {readyCount} / {totalHeroes}
              </span>
              <span className="text-xs sm:text-sm uppercase font-black mt-1 px-1">
                {canExecute ? '開始結算' : '準備中'}
              </span>
              {phase === 'COMMIT' && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-[115%] bg-rose-950 border-2 border-rose-400 text-rose-300 text-xs sm:text-sm font-mono font-black py-1 px-2 rounded-full shadow-2xl flex items-center justify-center gap-1 animate-pulse z-30">
                  <Timer className="w-4 h-4 text-rose-400" />
                  <span>⏳ {commitTimeLeft}s</span>
                </div>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* Compact Hero Card for Left & Right Columns with OVERLAPPING motion matching wireframe */
const CompactHeroSideCard: React.FC<{
  hero: Hero;
  floatingTexts: FloatingText[];
  currentAction?: CommittedAction;
  phase?: GamePhase;
  side?: 'left' | 'right';
  onToggleReady: (id: string) => void;
  onRemoveHero?: (id: string) => void;
}> = ({ hero, floatingTexts, currentAction, phase, side = 'left', onRemoveHero }) => {
  const hpPercent = Math.max(0, Math.min(100, (hero.hp / hero.maxHp) * 100));
  const isKnockedOut = hero.hp <= 0;

  const isActor = !isKnockedOut && phase === 'RESOLVING' && currentAction?.actorId === hero.id;
  const isTarget =
    !isKnockedOut &&
    phase === 'RESOLVING' &&
    (currentAction?.targetId === hero.id ||
      (currentAction?.actorType === 'BOSS' && (currentAction?.targetId === 'ALL' || currentAction?.card.targetType === 'ALL_ENEMIES')));

  const isHeroAttack = !isKnockedOut && isActor && currentAction?.card.type === 'ATTACK';
  const isHeroRest = !isKnockedOut && isActor && currentAction?.card.type === 'REST';
  const isHeroDefense = !isKnockedOut && isActor && currentAction?.card.type === 'DEFENSE';

  return (
    <motion.div
      animate={
        isKnockedOut
          ? { x: 0, scale: 1 }
          : isHeroAttack
          ? { x: side === 'left' ? [0, 380, 0] : [0, -380, 0], scale: [1, 1.2, 1], zIndex: 50 }
          : isTarget && currentAction?.card.type === 'ATTACK'
          ? { x: [0, -12, 12, -10, 10, 0] }
          : { x: 0, scale: isActor ? 1.05 : 1 }
      }
      transition={{
        duration: isHeroAttack ? 0.7 : isTarget ? 0.4 : 0.3,
        repeat: (isHeroAttack || isTarget) ? Infinity : 0,
        repeatDelay: 0.2,
        ease: 'easeInOut',
      }}
      className={`relative bg-slate-900 border rounded-2xl p-3 shadow-lg transition-all flex items-center gap-3 group ${
        isKnockedOut
          ? 'border-slate-800 opacity-40 grayscale pointer-events-none'
          : isHeroRest
          ? 'border-emerald-400 ring-4 ring-emerald-500 bg-emerald-950/60 shadow-xl shadow-emerald-900/50 z-20'
          : isHeroAttack
          ? 'border-rose-400 ring-4 ring-rose-500 bg-rose-950/50 shadow-xl shadow-rose-900/50 z-20'
          : isHeroDefense
          ? 'border-cyan-400 ring-4 ring-cyan-500 bg-cyan-950/50 shadow-xl shadow-cyan-900/50 z-20'
          : isActor
          ? 'border-amber-400 ring-4 ring-amber-500 bg-amber-950/50 scale-105 z-20 shadow-amber-900/50'
          : isTarget
          ? 'border-rose-500 ring-4 ring-rose-500 bg-rose-950/40 animate-pulse z-10'
          : hero.isReady
          ? 'border-amber-500 ring-1 ring-amber-500'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Floating Action Badge when Hero is current Actor */}
      {isActor && (
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-lg border flex items-center gap-1 z-30 animate-bounce whitespace-nowrap ${
          isHeroRest
            ? 'bg-emerald-400 text-slate-950 border-emerald-200'
            : isHeroAttack
            ? 'bg-rose-500 text-white border-rose-300'
            : 'bg-cyan-500 text-slate-950 border-cyan-300'
        }`}>
          <Zap className="w-3 h-3 fill-current" />
          出牌：{currentAction?.card.name}
        </div>
      )}

      {/* Floating Green Crosses for Hero REST */}
      {isHeroRest && (
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden rounded-2xl">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={`hero_rest_cross_${hero.id}_${i}`}
              initial={{ opacity: 0, y: 35, x: (i % 2 === 0 ? -12 : 12) + i * 10 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: [-5, -65],
                scale: [0.8, 1.4, 0.9],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.25,
                ease: 'easeOut',
              }}
              className="absolute bottom-1 left-1/2 text-emerald-400 font-black text-lg drop-shadow-[0_0_8px_rgba(52,211,153,0.9)]"
            >
              ✚
            </motion.div>
          ))}
        </div>
      )}

      {/* Floating text animation (Always on Top Layer) */}
      <div className="absolute inset-0 pointer-events-none z-[100] flex items-center justify-center">
        <AnimatePresence>
          {floatingTexts
            .filter((ft) => ft.targetId === hero.id || ft.targetId === 'ALL')
            .map((ft) => (
              <motion.div
                key={ft.id}
                initial={{ opacity: 0, y: 5, scale: 0.8 }}
                animate={{ opacity: 1, y: -30, scale: 1.3 }}
                exit={{ opacity: 0, y: -45 }}
                transition={{ duration: 0.8 }}
                className={`text-sm font-black px-3 py-1 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.95)] border-2 z-[100] ${
                  ft.type === 'damage'
                    ? 'text-rose-200 bg-rose-950/95 border-rose-500 ring-2 ring-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.9)]'
                    : ft.type === 'heal'
                    ? 'text-emerald-200 bg-emerald-950/95 border-emerald-500 ring-2 ring-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.9)]'
                    : ft.type === 'block'
                    ? 'text-cyan-200 bg-cyan-950/95 border-cyan-500 ring-2 ring-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.9)]'
                    : 'text-amber-200 bg-amber-950/95 border-amber-500 ring-2 ring-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]'
                }`}
              >
                {ft.text}
              </motion.div>
            ))}
        </AnimatePresence>
      </div>

      {/* Delete button on hover / corner */}
      {onRemoveHero && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveHero(hero.id);
          }}
          className="absolute -top-2 -right-2 bg-rose-900 hover:bg-rose-700 text-rose-200 p-1 rounded-full border border-rose-600 shadow-md transition z-10 cursor-pointer"
          title={`移除 ${hero.name}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Circular Avatar Icon */}
      <div
        className={`w-11 h-11 rounded-full border-2 flex items-center justify-center shrink-0 shadow overflow-hidden p-0.5 ${
          hero.isReady
            ? 'border-amber-400 bg-slate-950 text-amber-400'
            : 'border-slate-700 bg-slate-950 text-slate-400'
        }`}
      >
        {PLAYER_CLASSES[hero.role]?.imageUrl ? (
          <img
            src={PLAYER_CLASSES[hero.role].imageUrl}
            alt={hero.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain rounded-full"
          />
        ) : (
          <span className="text-sm font-black uppercase">{hero.name.slice(0, 2)}</span>
        )}
      </div>

      {/* Name & HP Bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-slate-100 truncate">{hero.name}</span>
          {isKnockedOut ? (
            <span className="text-[10px] text-rose-300 font-bold bg-rose-950 px-1.5 py-0.5 rounded border border-rose-600">
              💀 陣亡
            </span>
          ) : hero.isReady ? (
            <span className="text-[10px] text-amber-400 font-bold bg-amber-950 px-1.5 py-0.2 rounded border border-amber-500">
              已鎖定
            </span>
          ) : (
            <span className="text-[10px] text-slate-500">出牌中...</span>
          )}
        </div>

        {/* Red HP Bar under name matching wireframe */}
        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
          <div
            className="bg-rose-600 h-full transition-all duration-300"
            style={{ width: `${hpPercent}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
          <span>HP: {hero.hp}/{hero.maxHp}</span>
          {hero.shield > 0 && <span className="text-cyan-300 font-bold">🛡️ {hero.shield}</span>}
        </div>
      </div>
    </motion.div>
  );
};

/* SVG Illustrations matching hand-drawn wireframe art */

const DogIllustration: React.FC = () => (
  <div className="flex items-center justify-center p-2">
    <img
      src={DOG_BOSS_IMAGE_URL}
      alt="黃色土狗"
      referrerPolicy="no-referrer"
      className="w-48 h-48 sm:w-60 sm:h-60 object-contain max-h-60 max-w-full drop-shadow-xl transition-all duration-300 hover:scale-105"
    />
  </div>
);

const CatIllustration: React.FC = () => (
  <div className="flex items-center justify-center p-2">
    <img
      src={CAT_BOSS_IMAGE_URL}
      alt="三花貓"
      referrerPolicy="no-referrer"
      className="w-48 h-48 sm:w-60 sm:h-60 object-contain max-h-60 max-w-full drop-shadow-xl transition-all duration-300 hover:scale-105"
    />
  </div>
);

const DragonIllustration: React.FC = () => (
  <svg className="w-48 h-48 sm:w-56 sm:h-56 text-purple-400" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Wings */}
    <path d="M40 90 Q10 40 70 50 Z" fill="#581C87" stroke="#381E72" strokeWidth="4" />
    <path d="M160 90 Q190 40 130 50 Z" fill="#581C87" stroke="#381E72" strokeWidth="4" />
    {/* Body */}
    <path d="M70 170 C60 130, 60 70, 100 60 C140 70, 140 130, 130 170 Z" fill="#3B0764" stroke="#A855F7" strokeWidth="4" />
    {/* Horns */}
    <path d="M80 60 L60 20 L90 45 Z" fill="#EAB308" />
    <path d="M120 60 L140 20 L110 45 Z" fill="#EAB308" />
    {/* Glowing Eyes */}
    <circle cx="85" cy="80" r="6" fill="#FACC15" />
    <circle cx="115" cy="80" r="6" fill="#FACC15" />
    {/* Fire Breath */}
    <path d="M90 110 Q100 150 110 110" fill="#EF4444" stroke="#F59E0B" strokeWidth="3" />
  </svg>
);

const BirdIllustration: React.FC = () => (
  <svg className="w-24 h-24 sm:w-32 sm:h-32 text-emerald-300" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Body */}
    <ellipse cx="100" cy="120" rx="45" ry="35" fill="#10B981" stroke="#064E3B" strokeWidth="4" />
    {/* Head */}
    <circle cx="100" cy="70" r="32" fill="#ECFDF5" stroke="#064E3B" strokeWidth="4" />
    {/* White Crest Crown */}
    <path d="M80 50 Q100 30 120 50 Z" fill="#FFFFFF" stroke="#064E3B" strokeWidth="3" />
    {/* Beak */}
    <polygon points="120,70 145,75 120,80" fill="#F59E0B" stroke="#78350F" strokeWidth="2" />
    {/* Eyes */}
    <circle cx="108" cy="65" r="5" fill="#064E3B" />
    <circle cx="110" cy="63" r="1.5" fill="#FFFFFF" />
    {/* Wing */}
    <path d="M70 115 C60 125, 80 145, 110 125 Z" fill="#047857" stroke="#064E3B" strokeWidth="3" />
    {/* Tail */}
    <path d="M55 125 L30 135 L40 120 L25 120 Z" fill="#047857" stroke="#064E3B" strokeWidth="3" />
  </svg>
);

const MouseIllustration: React.FC = () => (
  <svg className="w-24 h-24 sm:w-32 sm:h-32 text-cyan-300" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Body */}
    <ellipse cx="100" cy="125" rx="40" ry="32" fill="#38BDF8" stroke="#0C4A6E" strokeWidth="4" />
    {/* Head */}
    <ellipse cx="100" cy="80" rx="30" ry="25" fill="#E0F2FE" stroke="#0C4A6E" strokeWidth="4" />
    {/* Round Ears */}
    <circle cx="70" cy="55" r="18" fill="#F472B6" stroke="#0C4A6E" strokeWidth="3" />
    <circle cx="130" cy="55" r="18" fill="#F472B6" stroke="#0C4A6E" strokeWidth="3" />
    {/* Pink Nose */}
    <circle cx="100" cy="88" r="5" fill="#F43F5E" />
    {/* Whiskers */}
    <line x1="65" y1="88" x2="85" y2="88" stroke="#0C4A6E" strokeWidth="2.5" />
    <line x1="65" y1="94" x2="85" y2="92" stroke="#0C4A6E" strokeWidth="2.5" />
    <line x1="135" y1="88" x2="115" y2="88" stroke="#0C4A6E" strokeWidth="2.5" />
    <line x1="135" y1="94" x2="115" y2="92" stroke="#0C4A6E" strokeWidth="2.5" />
    {/* Eyes */}
    <circle cx="88" cy="75" r="4" fill="#0C4A6E" />
    <circle cx="112" cy="75" r="4" fill="#0C4A6E" />
    {/* Tail */}
    <path d="M140 135 Q170 145 160 170" stroke="#F472B6" strokeWidth="4" fill="none" strokeLinecap="round" />
  </svg>
);

const CoverDogAndCatIllustration: React.FC = () => (
  <div className="flex items-center justify-center gap-4 sm:gap-6 w-full max-w-sm sm:max-w-md my-2">
    <div className="flex flex-col items-center">
      <img
        src={DOG_BOSS_IMAGE_URL}
        alt="黃色土狗"
        referrerPolicy="no-referrer"
        className="w-28 h-28 sm:w-36 sm:h-36 object-contain max-h-36 drop-shadow-md"
      />
      <span className="text-amber-300 font-black text-xs sm:text-sm mt-2">🐕 黃色土狗</span>
    </div>
    <div className="flex flex-col items-center">
      <img
        src={CAT_BOSS_IMAGE_URL}
        alt="三花貓"
        referrerPolicy="no-referrer"
        className="w-28 h-28 sm:w-36 sm:h-36 object-contain max-h-36 drop-shadow-md"
      />
      <span className="text-rose-300 font-black text-xs sm:text-sm mt-2">🐱 三花貓</span>
    </div>
  </div>
);

const WildlifeTeamIllustration: React.FC = () => (
  <div className="flex items-center justify-center p-2">
    <img
      src={WILDLIFE_TEAM_IMAGE_URL}
      alt="野生動物組"
      referrerPolicy="no-referrer"
      className="w-full max-w-sm sm:max-w-md h-auto max-h-52 object-contain drop-shadow-xl transition-all duration-300 hover:scale-105"
    />
  </div>
);
