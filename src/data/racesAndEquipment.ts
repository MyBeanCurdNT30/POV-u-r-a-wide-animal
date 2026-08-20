import {
  PlayerRole,
  PlayerClassDefinition,
  EquipmentItem,
  PlayerEquipmentSelection,
  CalculatedPlayerStats,
} from '../types';

export const PLAYER_CLASSES: Record<PlayerRole, PlayerClassDefinition> = {
  PYCNONOTUS: {
    id: 'PYCNONOTUS',
    name: '白頭翁',
    latinName: 'Pycnonotus sinensis',
    icon: 'Feather',
    imageUrl: 'https://lh3.googleusercontent.com/d/1gWS8qZ_4el1FVAm-fxW39WgrSQJbzild',
    description: '飛行迅速、體型輕盈的鳥類種族。',
    baseStats: {
      attack: 2,
      evasion: 4,
      defense: 1,
      stamina: 3,
      speed: 14,
    },
    traits: [
      '攻擊有 25% 機率觸發 3 倍暴擊傷害（攻擊力上限最高 8 點）',
      'BOSS 狗對其攻擊命中率固定下降 20%',
      '擁有專屬「逃跑」卡，打出後如同休息並鎖定該回合手牌',
    ],
    weaknesses: [
      '易傷，防禦力低，為 BOSS 貓第一優先攻擊目標',
      'BOSS 貓攻擊時有 2% 機率觸發一擊必殺無視防禦',
    ],
  },
  MUS_CAROLI: {
    id: 'MUS_CAROLI',
    name: '月鼠',
    latinName: 'Mus caroli',
    icon: 'Sparkles',
    imageUrl: 'https://lh3.googleusercontent.com/d/1uX5PEBxNU_WQayLYOf62z8chAch3_Iql',
    description: '敏捷靈巧、體型微小的囓齒類種族。',
    baseStats: {
      attack: 1,
      evasion: 8,
      defense: 1,
      stamina: 2,
      speed: 18,
    },
    traits: [
      '閃避超高，幾乎不會被打到（攻擊力上限最高 8 點）',
      'BOSS 狗對其攻擊命中率固定下降 20%',
      '擁有專屬「逃跑」卡，打出後如同休息並鎖定該回合手牌',
    ],
    weaknesses: [
      '最大生命值 (Max HP) 較低',
      '基礎攻擊力較低，為 BOSS 貓第二優先攻擊目標',
      'BOSS 貓攻擊時有 2% 機率觸發一擊必殺無視防禦',
    ],
  },
  PAGUMA_LARVATA: {
    id: 'PAGUMA_LARVATA',
    name: '白鼻心',
    latinName: 'Paguma larvata',
    icon: 'Zap',
    imageUrl: 'https://lh3.googleusercontent.com/d/1ZPfVyeO8453pgEbY-LEsiAq2lcb81XYk',
    description: '體型適中、爪牙銳利的食肉目果子狸種族。',
    baseStats: {
      attack: 2,
      evasion: 2,
      defense: 3,
      stamina: 6,
      speed: 12,
    },
    traits: [
      '攻擊有 50% 機率使 BOSS 陷入流血 (持續 5 回合，每回合 -2 HP)',
      'BOSS 貓對其攻擊命中率固定下降 30%',
      '由於體型相當，BOSS貓的攻擊對其效果減半',
    ],
    weaknesses: ['體型較大，BOSS狗對其重擊的機率提高 5%'],
  },
  MELOGALE_MOSCHATA: {
    id: 'MELOGALE_MOSCHATA',
    name: '鼬獾',
    latinName: 'Melogale moschata',
    icon: 'Shield',
    imageUrl: 'https://lh3.googleusercontent.com/d/1JMgfVvcbFstHFnCcKWrDIcYPIg_FvKmQ',
    description: '擅長挖掘、防守堅固且帶有腺體臭味的種族。',
    baseStats: {
      attack: 3,
      evasion: 1,
      defense: 4,
      stamina: 3,
      speed: 10,
    },
    traits: [
      '休息牌可恢復 15 點 HP (標準為 5 點)',
      '攻擊有 50% 機率使 BOSS 陷入流血 (持續 5 回合，每回合 -2 HP)',
      '血量 50% 以下觸發「散發臭味」：BOSS 單體攻擊時有 70% 機率轉而攻擊其他玩家；BOSS 狗對其命中降至 50%',
      'BOSS 貓對其攻擊命中率固定下降 30%',
      '為 BOSS 狗第一優先攻擊目標',
      '由於體型相當，BOSS 貓的攻擊對其效果減半',
      '攻擊時有 1% 的機率使 BOSS 狗觸發狂犬病',
    ],
    weaknesses: [
      '移動較緩慢',
      'BOSS狗對其重擊的機率提高 10%',
    ],
  },
};

export const HEAD_EQUIPMENT: EquipmentItem[] = [
  {
    id: 'head_leopard_cat_eye',
    name: '石虎眼睛',
    slot: 'head',
    description: '增加閃避 2 點，對貓的「哈氣」威嚇免疫。',
    statsMod: { evasion: 2 },
    passiveEffects: ['對貓「哈氣」威嚇免疫'],
    hiddenEffectFlags: { immuneCatHiss: true },
  },
  {
    id: 'head_bear_eye',
    name: '黑熊的眼睛',
    slot: 'head',
    description: '增加防禦 1 點，BOSS 狗對其攻擊的成功機率降低 15%。',
    statsMod: { defense: 1 },
    passiveEffects: ['BOSS 狗攻擊成功機率降低 15%'],
    hiddenEffectFlags: { dogHitSuccessDec15: true },
  },
  {
    id: 'head_raptor_eye',
    name: '猛禽眼睛',
    slot: 'head',
    description: '增加閃避 1 點，攻擊無視 BOSS 的 1 點防禦。',
    statsMod: { evasion: 1 },
    passiveEffects: ['攻擊無視 BOSS 1 點防禦'],
    hiddenEffectFlags: { ignoreBossDefense1: true },
  },
];

export const CHEST_EQUIPMENT: EquipmentItem[] = [
  {
    id: 'chest_leopard_cat_fur',
    name: '石虎皮毛',
    slot: 'chest',
    description: '增加防禦 1 點、閃避 2 點。',
    statsMod: { defense: 1, evasion: 2 },
  },
  {
    id: 'chest_pangolin_scale',
    name: '穿山甲鱗片',
    slot: 'chest',
    description: '增加防禦 1 點。',
    statsMod: { defense: 1 },
  },
  {
    id: 'chest_bear_fur',
    name: '黑熊皮毛',
    slot: 'chest',
    description: '增加防禦 3 點、降低閃避 1 點。',
    statsMod: { defense: 3, evasion: -1 },
  },
];

export const GLOVES_EQUIPMENT: EquipmentItem[] = [
  {
    id: 'gloves_leopard_cat_claw',
    name: '石虎爪子',
    slot: 'gloves',
    description: '增加攻擊 1 點，攻擊時有 5% 機率造成流血。',
    statsMod: { attack: 1 },
    passiveEffects: ['攻擊時有 5% 機率造成流血'],
    hiddenEffectFlags: { bleedChance5: true },
  },
  {
    id: 'gloves_bear_claw',
    name: '黑熊爪子',
    slot: 'gloves',
    description: '增加攻擊 3 點，攻擊時造成流血，攻擊成功機率降低 15%。',
    statsMod: { attack: 3 },
    passiveEffects: ['攻擊造成流血', '攻擊成功機率降低 15%'],
    hiddenEffectFlags: { bleed100AccDec15: true },
  },
  {
    id: 'gloves_raptor_wing',
    name: '猛禽翅膀',
    slot: 'gloves',
    description: '降低攻擊 2 點、增加閃避 3 點。',
    statsMod: { attack: -2, evasion: 3 },
  },
];

export const LEG_EQUIPMENT: EquipmentItem[] = [
  {
    id: 'leg_leopard_cat_foot',
    name: '石虎腳',
    slot: 'leg',
    description: '增加敏捷 3 點。',
    statsMod: { speed: 3 },
  },
  {
    id: 'leg_bear_foot',
    name: '黑熊腳',
    slot: 'leg',
    description: '敏捷降低 1 點、防禦增加 1 點，無視 BOSS 的「重擊」。',
    statsMod: { speed: -1, defense: 1 },
    passiveEffects: ['無視 BOSS 的「重擊」'],
    hiddenEffectFlags: { ignoreBossCritical: true },
  },
  {
    id: 'leg_raptor_foot',
    name: '猛禽腳',
    slot: 'leg',
    description: '增加攻擊 1 點，使用攻擊牌時，傷害額外 +1。',
    statsMod: { attack: 1 },
    passiveEffects: ['使用攻擊牌傷害額外 +1'],
    hiddenEffectFlags: { attackBonus1OnAttackCard: true },
  },
];

export const DEFAULT_EQUIPMENT_SELECTION: PlayerEquipmentSelection = {
  head: HEAD_EQUIPMENT[0],
  chest: CHEST_EQUIPMENT[0],
  gloves: GLOVES_EQUIPMENT[0],
  leg: LEG_EQUIPMENT[0],
};

export const RACE_BASE_HP: Record<PlayerRole, number> = {
  PYCNONOTUS: 45,
  MUS_CAROLI: 30,
  PAGUMA_LARVATA: 55,
  MELOGALE_MOSCHATA: 60,
};

/**
 * 玩家最終數值計算函數（calculatePlayerStats）
 * 將「種族基礎數值 + 裝備加成」進行加總，計算出最終的血量、攻擊力、防禦力與速度。
 */
export function calculatePlayerStats(
  race: PlayerClassDefinition,
  equipment: PlayerEquipmentSelection
): CalculatedPlayerStats {
  const base = race.baseStats;
  let attack = base.attack;
  let evasion = base.evasion;
  let defense = base.defense;
  let stamina = base.stamina;
  let speed = base.speed ?? (10 + base.evasion);

  const selectedEqList = [
    equipment.head,
    equipment.chest,
    equipment.gloves,
    equipment.leg,
  ];

  for (const item of selectedEqList) {
    if (item && item.statsMod) {
      if (item.statsMod.attack) attack += item.statsMod.attack;
      if (item.statsMod.evasion) evasion += item.statsMod.evasion;
      if (item.statsMod.defense) defense += item.statsMod.defense;
      if (item.statsMod.stamina) stamina += item.statsMod.stamina;
      if (item.statsMod.speed) speed += item.statsMod.speed;
    }
  }

  // 白頭翁與月鼠攻擊力上限最高 8 點
  if (race.id === 'PYCNONOTUS' || race.id === 'MUS_CAROLI') {
    attack = Math.min(8, attack);
  }

  // 計算最終 Max HP (依種族基礎血量：白頭翁 45、月鼠 30、白鼻心 55、鼬獾 60，加上裝備體力加成)
  const baseHp = RACE_BASE_HP[race.id] || 45;
  const staminaBonus = stamina - base.stamina;
  const maxHp = Math.max(10, baseHp + staminaBonus * 5);

  return {
    attack,
    evasion,
    defense,
    stamina,
    speed,
    maxHp,
  };
}
