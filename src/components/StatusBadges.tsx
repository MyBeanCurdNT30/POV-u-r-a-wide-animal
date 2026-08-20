import React from 'react';
import { StatusEffect } from '../types';

interface StatusBadgesProps {
  statuses: StatusEffect[];
  isEnraged?: boolean;
  isStinking?: boolean;
}

export const StatusBadges: React.FC<StatusBadgesProps> = ({
  statuses,
  isEnraged,
  isStinking,
}) => {
  if (statuses.length === 0 && !isEnraged && !isStinking) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 my-1.5">
      {isEnraged && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950 border border-rose-600 text-rose-300 flex items-center gap-1 shadow animate-pulse">
          🔥 狂暴狀態
        </span>
      )}

      {isStinking && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 border border-amber-600 text-amber-300 flex items-center gap-1 shadow">
          🦨 惡臭威嚇 (低於50%HP)
        </span>
      )}

      {statuses.map((st, idx) => {
        let label = '';
        let color = 'bg-slate-950 border-slate-700 text-slate-300';

        switch (st.type) {
          case 'BLEED':
            label = `🩸 流血 (${st.duration}回合)`;
            color = 'bg-rose-950 border-rose-700 text-rose-300 animate-pulse';
            break;
          case 'BITTEN':
            label = `🦷 被咬住 (${st.duration}回合)`;
            color = 'bg-amber-950 border-amber-600 text-amber-300';
            break;
          case 'WEAK':
            label = `📉 虛弱 (${st.duration}回合)`;
            color = 'bg-yellow-950 border-yellow-600 text-yellow-300';
            break;
          case 'STRENGTH':
            label = `⚔️ 力量 +${st.value}`;
            color = 'bg-emerald-950 border-emerald-600 text-emerald-300';
            break;
          case 'DEFENSE':
            label = `🛡️ 防禦 +${st.value}`;
            color = 'bg-cyan-950 border-cyan-600 text-cyan-300';
            break;
          case 'HISS_WEAK':
            label = `🙀 威嚇虛弱 (${st.duration}回合)`;
            color = 'bg-purple-950 border-purple-600 text-purple-300';
            break;
          case 'RABIES':
            label = `☣️ 狂犬病 (${st.duration}回合)`;
            color = 'bg-lime-950 border-lime-600 text-lime-300';
            break;
          case 'BARK':
            label = `🐕 狂暴吠叫 (攻+${st.value}, 命中+10%)`;
            color = 'bg-rose-950 border-rose-500 text-rose-300 animate-pulse';
            break;
          case 'DEFENSE_DOWN':
            label = `🛡️ 防禦下降 -${st.value} (${st.duration}回合)`;
            color = 'bg-orange-950 border-orange-600 text-orange-300';
            break;
          default:
            label = `${st.type} (${st.duration}回合)`;
        }

        return (
          <span
            key={`${st.type}_${idx}`}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 shadow-sm ${color}`}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
};
