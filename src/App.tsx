/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  GamePhase,
  Hero,
  Boss,
  BossKey,
  Card,
  CommittedAction,
  FloatingText,
  BattleLog,
  GameRulesConfig,
  DeviceMode,
  PlayerRole,
  PlayerEquipmentSelection,
} from './types';
import { INITIAL_HEROES, createInitialHero } from './data/heroes';
import { DEFAULT_EQUIPMENT_SELECTION, PLAYER_CLASSES } from './data/racesAndEquipment';
import {
  INITIAL_BOSS,
  INITIAL_DOG_BOSS,
  INITIAL_CAT_BOSS,
  chooseBossIntent,
  selectBossMainTarget,
  checkFullTurnRestSlotLock,
  processBittenStatusAndThrash,
} from './data/bosses';
import { REST_CARDS, calculateEffectiveCardSpeed, getCardCategoryTier } from './data/cards';
import { soundFx } from './utils/audio';
import { roomSync } from './utils/sync';
import { PhaseTracker } from './components/PhaseTracker';
import { BossPanel } from './components/BossPanel';
import { HeroCard } from './components/HeroCard';
import { HostManagerView } from './components/HostManagerView';
import { ResolutionStage } from './components/ResolutionStage';
import { RulesModal } from './components/RulesModal';
import { BattleLogDrawer } from './components/BattleLogDrawer';
import { GameSettingsModal } from './components/GameSettingsModal';
import { RoomQrModal } from './components/RoomQrModal';
import { TechStackModal } from './components/TechStackModal';
import { PlayerMobileView } from './components/PlayerMobileView';
import { SettlementPanel } from './components/SettlementPanel';
import { Trophy, Skull, RotateCcw, Monitor, Phone, Layout, Wifi, QrCode, X, UserPlus, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Battle Statistics for Settlement
  const [battleStats, setBattleStats] = useState<{ totalTurns: number; heroDamage: Record<string, number> }>({
    totalTurns: 1,
    heroDamage: {},
  });

  // Game Configuration & Rules
  const [config, setConfig] = useState<GameRulesConfig>({
    priorityFormula: 'SPEED_PLUS_PRIORITY',
    revealBossIntent: false,
    bossIntelMode: 'FULL_SECRET',
    allowCancelLockIn: true,
    autoEndRoundWhenAllReady: true,
    cardsPerTurn: 2,
  });

  // Device & Room Connection State
  const [isLockedPlayerMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return (
        params.get('mode') === 'player' ||
        params.get('role') === 'player' ||
        params.get('player') === '1' ||
        params.get('player') === 'true'
      );
    }
    return false;
  });

  const [deviceMode, setDeviceMode] = useState<DeviceMode>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (
        params.get('mode') === 'player' ||
        params.get('role') === 'player' ||
        params.get('player') === '1' ||
        params.get('player') === 'true'
      ) {
        return 'PLAYER_MOBILE';
      }
    }
    return 'HOST_MAIN';
  });

  const [activeMobileHeroId, setActiveMobileHeroId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('hero') || '';
    }
    return '';
  });

  const [roomCode, setRoomCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('room');
      if (code) return code.toUpperCase();
    }
    return 'CARD-8899';
  });
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isTechStackModalOpen, setIsTechStackModalOpen] = useState<boolean>(false);

  const [heroCount, setHeroCount] = useState<number>(4);
  const [currentTurn, setCurrentTurn] = useState<number>(1);
  const [phase, setPhase] = useState<GamePhase>('COMMIT');

  // Game Entities
  const [heroes, setHeroes] = useState<Hero[]>(INITIAL_HEROES);
  const [bossesMap, setBossesMap] = useState<Record<BossKey, Boss>>({
    DOG: INITIAL_DOG_BOSS,
    CAT: INITIAL_CAT_BOSS,
  });
  const [activeBossKey, setActiveBossKey] = useState<BossKey>('DOG');

  const boss = bossesMap[activeBossKey];

  const setBoss = useCallback((updater: Boss | ((prev: Boss) => Boss)) => {
    setBossesMap((prevMap) => {
      const current = prevMap[activeBossKey];
      const nextBoss = typeof updater === 'function' ? updater(current) : updater;
      return {
        ...prevMap,
        [activeBossKey]: nextBoss,
      };
    });
  }, [activeBossKey]);

  // Screen & Game Flow State
  const [screenState, setScreenState] = useState<'COVER' | 'PREPARATION' | 'BATTLE'>('COVER');
  const [isGoClicked, setIsGoClicked] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Timer State (60s countdown for COMMIT phase)
  const [commitTimeLeft, setCommitTimeLeft] = useState<number>(60);

  // Resolution Queue State
  const [actionQueue, setActionQueue] = useState<CommittedAction[]>([]);
  const [currentActionIndex, setCurrentActionIndex] = useState<number>(0);

  // UI Overlays & Logs
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [battleLogs, setBattleLogs] = useState<BattleLog[]>([]);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [playerJoinedNotification, setPlayerJoinedNotification] = useState<{
    name: string;
    role: string;
    roleKey: PlayerRole;
    id: string;
  } | null>(null);

  useEffect(() => {
    if (playerJoinedNotification) {
      const timer = setTimeout(() => {
        setPlayerJoinedNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [playerJoinedNotification]);
  const [bossFledAlert, setBossFledAlert] = useState<{ name: string; title: string } | null>(null);

  const triggerBossFledAlert = useCallback((bossName: string) => {
    setBossFledAlert({ name: bossName, title: '🏃 BOSS 逃走！' });
    setTimeout(() => {
      setBossFledAlert(null);
    }, 1000);
  }, []);

  // Helper to add battle logs
  const addLog = useCallback((text: string, type: BattleLog['type'] = 'info') => {
    const timeStr = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setBattleLogs((prev) => [
      {
        id: `log_${Date.now()}_${Math.random()}`,
        turn: currentTurn,
        text,
        type,
        timestamp: timeStr,
      },
      ...prev,
    ]);
  }, [currentTurn]);

  // Helper to add floating texts
  const spawnFloatingText = useCallback((targetId: string, text: string, type: FloatingText['type']) => {
    const id = `ft_${Date.now()}_${Math.random()}`;
    setFloatingTexts((prev) => [...prev, { id, targetId, text, type }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
    }, 1000);
  }, []);

  // Initialize or restart game
  const restartGame = useCallback(() => {
    setHeroes((prev) => prev.map((h) => createInitialHero(h.id, h.name, h.role, h.equipment)));
    setBossesMap({
      DOG: { ...INITIAL_DOG_BOSS },
      CAT: { ...INITIAL_CAT_BOSS },
    });
    setCurrentTurn(1);
    setPhase('COMMIT');
    setCommitTimeLeft(60);
    setActionQueue([]);
    setCurrentActionIndex(0);
    setBattleLogs([]);
    setIsGoClicked(false);
    setIsPaused(false);
    setScreenState('PREPARATION');
    setBattleStats({ totalTurns: 1, heroDamage: {} });
    addLog('⚔️ 對戰重置！進入第 1 回合「雙卡交錯結算階段」。', 'phase');
  }, [addLog]);

  // Add custom hero
  const handleAddHero = useCallback((name: string, role: PlayerRole, equipment?: PlayerEquipmentSelection, existingHeroId?: string) => {
    const heroId = existingHeroId || `hero_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const roleName = PLAYER_CLASSES[role]?.name || role;
    
    setHeroes((prev) => {
      if (prev.some((h) => h.id === heroId)) {
        return prev;
      }
      if (prev.length >= 6) {
        addLog('⚠️ 玩家人數已達上限 (最多 6 人)！', 'warning');
        return prev;
      }
      const newHero = createInitialHero(heroId, name, role, equipment || DEFAULT_EQUIPMENT_SELECTION);
      setActiveMobileHeroId((p) => p || heroId);
      
      // Save local hero identity
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('my_hero_id', heroId);
        sessionStorage.setItem('my_hero_name', name);
      }

      addLog(`🎉 玩家【${name}】(${roleName}) 成功加入戰局！`, 'info');
      soundFx.playJoin();
      setPlayerJoinedNotification({
        name,
        role: roleName,
        roleKey: role,
        id: heroId,
      });

      // Broadcast join event to all other open tabs / devices
      roomSync.broadcast({
        type: 'PLAYER_JOIN',
        payload: {
          hero: newHero,
          heroName: name,
          role,
          equipment,
        },
      });

      return [...prev, newHero];
    });
  }, [addLog]);

  // Remove hero
  const handleRemoveHero = useCallback((heroId: string) => {
    setHeroes((prev) => {
      const remaining = prev.filter((h) => h.id !== heroId);
      if (remaining.length > 0 && !remaining.some((h) => h.id === activeMobileHeroId)) {
        setActiveMobileHeroId(remaining[0].id);
      } else if (remaining.length === 0) {
        setActiveMobileHeroId('');
      }
      return remaining;
    });
    addLog(`🗑️ 已移除角色 (ID: ${heroId})`, 'info');
  }, [activeMobileHeroId, addLog]);

  // Initialize RoomSync with current room code
  useEffect(() => {
    if (roomCode) {
      roomSync.setRoomCode(roomCode);
    }
  }, [roomCode]);

  // Realtime Broadcast Sync Subscription
  useEffect(() => {
    const unsubscribe = roomSync.subscribe((event) => {
      if (event.type === 'PLAYER_JOIN') {
        const { hero, heroName, role, equipment } = event.payload || {};
        if (hero) {
          setHeroes((prev) => {
            if (prev.some((h) => h.id === hero.id)) {
              return prev;
            }
            if (prev.length >= 6) return prev;
            const roleName = PLAYER_CLASSES[hero.role as PlayerRole]?.name || hero.role;
            addLog(`🎉 玩家【${hero.name}】(${roleName}) 掃碼加入遊戲房間！`, 'info');
            soundFx.playJoin();
            setPlayerJoinedNotification({
              name: hero.name,
              role: roleName,
              roleKey: hero.role,
              id: hero.id,
            });
            return [...prev, hero];
          });
        } else if (heroName) {
          const selectedRole: PlayerRole = role || 'PYCNONOTUS';
          handleAddHero(heroName, selectedRole, equipment);
        }
      } else if (event.type === 'PLAYER_LOCK_IN') {
        const { heroId, selectedCardIds } = event.payload || {};
        setHeroes((prev) =>
          prev.map((h) =>
            h.id === heroId
              ? {
                  ...h,
                  selectedCardIds: selectedCardIds || [],
                  isReady: true,
                }
              : h
          )
        );
        addLog(`📱 收到手機控制器玩家 ${heroId} 鎖定訊號！`, 'info');
      } else if (event.type === 'PLAYER_REMOVE') {
        const { heroId } = event.payload || {};
        if (heroId) {
          setHeroes((prev) => prev.filter((h) => h.id !== heroId));
        }
      } else if (event.type === 'HOST_SYNC') {
        const { screenState: hostScreenState, isGoClicked: hostIsGoClicked, phase: hostPhase, commitTimeLeft: hostTimeLeft } = event.payload || {};
        if (hostScreenState !== undefined) {
          setScreenState(hostScreenState);
        }
        if (hostIsGoClicked !== undefined) {
          setIsGoClicked(Boolean(hostIsGoClicked));
        }
        if (hostPhase !== undefined) {
          setPhase(hostPhase);
        }
        if (hostTimeLeft !== undefined) {
          setCommitTimeLeft(hostTimeLeft);
        }
      }
    });
    return unsubscribe;
  }, [addLog, handleAddHero]);

  // Broadcast Host state updates to keep all joined mobile devices in sync
  useEffect(() => {
    if (deviceMode === 'HOST_MAIN' || deviceMode === 'SPLIT_SIMULATOR') {
      roomSync.broadcast({
        type: 'HOST_SYNC',
        payload: {
          screenState,
          isGoClicked,
          phase,
          commitTimeLeft,
          currentTurn,
        },
      });
    }
  }, [screenState, isGoClicked, phase, currentTurn, deviceMode]);

  // Initial room state fetch
  useEffect(() => {
    if (roomCode) {
      roomSync.fetchRoomState(roomCode).then((state) => {
        if (state) {
          if (state.screenState !== undefined) setScreenState(state.screenState);
          if (state.isGoClicked !== undefined) setIsGoClicked(Boolean(state.isGoClicked));
          if (state.phase !== undefined) setPhase(state.phase);
          if (state.heroes && Array.isArray(state.heroes) && state.heroes.length > 0) {
            setHeroes((prev) => {
              const existingIds = new Set(prev.map((h) => h.id));
              const newOnes = state.heroes.filter((h: any) => !existingIds.has(h.id));
              return [...prev, ...newOnes];
            });
          }
        }
      });
    }
  }, [roomCode]);

  // Handle changing hero count
  const handleChangeHeroCount = (count: number) => {
    setHeroCount(count);
    setHeroes((prev) => {
      if (prev.length >= count) {
        return prev.slice(0, count).map((h) => createInitialHero(h.id, h.name, h.role, h.equipment));
      }
      const result = prev.map((h) => createInitialHero(h.id, h.name, h.role, h.equipment));
      const defaultRoles: PlayerRole[] = ['PYCNONOTUS', 'MUS_CAROLI', 'PAGUMA_LARVATA', 'MELOGALE_MOSCHATA'];
      for (let i = prev.length; i < count; i++) {
        const role = defaultRoles[i % defaultRoles.length];
        const roleName = PLAYER_CLASSES[role].name;
        result.push(createInitialHero(`hero_${Date.now()}_${i}`, `玩家 ${i + 1} (${roleName})`, role));
      }
      return result;
    });
    setCurrentTurn(1);
    setPhase('COMMIT');
    setActionQueue([]);
  };

  // Toggle Card Selection for Hero (直接點擊出牌/取消出牌)
  const handleTogglePlayerCard = (heroId: string, card: Card) => {
    setHeroes((prev) =>
      prev.map((h) => {
        if (h.id === heroId && !h.isReady) {
          const currentIds = h.selectedCardIds || [];
          const isSelected = currentIds.includes(card.id);
          let nextIds = [...currentIds];

          if (isSelected) {
            nextIds = nextIds.filter((id) => id !== card.id);
          } else {
            if (checkFullTurnRestSlotLock(card)) {
              nextIds = [card.id];
            } else {
              const currentTotalCost = nextIds.reduce((sum, id) => {
                const c = h.hand.find((item) => item.id === id);
                return sum + (c ? c.cost : 0);
              }, 0);
              if (currentTotalCost + card.cost <= h.energy) {
                nextIds.push(card.id);
              }
            }
          }

          return {
            ...h,
            selectedCardIds: nextIds,
            targetIds: nextIds.map(() => (card.targetType === 'SINGLE_ALLY' ? h.id : boss.id)),
          };
        }
        return h;
      })
    );
  };

  // Legacy compatibility wrappers for single card click
  const handleSelectSlot1Card = (heroId: string, card: Card) => {
    handleTogglePlayerCard(heroId, card);
  };
  const handleSelectSlot2Card = (heroId: string, card: Card) => {
    handleTogglePlayerCard(heroId, card);
  };

  // Toggle Lock-In for Hero
  const handleToggleReady = (heroId: string) => {
    setHeroes((prev) =>
      prev.map((h) => {
        if (h.id === heroId) {
          const nextReady = !h.isReady;
          if (nextReady) {
            let cardIds = h.selectedCardIds || [];
            if (cardIds.length === 0) {
              const affordable = h.hand.find((c) => c.cost <= h.energy) || REST_CARDS[0];
              cardIds = [affordable.id];
            }
            addLog(`🔒 玩家 ${h.name} 鎖定出牌（共 ${cardIds.length} 張）！`, 'info');

            // Broadcast lock in event
            roomSync.broadcast({
              type: 'PLAYER_LOCK_IN',
              payload: { heroId: h.id, selectedCardIds: cardIds },
            });

            return {
              ...h,
              selectedCardIds: cardIds,
              isReady: true,
            };
          }
          return { ...h, isReady: nextReady };
        }
        return h;
      })
    );
  };

  // Fast Lock-In All Remaining Heroes
  const handleFastLockInAll = () => {
    setHeroes((prev) =>
      prev.map((h) => {
        if (h.hp > 0 && !h.isReady) {
          let cardIds = h.selectedCardIds || [];
          if (cardIds.length === 0) {
            const first = h.hand[0] || REST_CARDS[0];
            cardIds = [first.id];
          }
          return {
            ...h,
            selectedCardIds: cardIds,
            isReady: true,
          };
        }
        return h;
      })
    );
    addLog('⚡ 已使用一鍵全員鎖定。尚未選牌的玩家自動帶入手牌。', 'info');
  };

  // Boss Switching Handler
  const handleSelectBossKey = (bossKey: 'DOG' | 'CAT') => {
    setActiveBossKey(bossKey);
    const targetBoss = bossesMap[bossKey];

    // 終止當前正在執行的行動與佇列
    setActionQueue([]);
    setCurrentActionIndex(0);

    // 重置所有存活英雄的回合狀態
    setHeroes((prev) =>
      prev.map((h) => {
        if (h.hp <= 0) return h;
        return {
          ...h,
          energy: h.maxEnergy,
          shield: 0,
          isReady: false,
          selectedCardIds: [],
        };
      })
    );

    // 重置目標 BOSS 的護甲與意圖
    setBossesMap((prev) => ({
      ...prev,
      [bossKey]: {
        ...prev[bossKey],
        shield: 0,
        intent: null,
      },
    }));

    // 強制進入下一回合
    setCurrentTurn((prevTurn) => {
      const nextTurn = prevTurn + 1;
      setBattleStats((prev) => ({ ...prev, totalTurns: nextTurn }));
      return nextTurn;
    });

    setPhase('COMMIT');
    setCommitTimeLeft(60);

    addLog(
      `👑 房主切換 BOSS 為【${targetBoss.name}】(${targetBoss.title})！已強制終止原本行動，並直接進入下一回合。`,
      'boss'
    );
  };

  // Boss Manual Intent Handler (房主手動出牌)
  const handleSetBossIntent = (selectedCards: Card[], targetIds?: string[]) => {
    setBoss((prev) => ({
      ...prev,
      intent: {
        selectedCards,
        targetIds: targetIds || ['ALL'],
        isRevealed: config.bossIntelMode === 'REVEALED',
      },
    }));
    addLog(`🎮 房主手動選定 BOSS【${boss.name}】卡牌（共 ${selectedCards.length} 張）！`, 'boss');
  };

  // Boss Randomize Intent Handler
  const handleRandomizeBossIntent = () => {
    const activeTargets = heroes.filter((h) => h.hp > 0);
    if (activeTargets.length > 0) {
      const bossChoice = chooseBossIntent(boss, activeTargets);
      setBoss((prev) => ({
        ...prev,
        intent: {
          selectedCards: bossChoice.selectedCards,
          targetIds: bossChoice.targetIds,
          isRevealed: config.bossIntelMode === 'REVEALED',
        },
      }));
      addLog(`🎲 房主觸發 AI 隨機派定 BOSS【${boss.name}】卡牌意圖（共 ${bossChoice.selectedCards.length} 張）。`, 'boss');
    }
  };

  // Check if Boss Intent needs to be generated in Commit Phase
  useEffect(() => {
    if (phase === 'COMMIT' && (!boss.intent || boss.intent.selectedCards.length === 0)) {
      const activeTargets = heroes.filter((h) => h.hp > 0);
      if (activeTargets.length > 0) {
        const bossChoice = chooseBossIntent(boss, activeTargets);
        setBoss((prev) => ({
          ...prev,
          intent: {
            selectedCards: bossChoice.selectedCards,
            targetIds: bossChoice.targetIds,
            isRevealed: config.bossIntelMode === 'REVEALED',
          },
        }));
      }
    }
  }, [phase, boss, heroes, config.bossIntelMode]);

  // 1-Minute (60-second) Timer for COMMIT Phase
  useEffect(() => {
    if (phase !== 'COMMIT' || isPaused || screenState !== 'BATTLE') return;

    const timer = setInterval(() => {
      setCommitTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, currentTurn, isPaused, screenState]);

  // Handle Time Up -> Lock in selected cards or Auto-select REST card
  useEffect(() => {
    if (phase === 'COMMIT' && commitTimeLeft === 0) {
      let autoRestTriggered = false;

      setHeroes((prevHeroes) =>
        prevHeroes.map((h) => {
          if (h.hp <= 0 || h.isReady) return h;

          const currentSelected = h.selectedCardIds || [];
          if (currentSelected.length > 0) {
            // Already has selected cards -> lock in
            return { ...h, isReady: true };
          }

          // No cards selected -> Auto-select Rest Card
          const hand = h.hand || [];
          const restCard = hand.find((c) => c.type === 'REST') || REST_CARDS[0];
          autoRestTriggered = true;
          return {
            ...h,
            selectedCardIds: [restCard.id],
            isReady: true,
          };
        })
      );

      if (autoRestTriggered) {
        addLog(`⏱️ 1分鐘選牌時間截止！未選牌玩家自動選擇【休息牌】並鎖定出牌。`, 'info');
      } else {
        addLog(`⏱️ 1分鐘選牌時間截止！已將所有玩家選擇之卡牌自動鎖定。`, 'info');
      }
    }
  }, [commitTimeLeft, phase, addLog]);

  // Auto-Start Resolution Phase when everyone is locked in
  useEffect(() => {
    if (phase === 'COMMIT') {
      const aliveHeroes = heroes.filter((h) => h.hp > 0);
      const allHeroesLocked = aliveHeroes.length > 0 && aliveHeroes.every((h) => h.isReady);
      const isBossLocked = boss.intent !== null && Boolean(boss.intent.selectedCards && boss.intent.selectedCards.length > 0);

      if (allHeroesLocked && isBossLocked) {
        const autoStartTimer = setTimeout(() => {
          handleStartResolutionPhase();
        }, 500);
        return () => clearTimeout(autoStartTimer);
      }
    }
  }, [phase, heroes, boss.intent]);

  // Auto-step through action queue during RESOLVING phase (2.0s interval between card calculations)
  useEffect(() => {
    if (phase === 'RESOLVING') {
      if (currentActionIndex < actionQueue.length) {
        const currentAct = actionQueue[currentActionIndex];
        const isDeadActor = currentAct?.actorType === 'PLAYER' && heroes.some((h) => h.id === currentAct.actorId && h.hp <= 0);
        // 每張牌計算中間間隔 2 秒 (2000ms)
        const stepDelay = isDeadActor ? 50 : 2000;
        const stepTimer = setTimeout(() => {
          handleExecuteNextStep();
        }, stepDelay);
        return () => clearTimeout(stepTimer);
      } else {
        const finishTimer = setTimeout(() => {
          handleFinishResolution();
        }, 2000);
        return () => clearTimeout(finishTimer);
      }
    }
  }, [phase, currentActionIndex, actionQueue, heroes]);

  // Transition from COMMIT -> RESOLVING Phase (Priority Order: Defense > Rest > Intimidate > Attack)
  const handleStartResolutionPhase = () => {
    if (!boss.intent || !boss.intent.selectedCards) return;

    const queue: CommittedAction[] = [];
    const bossCards = boss.intent.selectedCards;

    let maxCount = bossCards.length;
    heroes.forEach((h) => {
      if (h.hp > 0 && h.selectedCardIds && h.selectedCardIds.length > maxCount) {
        maxCount = h.selectedCardIds.length;
      }
    });

    for (let orderIndex = 0; orderIndex < maxCount; orderIndex++) {
      const cardOrderNum = orderIndex + 1;
      const actionsForThisOrder: CommittedAction[] = [];

      // 1. Boss action for this order slot
      if (orderIndex < bossCards.length) {
        const bCard = bossCards[orderIndex];
        const bTarget = boss.intent.targetIds[orderIndex] || boss.intent.targetIds[0] || 'ALL';
        const bossEffectiveSpeed = calculateEffectiveCardSpeed(boss.speed, bCard);

        actionsForThisOrder.push({
          id: `act_boss_order${cardOrderNum}_${Date.now()}`,
          cardOrder: cardOrderNum,
          actorId: boss.id,
          actorName: boss.name,
          actorType: 'BOSS',
          card: bCard,
          targetId: bTarget,
          effectiveSpeed: bossEffectiveSpeed,
          status: 'PENDING',
        });
      }

      // 2. Player actions for this order slot
      heroes.forEach((h) => {
        if (h.hp > 0 && h.selectedCardIds && orderIndex < h.selectedCardIds.length) {
          const cardId = h.selectedCardIds[orderIndex];
          const hand = h.hand || [];
          const card = hand.find((c) => c.id === cardId) || REST_CARDS[0];
          const speedVal = calculateEffectiveCardSpeed(h.speed, card);
          const targetId = (h.targetIds && h.targetIds[orderIndex]) || (card.targetType === 'SINGLE_ALLY' ? h.id : boss.id);

          actionsForThisOrder.push({
            id: `act_${h.id}_order${cardOrderNum}_${Date.now()}`,
            cardOrder: cardOrderNum,
            actorId: h.id,
            actorName: h.name,
            actorType: 'PLAYER',
            actorRole: h.role,
            card,
            targetId,
            effectiveSpeed: speedVal,
            status: 'PENDING',
          });
        }
      });

      // 算牌優先度：防禦 (4000) > 休息 (3000) > 威嚇 (2000) > 攻擊 (1000)，同類型比敏捷+優先級
      actionsForThisOrder.sort((a, b) => b.effectiveSpeed - a.effectiveSpeed);
      queue.push(...actionsForThisOrder);
    }

    setActionQueue(queue);
    setCurrentActionIndex(0);
    setPhase('RESOLVING');
    addLog(`⚡ 全員出牌鎖定！依據「防禦 ＞ 休息 ＞ 威嚇 ＞ 攻擊」優先度進入動態結算階段。`, 'phase');
  };

  // Helper to process Boss Enrage/Barking and Boss Flee transitions
  const checkBossStateTransitions = useCallback((updatedBoss: Boss) => {
    let nextBoss = { ...updatedBoss };

    // 1. BOSS 狗狂暴 Barking 觸發 (HP <= 30%)
    if (
      nextBoss.bossKey === 'DOG' &&
      nextBoss.hp > 0 &&
      nextBoss.hp <= nextBoss.maxHp * 0.3 &&
      !nextBoss.statuses.some((s) => s.type === 'BARK')
    ) {
      nextBoss.statuses = [
        ...nextBoss.statuses,
        { type: 'BARK', duration: 99, value: 2 },
      ];

      setHeroes((prevHeroes) =>
        prevHeroes.map((h) => {
          if (h.hp <= 0) return h;
          const existingIdx = h.statuses.findIndex((s) => s.type === 'DEFENSE_DOWN');
          let updatedStatuses = [...h.statuses];
          if (existingIdx >= 0) {
            updatedStatuses[existingIdx] = {
              type: 'DEFENSE_DOWN',
              duration: 2,
              value: (updatedStatuses[existingIdx].value || 1) + 1,
            };
          } else {
            updatedStatuses.push({ type: 'DEFENSE_DOWN', duration: 2, value: 1 });
          }
          spawnFloatingText(h.id, `🛡️ 防禦 -1`, 'status');
          return { ...h, statuses: updatedStatuses };
        })
      );

      spawnFloatingText(nextBoss.id, `🐕 狂暴吠叫!`, 'status');
      addLog(
        `🐕 BOSS 黃色土狗進入【狂暴狀態】(HP ≤ 30%)！發動【吠叫】：攻擊力 +2，命中率 +10%！所有玩家防禦力降低 1 點（持續 2 回合）！`,
        'boss'
      );
    }

    // 2. BOSS 逃走機制 (HP <= 5%)
    const escapeThreshold = Math.ceil(nextBoss.maxHp * 0.05);
    if (nextBoss.hp <= escapeThreshold) {
      if (nextBoss.bossKey === 'DOG') {
        triggerBossFledAlert('🐕 黃色土狗');
        addLog(`🐕 BOSS 黃色土狗體力不支 (HP ≤ 5%) 狼狽逃離戰場！`, 'boss');
        spawnFloatingText(nextBoss.id, `🏃 逃走!`, 'status');

        // DOG escape rewards for all players: +2 attack for 2 turns
        setHeroes((prevHeroes) =>
          prevHeroes.map((h) => {
            if (h.hp <= 0) return h;
            const existingStrIdx = h.statuses.findIndex((s) => s.type === 'STRENGTH');
            let updatedStatuses = [...h.statuses];
            if (existingStrIdx >= 0) {
              updatedStatuses[existingStrIdx] = {
                type: 'STRENGTH',
                duration: 2,
                value: (updatedStatuses[existingStrIdx].value || 0) + 2,
              };
            } else {
              updatedStatuses.push({ type: 'STRENGTH', duration: 2, value: 2 });
            }
            spawnFloatingText(h.id, `⚔️ 攻擊+2`, 'status');
            return { ...h, statuses: updatedStatuses };
          })
        );

        addLog(
          `🎁 BOSS 狗逃走！全體玩家獲得【力量爆發】（攻擊力 +2，持續 2 回合）！`,
          'info'
        );

        // Switch active boss to CAT
        setActiveBossKey('CAT');
        addLog(`🐱 關卡進度 2/2：三花貓 接替進入戰場！`, 'boss');
        soundFx.playVictory();
      } else if (nextBoss.bossKey === 'CAT') {
        triggerBossFledAlert('🐱 三花貓');
        addLog(`🐱 BOSS 三花貓體力不支 (HP ≤ 5%) 倉皇逃離戰場！`, 'boss');
        spawnFloatingText(nextBoss.id, `🏃 逃走!`, 'status');
        addLog(`🏆 兩隻 BOSS 皆已成功擊退逃走，野生動物團隊獲得最終大勝利！`, 'phase');
        setPhase('VICTORY');
        soundFx.playVictory();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }
    }

    return nextBoss;
  }, [addLog, spawnFloatingText]);

  // Step-by-Step Resolution Execution
  const handleExecuteNextStep = () => {
    if (currentActionIndex >= actionQueue.length) return;

    const action = actionQueue[currentActionIndex];
    const card = action.card;

    if (action.actorType === 'PLAYER') {
      const actor = heroes.find((h) => h.id === action.actorId);
      if (!actor || actor.hp <= 0) {
        addLog(`⚠️ 玩家 ${action.actorName} 已無法行動，跳過本卡牌發動。`, 'info');
        setCurrentActionIndex((prev) => prev + 1);
        return;
      }

      // Rest Card Effect handling
      if (card.type === 'REST') {
        const healAmt = card.heal ?? (actor.role === 'MELOGALE_MOSCHATA' ? 15 : 5);
        setHeroes((prev) =>
          prev.map((h) =>
            h.id === actor.id
              ? {
                  ...h,
                  hp: Math.min(h.maxHp, h.hp + healAmt),
                }
              : h
          )
        );
        spawnFloatingText(actor.id, `+${healAmt} HP`, 'heal');
        soundFx.playHeal();
        addLog(`🍃 ${actor.name} 發動【休息】，恢復 ${healAmt} HP！`, 'heal');
      } else {
        // Standard Card Execution
        setHeroes((prev) =>
          prev.map((h) => {
            if (h.id === actor.id) {
              return {
                ...h,
                energy: Math.max(0, h.energy - card.cost),
              };
            }
            return h;
          })
        );

        if (card.block) {
          if (card.targetType === 'ALL_ALLIES') {
            setHeroes((prev) =>
              prev.map((h) => (h.hp > 0 ? { ...h, shield: h.shield + card.block! } : h))
            );
            spawnFloatingText(actor.id, `+${card.block} 護甲`, 'block');
            soundFx.playBlock();
            addLog(`🛡️ ${actor.name} 發動「${card.name}」，全隊獲得 ${card.block} 護甲！`, 'defend');
          } else {
            setHeroes((prev) =>
              prev.map((h) => (h.id === actor.id ? { ...h, shield: h.shield + card.block! } : h))
            );
            spawnFloatingText(actor.id, `+${card.block} 護甲`, 'block');
            soundFx.playBlock();
            addLog(`🛡️ ${actor.name} 發動「${card.name}」，獲得 ${card.block} 護甲。`, 'defend');
          }
        }

        if (card.heal) {
          if (card.targetType === 'ALL_ALLIES') {
            setHeroes((prev) =>
              prev.map((h) => (h.hp > 0 ? { ...h, hp: Math.min(h.maxHp, h.hp + card.heal!) } : h))
            );
            spawnFloatingText(actor.id, `+${card.heal} HP`, 'heal');
            soundFx.playHeal();
            addLog(`✨ ${actor.name} 發動「${card.name}」，全隊回復 ${card.heal} 生命值！`, 'heal');
          } else {
            const targetAllyId = action.targetId || actor.id;
            setHeroes((prev) =>
              prev.map((h) =>
                h.id === targetAllyId ? { ...h, hp: Math.min(h.maxHp, h.hp + card.heal!) } : h
              )
            );
            spawnFloatingText(targetAllyId, `+${card.heal} HP`, 'heal');
            soundFx.playHeal();
            addLog(`✨ ${actor.name} 發動「${card.name}」，回復目標 ${card.heal} 生命值。`, 'heal');
          }
        }

        if (card.damage) {
          let baseDmg = card.damage!;
          const strengthBonus = actor.statuses
            .filter((s) => s.type === 'STRENGTH')
            .reduce((sum, s) => sum + (s.value || 0), 0);
          baseDmg += strengthBonus;

          // 白頭翁與月鼠的攻擊力上限，最高 8 點
          if (actor.role === 'PYCNONOTUS' || actor.role === 'MUS_CAROLI') {
            baseDmg = Math.min(8, baseDmg);
          }

          let isCrit = false;
          // 白頭翁 25% 機率觸發 3 倍暴擊
          if (actor.role === 'PYCNONOTUS' && Math.random() < 0.25) {
            baseDmg *= 3;
            isCrit = true;
          }

          // 累計英雄傷害數據
          setBattleStats((prev) => ({
            ...prev,
            heroDamage: {
              ...prev.heroDamage,
              [actor.id]: (prev.heroDamage[actor.id] || 0) + baseDmg,
            },
          }));

          setBoss((prevBoss) => {
            let currentShield = prevBoss.shield;
            let currentHp = prevBoss.hp;
            let damageToDeal = baseDmg;

            if (currentShield > 0) {
              if (currentShield >= damageToDeal) {
                currentShield -= damageToDeal;
                damageToDeal = 0;
              } else {
                damageToDeal -= currentShield;
                currentShield = 0;
              }
            }

            currentHp = Math.max(0, currentHp - damageToDeal);

            // 白鼻心與鼬獾攻擊有 50% 機率造成 BOSS 流血狀態 (持續 5 回合，每回合 -2 HP)
            let updatedStatuses = [...prevBoss.statuses];
            if (
              (actor.role === 'PAGUMA_LARVATA' || actor.role === 'MELOGALE_MOSCHATA') &&
              Math.random() < 0.5
            ) {
              const existingIndex = updatedStatuses.findIndex((s) => s.type === 'BLEED');
              if (existingIndex >= 0) {
                updatedStatuses[existingIndex] = { type: 'BLEED', duration: 5, value: 2 };
              } else {
                updatedStatuses.push({ type: 'BLEED', duration: 5, value: 2 });
              }
              addLog(`🩸 ${actor.name} 爪牙鋒利（50%機率），使 ${prevBoss.name} 陷入【流血】狀態（持續 5 回合，每回合 -2 HP）！`, 'attack');
            }

            spawnFloatingText(prevBoss.id, `-${baseDmg} HP${isCrit ? ' 💥3x!' : ''}`, 'damage');
            soundFx.playAttack();
            addLog(
              `🗡️ ${actor.name} 發動 (Slot ${action.slotIndex})「${card.name}」，對 ${prevBoss.name} 造成 ${baseDmg} 傷害！${isCrit ? ' (⚡白頭翁觸發 3 倍暴擊！)' : ''}`,
              'attack'
            );

            const updatedBoss = {
              ...prevBoss,
              shield: currentShield,
              hp: currentHp,
              statuses: updatedStatuses,
            };

            return checkBossStateTransitions(updatedBoss);
          });
        }
      }
    } else {
      // BOSS Actions
      const bossEscapeThreshold = Math.ceil(boss.maxHp * 0.05);
      if (boss.hp <= bossEscapeThreshold) {
        triggerBossFledAlert(boss.name);
        addLog(`🏃 BOSS 已逃走，取消 BOSS 本次攻擊！`, 'boss');
        setCurrentActionIndex((prev) => prev + 1);
        return;
      }

      addLog(`🔥 BOSS ${boss.name} 發動 (Slot ${action.slotIndex})「${card.name}」！`, 'boss');

      if (card.heal) {
        const healAmt = card.heal || 30;
        setBoss((prev) => {
          // 清除負面狀態 (如 BLEED, WEAK)
          const cleansedStatuses = prev.statuses.filter(
            (s) => s.type === 'STRENGTH' || s.type === 'DEFENSE'
          );
          return {
            ...prev,
            hp: Math.min(prev.maxHp, prev.hp + healAmt),
            statuses: cleansedStatuses,
          };
        });
        spawnFloatingText(boss.id, `+${healAmt} HP / 淨化`, 'heal');
        soundFx.playHeal();
        addLog(`🍃 ${boss.name} 發動休息牌「${card.name}」，回復 ${healAmt} 生命值並【淨化】身上的所有負面效果！`, 'heal');
      }

      if (card.block) {
        setBoss((prev) => ({ ...prev, shield: prev.shield + card.block! }));
        spawnFloatingText(boss.id, `+${card.block} 護甲`, 'block');
        soundFx.playBlock();
      }

      if (card.damage) {
        // 狂暴狀態 (Enrage) 與 BARK (吠叫) 狀態: 攻擊傷害 +2
        const isEnraged = boss.hp > 0 && boss.hp <= boss.maxHp * 0.3;
        const isBarking = boss.bossKey === 'DOG' && (isEnraged || boss.statuses.some((s) => s.type === 'BARK'));
        const enrageBonus = isBarking ? 2 : isEnraged ? 2 : 0;
        if (isBarking) {
          addLog(`🔥 ${boss.name} 處於【狂暴吠叫狀態】，攻擊附加額外 +2 點傷害，命中率 +10%！`, 'boss');
        } else if (isEnraged) {
          addLog(`🔥 ${boss.name} 處於【狂暴狀態】(HP ≤ 30%)，攻擊附加額外 +2 點傷害！`, 'boss');
        }

        const getBossHitRate = (targetHero: Hero, isGroup: boolean): number => {
          let baseHitRate = boss.bossKey === 'CAT' ? 100 : 90;

          if (boss.bossKey === 'CAT') {
            // 對於種族為 白鼻心 或 鼬獾 的玩家，命中率下降 30%(固定)
            if (targetHero.role === 'PAGUMA_LARVATA' || targetHero.role === 'MELOGALE_MOSCHATA') {
              baseHitRate -= 30;
            }
          } else if (boss.bossKey === 'DOG') {
            // BOSS 狗狂暴吠叫：命中率 +10%
            if (boss.statuses.some((s) => s.type === 'BARK') || (boss.hp > 0 && boss.hp <= boss.maxHp * 0.3)) {
              baseHitRate += 10;
            }

            // 對於種族為 白頭翁 或 月鼠 的玩家，命中率下降 20%(固定)
            if (targetHero.role === 'PYCNONOTUS' || targetHero.role === 'MUS_CAROLI') {
              baseHitRate -= 20;
            }
            // 鼬獾發臭時 (HP <= 50%)，BOSS 狗對鼬獾命中率降為 50%
            if (targetHero.role === 'MELOGALE_MOSCHATA' && targetHero.hp > 0 && targetHero.hp <= targetHero.maxHp * 0.5) {
              baseHitRate = 50;
            }
          }

          // 無視玩家閃避，BOSS 最低命中率保底 50%
          const minHitRate = 50;
          return Math.max(minHitRate, Math.min(100, baseHitRate));
        };

        if (card.targetType === 'ALL_ALLIES') {
          let anyHit = false;
          setHeroes((prev) =>
            prev.map((h) => {
              if (h.hp <= 0) return h;

              const hitRate = getBossHitRate(h, true);
              const roll = Math.random() * 100;

              if (roll > hitRate) {
                spawnFloatingText(h.id, `MISS!`, 'miss');
                addLog(`💨 ${h.name} 成功閃避了 BOSS 的範圍攻擊！(命中率 ${hitRate.toFixed(0)}%)`, 'info');
                return h;
              }

              anyHit = true;

              // BOSS 貓對 白頭翁 / 月鼠 有 2% 機率觸發一擊必殺
              const isInstaKill = boss.bossKey === 'CAT' && (h.role === 'PYCNONOTUS' || h.role === 'MUS_CAROLI') && Math.random() < 0.02;
              if (isInstaKill) {
                spawnFloatingText(h.id, `☠️ 一擊必殺!`, 'damage');
                addLog(`☠️ ${boss.name} 發動天敵本能（2%機率），無視防禦直接將 ${h.name} 一擊必殺！`, 'attack');
                return { ...h, hp: 0, shield: 0 };
              }

              let shield = h.shield;
              let hp = h.hp;

              const def = h.stats?.defense || 1;
              const defDown = h.statuses
                .filter((s) => s.type === 'DEFENSE_DOWN' || s.type === 'WEAK')
                .reduce((sum, s) => sum + (s.value || 1), 0);
              const effectiveDef = Math.max(0, def - defDown);
              const defReduction = Math.max(0, effectiveDef - 1) * 2;
              let rawDmg = Math.max(0, (card.damage || 10) + enrageBonus - defReduction);
              let dmg = rawDmg;

              if (shield > 0) {
                if (shield >= dmg) {
                  shield -= dmg;
                  dmg = 0;
                } else {
                  dmg -= shield;
                  shield = 0;
                }
              }
              hp = Math.max(0, hp - dmg);
              spawnFloatingText(h.id, `-${rawDmg} HP`, 'damage');
              return { ...h, shield, hp };
            })
          );
          if (anyHit) {
            soundFx.playAttack();
          }
          addLog(`💥 BOSS 發動範圍連擊「${card.name}」，每位玩家依據閃避與防禦進行判定！`, 'attack');
        } else {
          const aliveHeroes = heroes.filter((h) => h.hp > 0);
          if (aliveHeroes.length > 0) {
            let targetHero = aliveHeroes.find((h) => h.id === action.targetId);
            if (!targetHero) {
              targetHero = selectBossMainTarget(boss.bossKey, aliveHeroes);
            }

            // 鼬獾發臭時 (HP <= 50%)，若 BOSS 單體目標為鼬獾，有 70% 機率轉而攻擊其他玩家
            if (targetHero.role === 'MELOGALE_MOSCHATA' && targetHero.hp <= targetHero.maxHp * 0.5) {
              const otherAliveHeroes = aliveHeroes.filter((h) => h.id !== targetHero!.id);
              if (otherAliveHeroes.length > 0 && Math.random() < 0.7) {
                const redirectedTarget = otherAliveHeroes[Math.floor(Math.random() * otherAliveHeroes.length)];
                addLog(`🦨 ${targetHero.name} 散發陣陣惡臭！${boss.name} 難以忍受（70%機率轉移），轉而攻擊 ${redirectedTarget.name}！`, 'info');
                targetHero = redirectedTarget;
              }
            }

            const hitRate = getBossHitRate(targetHero, false);
            const roll = Math.random() * 100;

            if (roll > hitRate) {
              spawnFloatingText(targetHero.id, `MISS!`, 'miss');
              soundFx.playBlock();
              addLog(`💨 ${boss.name} 的攻擊「${card.name}」未能擊中 ${targetHero.name} (閃避/失敗，命中率 ${hitRate.toFixed(0)}%)！`, 'info');
            } else {
              // Check for 2% insta-kill from BOSS Cat on Pycnonotus / Mus Caroli
              const isInstaKill = boss.bossKey === 'CAT' && (targetHero.role === 'PYCNONOTUS' || targetHero.role === 'MUS_CAROLI') && Math.random() < 0.02;

              if (isInstaKill) {
                setHeroes((prev) =>
                  prev.map((h) => (h.id === targetHero!.id ? { ...h, hp: 0, shield: 0 } : h))
                );
                spawnFloatingText(targetHero.id, `☠️ 一擊必殺!`, 'damage');
                soundFx.playAttack();
                addLog(`☠️ ${boss.name} 發動天敵本能（2%機率），無視防禦直接將 ${targetHero.name} 一擊必殺！`, 'attack');
              } else {
                const bittenResult = processBittenStatusAndThrash(targetHero, card.id === 'dog_bite');
                const isHeavyAttack = card.name.includes('重擊') || card.id.includes('heavy');
                const isCriticalIgnored = isHeavyAttack && Boolean(targetHero.equipment?.hiddenEffectFlags?.ignoreBossCritical);
                const baseCardDamage = (isCriticalIgnored ? 10 : (card.damage || 10)) + enrageBonus;

                // 防禦點數扣除（考慮 DEFENSE_DOWN 狀態）
                const def = targetHero.stats?.defense || 1;
                const defDown = targetHero.statuses
                  .filter((s) => s.type === 'DEFENSE_DOWN' || s.type === 'WEAK')
                  .reduce((sum, s) => sum + (s.value || 1), 0);
                const effectiveDef = Math.max(0, def - defDown);
                const defReduction = Math.max(0, effectiveDef - 1) * 2;
                const reducedBaseDamage = Math.max(0, baseCardDamage - defReduction);
                const totalDamageToDeal = reducedBaseDamage + bittenResult.extraDamage;

                if (isCriticalIgnored) {
                  addLog(`🛡️ ${targetHero.name} 的【黑熊腳】被動生效，無視了 BOSS 的「重擊」重創！`, 'info');
                }
                if (defReduction > 0) {
                  addLog(`🛡️ ${targetHero.name} 防禦數值 ${effectiveDef}（超額 ${effectiveDef - 1} 點），BOSS 攻擊力減免 ${defReduction} 點！`, 'info');
                }

                setHeroes((prev) =>
                  prev.map((h) => {
                    if (h.id === targetHero!.id) {
                      let shield = h.shield;
                      let hp = h.hp;
                      let dmg = totalDamageToDeal;

                      if (shield > 0) {
                        if (shield >= dmg) {
                          shield -= dmg;
                          dmg = 0;
                        } else {
                          dmg -= shield;
                          shield = 0;
                        }
                      }
                      hp = Math.max(0, hp - dmg);

                      // Update Statuses (BITTEN)
                      let updatedStatuses = [...h.statuses];
                      if (bittenResult.statusRemoved) {
                        updatedStatuses = updatedStatuses.filter((s) => s.type !== 'BITTEN');
                      }
                      if (bittenResult.statusAdded && !updatedStatuses.some((s) => s.type === 'BITTEN')) {
                        updatedStatuses.push({ type: 'BITTEN', duration: 2, value: 1 });
                      }

                      spawnFloatingText(h.id, `-${dmg} HP`, 'damage');
                      return { ...h, shield, hp, statuses: updatedStatuses };
                    }
                    return h;
                  })
                );

                soundFx.playAttack();
                addLog(`💥 ${boss.name} 發動「${card.name}」擊中 ${targetHero.name}，造成 ${totalDamageToDeal} 傷害！`, 'attack');
                if (bittenResult.logText) {
                  addLog(bittenResult.logText, 'boss');
                }
              }
            }
          }
        }
      }
    }

    setCurrentActionIndex((prev) => prev + 1);
  };

  // Complete Resolution Phase & Enter END_TURN
  const handleFinishResolution = () => {
    // 結算回合結束狀態效果（如 BOSS 流血扣血 -2 HP）
    let currentBossHp = boss.hp;
    const bleedEffect = boss.statuses.find((s) => s.type === 'BLEED');

    if (bleedEffect && currentBossHp > 0) {
      const bleedDmg = bleedEffect.value || 2;
      currentBossHp = Math.max(0, currentBossHp - bleedDmg);
      spawnFloatingText(boss.id, `-${bleedDmg} HP (流血)`, 'damage');
      addLog(`🩸 ${boss.name} 受到【流血】傷害 -${bleedDmg} HP！(剩餘 HP: ${currentBossHp})`, 'boss');
    }

    // 更新 BOSS 狀態持續時間
    const updatedBossStatuses = boss.statuses
      .map((s) => ({ ...s, duration: s.duration - 1 }))
      .filter((s) => s.duration > 0);

    let updatedBoss = {
      ...boss,
      hp: currentBossHp,
      statuses: updatedBossStatuses,
    };

    updatedBoss = checkBossStateTransitions(updatedBoss);
    setBoss(updatedBoss);

    // 更新英雄狀態持續時間
    setHeroes((prev) =>
      prev.map((h) => ({
        ...h,
        statuses: h.statuses
          .map((s) => ({ ...s, duration: s.duration - 1 }))
          .filter((s) => s.duration > 0),
      }))
    );

    if (currentBossHp <= 0) {
      setPhase('VICTORY');
      soundFx.playVictory();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      addLog(`🏆 恭喜隊伍成功擊敗 ${boss.name}！獲得最終勝利！`, 'phase');
      return;
    }

    const aliveCount = heroes.filter((h) => h.hp > 0).length;
    if (aliveCount === 0) {
      setPhase('DEFEAT');
      soundFx.playDefeat();
      addLog(`💀 全體英雄皆已倒下，隊伍遭到滅絕... 對戰失敗。`, 'phase');
      return;
    }

    setPhase('END_TURN');
    addLog(`🔄 回合重整 (End Phase): 重置護甲、補充能量與新牌，準備下一回合...`, 'phase');

    setTimeout(() => {
      setHeroes((prev) =>
        prev.map((h) => {
          if (h.hp <= 0) return h;
          return {
            ...h,
            energy: h.maxEnergy,
            shield: 0,
            isReady: false,
            selectedCardIds: [],
          };
        })
      );

      setBoss((prev) => ({
        ...prev,
        shield: 0,
        intent: null,
      }));

      setCurrentTurn((t) => t + 1);
      setBattleStats((prev) => ({ ...prev, totalTurns: currentTurn + 1 }));
      setPhase('COMMIT');
      setCommitTimeLeft(60);
      addLog(`⚔️ 進入第 ${currentTurn + 1} 回合「雙卡交錯鎖定階段」。`, 'phase');
    }, 1200);
  };

  const readyCount = heroes.filter((h) => h.isReady || h.hp <= 0).length;
  const isBossReady = boss.intent !== null;

  const activeMobileHero = heroes.find((h) => h.id === activeMobileHeroId) || (heroes.length > 0 ? heroes[0] : undefined);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Real-time Player Join Notification Banner */}
      <AnimatePresence>
        {playerJoinedNotification && (
          <motion.div
            initial={{ opacity: 0, y: -70, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -70, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed top-16 right-4 sm:right-8 z-50 bg-gradient-to-r from-emerald-950 via-slate-900 to-cyan-950 border-2 border-emerald-400 text-slate-100 px-5 py-3.5 rounded-2xl shadow-[0_0_35px_rgba(52,211,153,0.45)] flex items-center gap-3.5 max-w-md pointer-events-auto"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-2xl shrink-0">
              🎉
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                新玩家加入戰場通知！
              </div>
              <div className="text-sm font-extrabold text-slate-100 truncate mt-0.5">
                【{playerJoinedNotification.name}】
                <span className="text-xs text-amber-300 font-bold ml-1.5">
                  ({playerJoinedNotification.role})
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                已同步加入房間「{roomCode}」，目前人數：{heroes.length} / 6
              </div>
            </div>
            <button
              onClick={() => setPlayerJoinedNotification(null)}
              className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Phase Tracker */}
      <PhaseTracker
        currentTurn={currentTurn}
        phase={phase}
        readyCount={readyCount}
        totalHeroes={heroes.length}
        isBossReady={isBossReady}
        deviceMode={deviceMode}
        roomCode={roomCode}
        isPlayerMode={isLockedPlayerMode}
        commitTimeLeft={commitTimeLeft}
        onChangeDeviceMode={setDeviceMode}
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onFastLockInAll={handleFastLockInAll}
        onExecuteTurn={handleStartResolutionPhase}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleLog={() => setIsLogDrawerOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          soundFx.enabled = !soundEnabled;
          setSoundEnabled(!soundEnabled);
        }}
      />

      {/* Main Container according to Device Mode */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 space-y-6">
        {/* MODE 1: Host Main Screen Mode */}
        {deviceMode === 'HOST_MAIN' && (
          <div className="animate-fadeIn">
            <HostManagerView
              boss={boss}
              heroes={heroes}
              phase={phase}
              readyCount={readyCount}
              totalHeroes={heroes.length}
              isBossReady={Boolean(boss.intent)}
              roomCode={roomCode}
              actionQueue={actionQueue}
              currentActionIndex={currentActionIndex}
              floatingTexts={floatingTexts}
              revealIntelMode={config.bossIntelMode}
              commitTimeLeft={commitTimeLeft}
              screenState={screenState}
              isGoClicked={isGoClicked}
              isPaused={isPaused}
              onStartGame={() => {
                soundFx.playCardSelect();
                setScreenState('PREPARATION');
              }}
              onPressGo={() => {
                soundFx.playAttack();
                setIsGoClicked(true);
                setScreenState('BATTLE');
              }}
              onTogglePause={() => setIsPaused((prev) => !prev)}
              onOpenQrModal={() => setIsQrModalOpen(true)}
              onExecuteTurn={handleStartResolutionPhase}
              onFastLockInAll={handleFastLockInAll}
              onSelectSlot1Card={handleSelectSlot1Card}
              onSelectSlot2Card={handleSelectSlot2Card}
              onToggleReady={handleToggleReady}
              onExecuteNextStep={handleExecuteNextStep}
              onFinishResolution={handleFinishResolution}
              onAddHero={handleAddHero}
              onRemoveHero={handleRemoveHero}
              onSelectBossKey={handleSelectBossKey}
              onSetBossIntent={handleSetBossIntent}
              onRandomizeBossIntent={handleRandomizeBossIntent}
            />
          </div>
        )}

        {/* MODE 2: Player Mobile Controller Mode */}
        {deviceMode === 'PLAYER_MOBILE' && (
          <div className="py-2 animate-fadeIn">
            <PlayerMobileView
              activeHero={activeMobileHero}
              boss={boss}
              allHeroes={heroes}
              isCommitPhase={phase === 'COMMIT'}
              commitTimeLeft={commitTimeLeft}
              phase={phase}
              screenState={screenState}
              isGoClicked={isGoClicked}
              currentAction={actionQueue[currentActionIndex]}
              floatingTexts={floatingTexts}
              onToggleCard={(heroId, card) => handleTogglePlayerCard(heroId, card)}
              onToggleReady={handleToggleReady}
              onSwitchHero={setActiveMobileHeroId}
              onAddHero={handleAddHero}
            />
          </div>
        )}

        {/* MODE 3: Split Simulator Mode (Host + Mobile Controller Side-by-Side) */}
        {deviceMode === 'SPLIT_SIMULATOR' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn">
            {/* Left Column: Host Main Screen Overview (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="text-xs font-bold text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Monitor className="w-4 h-4" /> 房長主螢幕視角 (Host Screen)
                </span>
                <span>房間：{roomCode}</span>
              </div>

              <HostManagerView
                boss={boss}
                heroes={heroes}
                phase={phase}
                readyCount={readyCount}
                totalHeroes={heroes.length}
                isBossReady={Boolean(boss.intent)}
                roomCode={roomCode}
                actionQueue={actionQueue}
                currentActionIndex={currentActionIndex}
                floatingTexts={floatingTexts}
                revealIntelMode={config.bossIntelMode}
                commitTimeLeft={commitTimeLeft}
                screenState={screenState}
                isGoClicked={isGoClicked}
                isPaused={isPaused}
                onStartGame={() => {
                  soundFx.playCardSelect();
                  setScreenState('PREPARATION');
                }}
                onPressGo={() => {
                  soundFx.playAttack();
                  setIsGoClicked(true);
                  setScreenState('BATTLE');
                }}
                onTogglePause={() => setIsPaused((prev) => !prev)}
                onOpenQrModal={() => setIsQrModalOpen(true)}
                onExecuteTurn={handleStartResolutionPhase}
                onFastLockInAll={handleFastLockInAll}
                onSelectSlot1Card={handleSelectSlot1Card}
                onSelectSlot2Card={handleSelectSlot2Card}
                onToggleReady={handleToggleReady}
                onExecuteNextStep={handleExecuteNextStep}
                onFinishResolution={handleFinishResolution}
                onAddHero={handleAddHero}
                onRemoveHero={handleRemoveHero}
                onSelectBossKey={handleSelectBossKey}
                onSetBossIntent={handleSetBossIntent}
                onRandomizeBossIntent={handleRandomizeBossIntent}
              />
            </div>

            {/* Right Column: Player Mobile View Controller (5 Cols) */}
            <div className="lg:col-span-5 space-y-2">
              <div className="text-xs font-bold text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Phone className="w-4 h-4" /> 手機模擬控制端 (Mobile Simulator)
                </span>
                <span className="text-[10px] text-emerald-400">即時連線亮燈中</span>
              </div>

              <PlayerMobileView
                activeHero={activeMobileHero}
                boss={boss}
                allHeroes={heroes}
                isCommitPhase={phase === 'COMMIT'}
                commitTimeLeft={commitTimeLeft}
                phase={phase}
                screenState={screenState}
                isGoClicked={isGoClicked}
                currentAction={actionQueue[currentActionIndex]}
                floatingTexts={floatingTexts}
                onToggleCard={(heroId, card) => handleTogglePlayerCard(heroId, card)}
                onToggleReady={handleToggleReady}
                onSwitchHero={setActiveMobileHeroId}
                onAddHero={handleAddHero}
              />
            </div>
          </div>
        )}

        {/* Victory Screen */}
        {phase === 'VICTORY' && (
          <div className="bg-amber-950 border border-amber-500 rounded-2xl p-8 text-center shadow-2xl space-y-4">
            <Trophy className="w-16 h-16 text-amber-400 mx-auto animate-bounce" />
            <h2 className="text-3xl font-black text-amber-300">戰鬥總勝利！</h2>
            <p className="text-slate-300 text-sm max-w-md mx-auto">
              隊伍成功擊破 BOSS！展現了無懈可擊的同步戰術配合與卡牌優先級計算。
            </p>
            <button
              onClick={restartGame}
              className="bg-amber-500 text-slate-950 font-black px-6 py-3 rounded-xl text-sm shadow-xl flex items-center gap-2 mx-auto cursor-pointer hover:bg-amber-400"
            >
              <RotateCcw className="w-4 h-4" /> 再玩一局 (Restart Battle)
            </button>
          </div>
        )}

        {/* Defeat Screen */}
        {phase === 'DEFEAT' && (
          <div className="bg-rose-950 border border-rose-500 rounded-2xl p-8 text-center shadow-2xl space-y-4">
            <Skull className="w-16 h-16 text-rose-400 mx-auto animate-pulse" />
            <h2 className="text-3xl font-black text-rose-300">戰鬥失敗...</h2>
            <p className="text-slate-300 text-sm max-w-md mx-auto">
              全體英雄不幸陣亡... 調整隊伍出牌優先級與鎖定策略後重試！
            </p>
            <button
              onClick={restartGame}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-6 py-3 rounded-xl text-sm border border-slate-700 flex items-center gap-2 mx-auto cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> 重新挑戰 (Retry)
            </button>
          </div>
        )}
      </main>

      {/* Post-Battle Settlement Summary Modal */}
      <SettlementPanel
        phase={phase}
        boss={boss}
        heroes={heroes}
        stats={battleStats}
        onRestart={restartGame}
      />

      {/* Room QR Code Invitation Modal */}
      <RoomQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        roomCode={roomCode}
        heroes={heroes}
        onOpenTechStackModal={() => {
          setIsQrModalOpen(false);
          setIsTechStackModalOpen(true);
        }}
        onSimulateJoinMobile={(heroId) => {
          setActiveMobileHeroId(heroId);
          setDeviceMode('PLAYER_MOBILE');
          setIsQrModalOpen(false);
        }}
      />

      {/* Realtime Tech Architecture Guide Modal */}
      <TechStackModal
        isOpen={isTechStackModalOpen}
        onClose={() => setIsTechStackModalOpen(false)}
      />

      {/* Rules Modal */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* Settings Modal */}
      <GameSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onChangeConfig={setConfig}
        heroCount={heroCount}
        onChangeHeroCount={handleChangeHeroCount}
        onRestartGame={restartGame}
      />

      {/* Battle Log Drawer */}
      <BattleLogDrawer
        isOpen={isLogDrawerOpen}
        onClose={() => setIsLogDrawerOpen(false)}
        logs={battleLogs}
        onClearLogs={() => setBattleLogs([])}
      />

      {/* BOSS Fled Alert Banner Overlay (Displayed for 1 second) */}
      <AnimatePresence>
        {bossFledAlert && (
          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 border-4 border-amber-300 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(245,158,11,0.9)] text-center text-slate-950 font-black flex flex-col items-center gap-3">
              <div className="text-5xl sm:text-7xl animate-bounce">🏃💨</div>
              <div className="text-2xl sm:text-4xl tracking-widest drop-shadow">
                【{bossFledAlert.name}】體力不支，逃離戰場！
              </div>
              <div className="text-sm sm:text-base text-amber-100 font-bold bg-slate-950/70 px-5 py-1.5 rounded-full border border-amber-300/50">
                🏃 BOSS 已成功擊退並逃走！
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
