import { Card, PlayerRole, CalculatedPlayerStats, CardType } from '../types';

/**
 * 算牌優先度層級 (Category Priority Tier)：
 * 1. 防禦牌 (DEFENSE) 優先級最高 (Tier 4000)
 * 2. 休息牌 (REST) 次之 (Tier 3000)
 * 3. 威嚇牌 (INTIMIDATE) 次之 (Tier 2000)
 * 4. 攻擊牌 (ATTACK) 最後 (Tier 1000)
 */
export function getCardCategoryTier(card: Card): number {
  if (card.type === 'DEFENSE') return 4000;
  if (
    card.type === 'REST' ||
    card.name.includes('休息') ||
    card.name.includes('甩毛') ||
    card.name.includes('伸懶腰')
  ) {
    return 3000;
  }
  if (
    card.type === 'INTIMIDATE' ||
    card.id === 'dog_bark' ||
    card.id === 'cat_hiss' ||
    card.name.includes('吠叫') ||
    card.name.includes('哈氣') ||
    card.name.includes('威嚇') ||
    card.name.includes('咆哮')
  ) {
    return 2000;
  }
  return 1000; // ATTACK
}

export function getCardCategoryBadgeInfo(card: Card): {
  tier: number;
  label: string;
  badgeClass: string;
} {
  const tier = getCardCategoryTier(card);
  if (tier >= 4000) {
    return {
      tier: 1,
      label: '🛡️ 防禦 (第1順位)',
      badgeClass: 'bg-cyan-950 text-cyan-300 border-cyan-500',
    };
  }
  if (tier >= 3000) {
    return {
      tier: 2,
      label: '🍃 休息 (第2順位)',
      badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-500',
    };
  }
  if (tier >= 2000) {
    return {
      tier: 3,
      label: '⚡ 威嚇 (第3順位)',
      badgeClass: 'bg-purple-950 text-purple-300 border-purple-500',
    };
  }
  return {
    tier: 4,
    label: '⚔️ 攻擊 (第4順位)',
    badgeClass: 'bg-rose-950 text-rose-300 border-rose-500',
  };
}

export function calculateEffectiveCardSpeed(actorSpeed: number, card: Card): number {
  const categoryTier = getCardCategoryTier(card);
  const cardPriorityBonus = card.priority || 0;
  return categoryTier + actorSpeed + cardPriorityBonus;
}

/**
 * 玩家卡牌基礎數據與增減公式：
 * 攻擊與防禦牌基礎數字為 3。
 * 點數大於 1 時，每超過 1 點則基礎數字 +2。
 * 例如：攻擊 2 -> 3 + (2-1)*2 = 5
 * 防禦 3 -> 3 + (3-1)*2 = 7
 */
export function calculateCardValue(stat: number): number {
  const pointsAboveOne = Math.max(0, stat - 1);
  return 3 + pointsAboveOne * 2;
}

export function scaleCardsWithStats(cards: Card[], stats: CalculatedPlayerStats): Card[] {
  const attVal = calculateCardValue(stats.attack);
  const defVal = calculateCardValue(stats.defense);

  return cards.map((c) => {
    if (c.type === 'ATTACK') {
      return {
        ...c,
        damage: attVal,
        description: `攻擊：造成 ${attVal} 點傷害`,
      };
    }
    if (c.type === 'DEFENSE') {
      return {
        ...c,
        block: defVal,
        description: `防禦：獲得 ${defVal} 點護甲`,
      };
    }
    if (c.type === 'REST') {
      const restHeal = c.heal ?? 5;
      return {
        ...c,
        cost: 3,
        energyGain: 0,
        description: `休息：耗費 3 費，恢復 ${restHeal} HP`,
      };
    }
    return c;
  });
}

export const REST_CARDS: Card[] = [
  {
    id: 'rest_1',
    name: '休息',
    role: 'ALL',
    type: 'REST',
    cost: 3,
    priority: 8,
    energyGain: 0,
    heal: 5,
    targetType: 'SELF',
    description: '休息：耗費 3 費，恢復 5 HP',
    iconName: 'Wind',
    colorTheme: 'teal',
  },
];

export const DOG_BOSS_CARDS: Card[] = [
  {
    id: 'dog_bite',
    name: '咬 (普通攻擊)',
    role: 'BOSS',
    type: 'ATTACK',
    cost: 1,
    priority: 8,
    damage: 15,
    targetType: 'SINGLE_ALLY',
    description: '【普通攻擊】對單一玩家造成 15 點傷害。命中後有一定機率對目標施加「被咬住」狀態。',
    iconName: 'Flame',
    colorTheme: 'amber',
  },
  {
    id: 'dog_heavy_strike',
    name: '猛撲 (重擊)',
    role: 'BOSS',
    type: 'ATTACK',
    cost: 2,
    priority: 6,
    damage: 25,
    targetType: 'SINGLE_ALLY',
    description: '【重擊】對單一玩家造成 25 點毀滅性重創傷害。',
    iconName: 'Flame',
    colorTheme: 'rose',
  },
  {
    id: 'dog_shake_fur',
    name: '甩毛 (Rest)',
    role: 'BOSS',
    type: 'REST',
    cost: 4,
    priority: 5,
    heal: 30,
    occupiesAllSlots: true,
    targetType: 'SELF',
    description: '【休息牌】恢復自身 30 點生命值（HP）。消耗 4 點體力，佔用該回合出牌。',
    iconName: 'Wind',
    colorTheme: 'teal',
  },
  {
    id: 'dog_bark',
    name: '吠叫 (Bark)',
    role: 'BOSS',
    type: 'INTIMIDATE',
    cost: 1,
    priority: 10,
    block: 10,
    targetType: 'SELF',
    description: '【威嚇牌】獲得 10 點護甲並威嚇玩家。',
    iconName: 'Shield',
    colorTheme: 'yellow',
  },
];

export const CAT_BOSS_CARDS: Card[] = [
  {
    id: 'cat_slap',
    name: '爪擊 (普通攻擊)',
    role: 'BOSS',
    type: 'ATTACK',
    cost: 1,
    priority: 12,
    damage: 13,
    targetType: 'SINGLE_ALLY',
    description: '【普通攻擊】對單一玩家造成 13 點傷害。',
    iconName: 'Zap',
    colorTheme: 'rose',
  },
  {
    id: 'cat_heavy_strike',
    name: '重爪揮擊 (重擊)',
    role: 'BOSS',
    type: 'ATTACK',
    cost: 2,
    priority: 7,
    damage: 23,
    targetType: 'SINGLE_ALLY',
    description: '【重擊】對單一玩家造成 23 點毀滅性重創傷害。',
    iconName: 'Flame',
    colorTheme: 'orange',
  },
  {
    id: 'cat_scratch',
    name: '橫掃 (普通攻擊 - 範圍)',
    role: 'BOSS',
    type: 'ATTACK',
    cost: 2,
    priority: 10,
    damage: 13,
    targetType: 'ALL_ALLIES',
    description: '【普通攻擊 - 範圍】對所有玩家造成 13 點傷害（AOE）。',
    iconName: 'Flame',
    colorTheme: 'orange',
  },
  {
    id: 'cat_stretch',
    name: '伸懶腰 (Rest)',
    role: 'BOSS',
    type: 'REST',
    cost: 4,
    priority: 5,
    heal: 30,
    occupiesAllSlots: true,
    targetType: 'SELF',
    description: '【休息牌】恢復自身 30 點生命值（HP）。消耗 4 點體力，佔用該回合出牌。',
    iconName: 'Wind',
    colorTheme: 'teal',
  },
  {
    id: 'cat_hiss',
    name: '哈氣 (Hiss)',
    role: 'BOSS',
    type: 'INTIMIDATE',
    cost: 1,
    priority: 11,
    block: 8,
    targetType: 'SELF',
    description: '【威嚇牌】獲得 8 點護甲並威嚇玩家。',
    iconName: 'Shield',
    colorTheme: 'purple',
  },
];

/**
 * 取得玩家固定手牌（共 7 張：3x 攻擊、3x 防禦、1x 休息）
 */
export function getRoleDeck(role: PlayerRole, stats?: CalculatedPlayerStats): Card[] {
  const attackStat = stats ? stats.attack : 1;
  const defenseStat = stats ? stats.defense : 1;

  const attDamage = calculateCardValue(attackStat);
  const defBlock = calculateCardValue(defenseStat);
  const restHeal = role === 'MELOGALE_MOSCHATA' ? 15 : 5;

  const deck: Card[] = [];

  // 3x 攻擊 (Attack)
  for (let i = 0; i < 3; i++) {
    deck.push({
      id: `att_${role}_${i}`,
      name: '攻擊',
      role,
      type: 'ATTACK',
      cost: 1,
      priority: 10,
      damage: attDamage,
      targetType: 'SINGLE_ENEMY',
      description: `攻擊：造成 ${attDamage} 點傷害`,
      iconName: 'Sword',
      colorTheme: 'rose',
    });
  }

  // 3x 防禦 (Defense)
  for (let i = 0; i < 3; i++) {
    deck.push({
      id: `def_${role}_${i}`,
      name: '防禦',
      role,
      type: 'DEFENSE',
      cost: 1,
      priority: 10,
      block: defBlock,
      targetType: 'SELF',
      description: `防禦：獲得 ${defBlock} 點護甲`,
      iconName: 'Shield',
      colorTheme: 'blue',
    });
  }

  // 1x 休息 (Rest)
  deck.push({
    id: `rst_${role}_0`,
    name: '休息',
    role,
    type: 'REST',
    cost: 3,
    priority: 8,
    energyGain: 0,
    heal: restHeal,
    targetType: 'SELF',
    description: `休息：耗費 3 費，恢復 ${restHeal} HP`,
    iconName: 'Wind',
    colorTheme: 'teal',
  });

  return deck;
}

