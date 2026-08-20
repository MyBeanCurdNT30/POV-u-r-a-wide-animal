import { Boss, Card, Hero, BossKey } from '../types';
import { DOG_BOSS_CARDS, CAT_BOSS_CARDS } from './cards';

export const DOG_BOSS_IMAGE_URL = 'https://lh3.googleusercontent.com/d/1mz1iUrN22kLAHX-ocDI4AULdB5i5Kji3';
export const CAT_BOSS_IMAGE_URL = 'https://lh3.googleusercontent.com/d/1w3JKDL9Ajoqzsz81cT9TZUONe9ILkdcE';
export const WILDLIFE_TEAM_IMAGE_URL = 'https://lh3.googleusercontent.com/d/15NyhYCRfzu6rK5wSef3dStNg2uyPMry8';

export const INITIAL_DOG_BOSS: Boss = {
  id: 'boss_dog',
  bossKey: 'DOG',
  name: '黃色土狗',
  title: '台灣浪浪・黃色土狗',
  avatarIcon: 'PawPrint',
  imageUrl: DOG_BOSS_IMAGE_URL,
  hp: 200,
  maxHp: 200,
  shield: 0,
  stamina: 4,
  maxStamina: 4,
  speed: 12,
  phase: 1,
  intent: null,
  statuses: [],
};

export const INITIAL_CAT_BOSS: Boss = {
  id: 'boss_cat',
  bossKey: 'CAT',
  name: '三花貓',
  title: '巷弄霸王・三花貓',
  avatarIcon: 'Cat',
  imageUrl: CAT_BOSS_IMAGE_URL,
  hp: 200,
  maxHp: 200,
  shield: 0,
  stamina: 4,
  maxStamina: 4,
  speed: 14,
  phase: 1,
  intent: null,
  statuses: [],
};

export const INITIAL_BOSS = INITIAL_DOG_BOSS;

/**
 * 檢查卡牌是否為「佔用全回合槽位」之休息牌
 * 限制：此回合若選擇「甩毛/伸懶腰」，該回合無法再使用其他卡牌（佔用所有出牌槽位）
 */
export function checkFullTurnRestSlotLock(card: Card): boolean {
  return Boolean(card.occupiesAllSlots || card.type === 'REST');
}

/**
 * 驗證卡牌總體力/消耗是否超過體力限制
 * 所有玩家以及 BOSS 的出牌無數量限制，但出牌的總體力不得超過體力限制
 */
export function validateTotalStaminaCost(cards: Card[], maxStamina: number): {
  isValid: boolean;
  totalCost: number;
  reason?: string;
} {
  const totalCost = cards.reduce((acc, c) => acc + (c?.cost || 0), 0);
  if (totalCost > maxStamina) {
    return {
      isValid: false,
      totalCost,
      reason: `超過體力限制！總消耗 ${totalCost} / 體力上限 ${maxStamina}`,
    };
  }
  return { isValid: true, totalCost };
}

/**
 * 被咬住狀態判定與「甩 (Thrash)」連動傷害函數
 * 特殊連動（咬住狀態）：命中後有一定機率對目標施加「被咬住」狀態。
 * 若玩家處於「被咬住」狀態，BOSS 下一次攻擊或特定判定時會觸發「甩 (Thrash)」造成 10 點額外傷害。
 */
export function processBittenStatusAndThrash(
  target: Hero,
  isDogBiteAttack: boolean
): {
  extraDamage: number;
  statusAdded: boolean;
  statusRemoved: boolean;
  logText: string;
} {
  const hasBittenStatus = target.statuses.some((s) => s.type === 'BITTEN');

  if (hasBittenStatus) {
    // 玩家已處於「被咬住」狀態：觸發「甩 (Thrash)」造成 10 點強烈傷害，並解除被咬住狀態
    return {
      extraDamage: 10,
      statusAdded: false,
      statusRemoved: true,
      logText: `💥 觸發【甩 (Thrash)】連動效果！狂暴甩動對 ${target.name} 追加造成 10 點額外傷害並解除咬住狀態！`,
    };
  } else if (isDogBiteAttack) {
    // 咬 (Bite) 命中後 60% 機率施加「被咬住」狀態
    const roll = Math.random();
    if (roll < 0.6) {
      return {
        extraDamage: 0,
        statusAdded: true,
        statusRemoved: false,
        logText: `⚠️ ${target.name} 被猛犬咬住陷入【被咬住】狀態！下次受攻將觸發【甩 (Thrash)】10點重創！`,
      };
    }
  }

  return {
    extraDamage: 0,
    statusAdded: false,
    statusRemoved: false,
    logText: '',
  };
}

/**
 * 取得指定 BOSS 的全套卡牌池
 */
export function getBossCardPool(bossKey: BossKey): Card[] {
  return bossKey === 'CAT' ? CAT_BOSS_CARDS : DOG_BOSS_CARDS;
}

/**
 * 選擇 BOSS 回合目標：
 * - BOSS 貓 (CAT) 優先攻擊：白頭翁 (PYCNONOTUS) > 月鼠 (MUS_CAROLI) > 白鼻心 (PAGUMA_LARVATA) > 鼬獾 (MELOGALE_MOSCHATA)
 * - BOSS 狗 (DOG) 優先攻擊：鼬獾 (MELOGALE_MOSCHATA) > 白鼻心 (PAGUMA_LARVATA) > 白頭翁 (PYCNONOTUS) > 月鼠 (MUS_CAROLI)
 */
export function selectBossMainTarget(
  bossKey: string,
  aliveTargets: any[]
): any {
  if (aliveTargets.length === 0) return undefined;

  const catPriority: Record<string, number> = {
    PYCNONOTUS: 1,
    MUS_CAROLI: 2,
    PAGUMA_LARVATA: 3,
    MELOGALE_MOSCHATA: 4,
  };

  const dogPriority: Record<string, number> = {
    MELOGALE_MOSCHATA: 1,
    PAGUMA_LARVATA: 2,
    PYCNONOTUS: 3,
    MUS_CAROLI: 4,
  };

  const priorityMap = bossKey === 'CAT' ? catPriority : dogPriority;

  const minRank = Math.min(...aliveTargets.map((t) => priorityMap[t.role] ?? 99));
  const topRankTargets = aliveTargets.filter((t) => (priorityMap[t.role] ?? 99) === minRank);

  return topRankTargets[Math.floor(Math.random() * topRankTargets.length)];
}

export function chooseBossIntent(
  boss: Boss,
  targets: (Hero | { id: string; hp: number; role?: any; stats?: any; speed?: number })[]
): {
  selectedCards: Card[];
  targetIds: string[];
} {
  const cardPool = getBossCardPool(boss.bossKey);
  const aliveTargets = targets.filter((t) => t.hp > 0);

  let mainTarget: any = undefined;
  if (aliveTargets.length > 0) {
    mainTarget = selectBossMainTarget(boss.bossKey, aliveTargets);
  } else if (targets.length > 0) {
    mainTarget = targets[0];
  }

  const shuffledPool = [...cardPool].sort(() => Math.random() - 0.5);
  const selectedCards: Card[] = [];
  let currentCost = 0;

  const isEnraged = boss.hp > 0 && boss.hp <= boss.maxHp * 0.3;
  const maxCardCount = isEnraged ? 4 : 2;

  for (const card of shuffledPool) {
    if (checkFullTurnRestSlotLock(card)) {
      if (selectedCards.length === 0) {
        selectedCards.push(card);
        break;
      }
      continue;
    }
    if (currentCost + card.cost <= boss.maxStamina) {
      selectedCards.push(card);
      currentCost += card.cost;
      if (selectedCards.length >= maxCardCount) break;
    }
  }

  if (selectedCards.length === 0 && cardPool.length > 0) {
    selectedCards.push(cardPool[0]);
  }

  const targetIds = selectedCards.map((c) =>
    c.targetType === 'SINGLE_ALLY' || c.targetType === 'SINGLE_ENEMY' ? (mainTarget?.id || 'ALL') : 'ALL'
  );

  return {
    selectedCards,
    targetIds,
  };
}
