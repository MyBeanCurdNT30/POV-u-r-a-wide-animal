import React from 'react';
import { Card } from '../types';
import { Zap, Shield, Heart, Sparkles, Sword, Flame, Target, Eye, Wind, Sun, Crosshair, Feather, Volume2 } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface HandCardProps {
  card: Card;
  heroEnergy: number;
  isSelected: boolean;
  isHeroReady: boolean;
  onSelectCard: (card: Card) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Zap: <Zap className="w-4 h-4" />,
  Shield: <Shield className="w-4 h-4" />,
  Sword: <Sword className="w-4 h-4" />,
  Flame: <Flame className="w-4 h-4" />,
  Sparkles: <Sparkles className="w-4 h-4" />,
  Heart: <Heart className="w-4 h-4" />,
  Target: <Target className="w-4 h-4" />,
  Eye: <Eye className="w-4 h-4" />,
  Wind: <Wind className="w-4 h-4" />,
  Sun: <Sun className="w-4 h-4" />,
  Crosshair: <Crosshair className="w-4 h-4" />,
  Feather: <Feather className="w-4 h-4" />,
  Volume2: <Volume2 className="w-4 h-4" />,
};

const THEME_STYLES: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  amber: {
    bg: 'bg-slate-900',
    border: 'border-amber-600 hover:border-amber-400',
    text: 'text-amber-300',
    badge: 'bg-amber-500 text-slate-950',
  },
  blue: {
    bg: 'bg-slate-900',
    border: 'border-blue-600 hover:border-blue-400',
    text: 'text-blue-300',
    badge: 'bg-blue-500 text-slate-950',
  },
  red: {
    bg: 'bg-slate-900',
    border: 'border-red-600 hover:border-red-400',
    text: 'text-red-300',
    badge: 'bg-red-500 text-slate-950',
  },
  purple: {
    bg: 'bg-slate-900',
    border: 'border-purple-600 hover:border-purple-400',
    text: 'text-purple-300',
    badge: 'bg-purple-500 text-slate-950',
  },
  emerald: {
    bg: 'bg-slate-900',
    border: 'border-emerald-600 hover:border-emerald-400',
    text: 'text-emerald-300',
    badge: 'bg-emerald-500 text-slate-950',
  },
  cyan: {
    bg: 'bg-slate-900',
    border: 'border-cyan-600 hover:border-cyan-400',
    text: 'text-cyan-300',
    badge: 'bg-cyan-500 text-slate-950',
  },
  rose: {
    bg: 'bg-slate-900',
    border: 'border-rose-600 hover:border-rose-400',
    text: 'text-rose-300',
    badge: 'bg-rose-500 text-slate-950',
  },
  green: {
    bg: 'bg-slate-900',
    border: 'border-green-600 hover:border-green-400',
    text: 'text-green-300',
    badge: 'bg-green-500 text-slate-950',
  },
  orange: {
    bg: 'bg-slate-900',
    border: 'border-orange-600 hover:border-orange-400',
    text: 'text-orange-300',
    badge: 'bg-orange-500 text-slate-950',
  },
  teal: {
    bg: 'bg-slate-900',
    border: 'border-teal-600 hover:border-teal-400',
    text: 'text-teal-300',
    badge: 'bg-teal-500 text-slate-950',
  },
  yellow: {
    bg: 'bg-slate-900',
    border: 'border-yellow-600 hover:border-yellow-400',
    text: 'text-yellow-300',
    badge: 'bg-yellow-500 text-slate-950',
  },
};

export const HandCard: React.FC<HandCardProps> = ({
  card,
  heroEnergy,
  isSelected,
  isHeroReady,
  onSelectCard,
}) => {
  const canAfford = heroEnergy >= card.cost;
  const theme = THEME_STYLES[card.colorTheme] || THEME_STYLES.amber;

  return (
    <div
      onClick={() => {
        if (!isHeroReady && canAfford) {
          soundFx.playCardSelect();
          onSelectCard(card);
        }
      }}
      className={`relative w-36 sm:w-40 rounded-xl p-2.5 transition-all duration-200 cursor-pointer select-none border flex flex-col justify-between h-48 sm:h-52 ${
        theme.bg
      } ${theme.border} ${
        isSelected
          ? 'ring-2 ring-amber-400 shadow-lg -translate-y-2'
          : 'hover:-translate-y-1'
      } ${
        !canAfford || isHeroReady ? 'opacity-50 grayscale cursor-not-allowed' : ''
      }`}
    >
      {/* Top Card Bar: Cost & Priority */}
      <div className="flex items-center justify-between">
        {/* Cost Badge */}
        <div className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center shadow">
          {card.cost}
        </div>

        {/* Priority Speed Badge */}
        <div
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-950 border border-slate-700 text-amber-300 flex items-center gap-1"
          title="卡牌優先級（數字越高在結算階段越優先發動）"
        >
          <span>優先 {card.priority}</span>
        </div>
      </div>

      {/* Card Header & Icon */}
      <div className="my-1 text-center flex flex-col items-center">
        <div className={`p-1.5 rounded-lg bg-slate-950 mb-1 flex items-center gap-1 ${theme.text}`}>
          {ICON_MAP[card.iconName] || <Zap className="w-4 h-4" />}
          <span className="text-[10px] font-black uppercase">
            {card.type === 'DEFENSE' ? '🛡️ 防禦' : card.type === 'REST' ? '🍃 休息' : card.type === 'INTIMIDATE' ? '⚡ 威嚇' : '⚔️ 攻擊'}
          </span>
        </div>
        <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{card.name}</h4>
      </div>

      {/* Card Body Stats & Description */}
      <div className="bg-slate-950 rounded-lg p-1.5 border border-slate-800 flex-1 flex flex-col justify-between my-1">
        <p className="text-[10px] text-slate-300 leading-tight line-clamp-3">{card.description}</p>
        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 pt-1 border-t border-slate-800">
          <span>{card.targetType === 'SINGLE_ENEMY' ? '單體敵方' : card.targetType === 'ALL_ENEMIES' ? '全體敵方' : card.targetType === 'SINGLE_ALLY' ? '單體友軍' : '自我/全隊'}</span>
          <span className="font-semibold text-slate-300">
            {card.damage ? `${card.damage} 傷害` : card.block ? `${card.block} 護甲` : card.heal ? `${card.heal} 治癒` : '輔助/減益'}
          </span>
        </div>
      </div>

      {/* Selection / Ready Indicator */}
      {isSelected && (
        <div className="absolute inset-x-0 bottom-1 text-center">
          <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shadow">
            已挑選
          </span>
        </div>
      )}
    </div>
  );
};
