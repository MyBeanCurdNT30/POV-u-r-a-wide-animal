import { Hero, Card, PlayerRole, PlayerEquipmentSelection } from '../types';
import { getRoleDeck } from './cards';
import {
  PLAYER_CLASSES,
  DEFAULT_EQUIPMENT_SELECTION,
  calculatePlayerStats,
} from './racesAndEquipment';

export function createInitialHero(
  id: string,
  name: string,
  role: PlayerRole,
  equipment: PlayerEquipmentSelection = DEFAULT_EQUIPMENT_SELECTION,
  overrideSpeed?: number
): Hero {
  const raceDef = PLAYER_CLASSES[role] || PLAYER_CLASSES.PYCNONOTUS;
  const calculatedStats = calculatePlayerStats(raceDef, equipment);

  const hand = getRoleDeck(role, calculatedStats);
  const deck: Card[] = [];

  const speed = overrideSpeed ?? calculatedStats.speed;
  const maxHp = calculatedStats.maxHp;

  let avatarIcon = raceDef.icon;

  return {
    id,
    name,
    role,
    avatarIcon,
    equipment,
    stats: calculatedStats,
    hp: maxHp,
    maxHp,
    shield: calculatedStats.defense,
    energy: 3,
    maxEnergy: 3,
    speed,
    isReady: false,
    isConnected: true,
    selectedCardIds: [],
    targetIds: [],
    hand,
    deck,
    discard: [],
    statuses: [],
  };
}

export const INITIAL_HEROES: Hero[] = [];

