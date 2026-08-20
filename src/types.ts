export type GamePhase = 'COMMIT' | 'RESOLVING' | 'END_TURN' | 'VICTORY' | 'DEFEAT';

export type CharacterType = 'PLAYER' | 'BOSS';

export type PlayerRole = 'PYCNONOTUS' | 'MUS_CAROLI' | 'PAGUMA_LARVATA' | 'MELOGALE_MOSCHATA';

export type CardType = 'DEFENSE' | 'REST' | 'INTIMIDATE' | 'ATTACK';

export type TargetType = 'SINGLE_ENEMY' | 'ALL_ENEMIES' | 'SINGLE_ALLY' | 'ALL_ALLIES' | 'SELF';

export type DeviceMode = 'HOST_MAIN' | 'PLAYER_MOBILE' | 'SPLIT_SIMULATOR';

export interface BaseStats {
  attack: number;    // 攻擊
  evasion: number;   // 閃避
  defense: number;   // 防禦
  stamina: number;   // 體力
  speed?: number;    // 敏捷
}

export interface PlayerClassDefinition {
  id: PlayerRole;
  name: string;          // 中文名稱 (例: 白頭翁)
  latinName: string;     // 學名 (例: Pycnonotus sinensis)
  icon: string;
  imageUrl?: string;
  description: string;
  baseStats: BaseStats;  // 攻擊2, 閃避4, 防禦1, 體力3
  traits: string[];      // 特性說明
  weaknesses: string[];  // 弱點說明
}

export type EquipmentSlot = 'head' | 'chest' | 'gloves' | 'leg';

export interface EquipmentMod {
  attack?: number;
  evasion?: number;
  defense?: number;
  stamina?: number;
  speed?: number;
}

export interface EquipmentItem {
  id: string;
  name: string;
  slot: EquipmentSlot;
  description: string;
  statsMod: EquipmentMod;
  passiveEffects?: string[];
  hiddenEffectFlags?: {
    immuneCatHiss?: boolean;             // 石虎眼睛: 對貓「哈氣」威嚇免疫
    dogHitSuccessDec15?: boolean;        // 黑熊眼睛: BOSS狗攻擊成功率降低15%
    ignoreBossDefense1?: boolean;        // 猛禽眼睛: 攻擊無視 BOSS 的 1 點防禦
    bleedChance5?: boolean;              // 石虎爪子: 攻擊時有 5% 機率造成流血
    bleed100AccDec15?: boolean;          // 黑熊爪子: 攻擊造成流血，命中率降低 15%
    ignoreBossCritical?: boolean;        // 黑熊腳: 無視 BOSS 的「重擊」
    attackBonus1OnAttackCard?: boolean;  // 猛禽腳: 使用攻擊牌時，傷害額外+1
  };
}

export interface PlayerEquipmentSelection {
  head?: EquipmentItem | null;
  chest?: EquipmentItem | null;
  gloves?: EquipmentItem | null;
  leg?: EquipmentItem | null;
}

export interface CalculatedPlayerStats {
  attack: number;
  evasion: number;
  defense: number;
  stamina: number;
  speed: number;
  maxHp: number;
}

export interface Card {
  id: string;
  name: string;
  role: PlayerRole | 'BOSS' | 'ALL';
  type: CardType;
  cost: number;
  priority: number; // 敏捷/卡牌優先級，結算時數字高者先執行
  damage?: number;
  block?: number;
  heal?: number;
  energyGain?: number;
  drawCards?: number;
  occupiesAllSlots?: boolean;
  targetType: TargetType;
  description: string;
  iconName: string;
  colorTheme: string;
}

export interface StatusEffect {
  type: 'STRENGTH' | 'WEAK' | 'DEFENSE' | 'BITTEN' | 'HISS_WEAK' | 'BLEED' | 'RABIES' | 'BARK' | 'DEFENSE_DOWN';
  duration: number;
  value: number;
}

export type BossKey = 'DOG' | 'CAT';

export interface Hero {
  id: string;
  name: string;
  nickname?: string;
  role: PlayerRole;
  avatarIcon: string;
  equipment?: PlayerEquipmentSelection;
  stats?: CalculatedPlayerStats;
  hp: number;
  maxHp: number;
  shield: number;
  energy: number;
  maxEnergy: number;
  speed: number;
  isReady: boolean;
  isConnected: boolean;
  selectedCardIds: string[];
  targetIds?: string[];
  hand: Card[];
  deck: Card[];
  discard: Card[];
  statuses: StatusEffect[];
}

export interface Boss {
  id: string;
  bossKey: BossKey;
  name: string;
  title: string;
  avatarIcon: string;
  imageUrl?: string;
  hp: number;
  maxHp: number;
  shield: number;
  stamina: number;
  maxStamina: number;
  speed: number;
  phase: number;
  intent: {
    selectedCards: Card[];
    targetIds?: string[];
    isRevealed: boolean;
  } | null;
  statuses: StatusEffect[];
}

export interface CommittedAction {
  id: string;
  cardOrder: number; // 1, 2, 3... 出牌順序
  slotIndex?: number;
  actorId: string;
  actorName: string;
  actorType: CharacterType;
  actorRole?: PlayerRole;
  card: Card;
  targetId: string;
  effectiveSpeed: number; // 敏捷度 + 卡牌優先級
  status: 'PENDING' | 'EXECUTING' | 'EXECUTED';
  resultMessage?: string;
}

export interface RoomState {
  roomId: string;
  roomCode: string;
  hostName: string;
  connectedCount: number;
  maxPlayers: number;
  qrCodeUrl: string;
}

export interface FloatingText {
  id: string;
  targetId: string;
  text: string;
  type: 'damage' | 'heal' | 'block' | 'status' | 'miss';
}

export interface BattleLog {
  id: string;
  turn: number;
  text: string;
  type: 'info' | 'attack' | 'heal' | 'defend' | 'boss' | 'phase';
  timestamp: string;
}

export interface GameRulesConfig {
  priorityFormula: 'SPEED_PLUS_PRIORITY' | 'CARD_PRIORITY_ONLY' | 'CHARACTER_SPEED_ONLY';
  revealBossIntent: boolean;
  bossIntelMode: 'FULL_SECRET' | 'CARD_TYPE_ONLY' | 'REVEALED';
  allowCancelLockIn: boolean;
  autoEndRoundWhenAllReady: boolean;
  cardsPerTurn: number; // 預設 2 張卡牌 (交錯結算)
}

