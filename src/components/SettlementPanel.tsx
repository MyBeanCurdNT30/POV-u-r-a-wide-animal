import React from 'react';
import { Hero, Boss, GamePhase } from '../types';
import { Trophy, Skull, RefreshCw, Award, Zap, Shield, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { PLAYER_CLASSES } from '../data/racesAndEquipment';

interface BattleStats {
  totalTurns: number;
  heroDamage: Record<string, number>;
}

interface SettlementPanelProps {
  phase: GamePhase;
  boss: Boss;
  heroes: Hero[];
  stats: BattleStats;
  onRestart: () => void;
}

export const SettlementPanel: React.FC<SettlementPanelProps> = ({
  phase,
  boss,
  heroes,
  stats,
  onRestart,
}) => {
  if (phase !== 'VICTORY' && phase !== 'DEFEAT') {
    return null;
  }

  const isVictory = phase === 'VICTORY';

  // Find MVP (Hero with highest damage)
  let mvpHeroId = '';
  let maxDmg = -1;

  Object.entries(stats.heroDamage).forEach(([id, dmg]) => {
    const numDmg = Number(dmg) || 0;
    if (numDmg > maxDmg) {
      maxDmg = numDmg;
      mvpHeroId = id;
    }
  });

  const mvpHero = heroes.find((h) => h.id === mvpHeroId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden"
      >
        {/* Top Decorative Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-slate-950 border border-slate-800 shadow-inner">
            {isVictory ? (
              <Trophy className="w-12 h-12 text-amber-400 animate-bounce" />
            ) : (
              <Skull className="w-12 h-12 text-rose-500 animate-pulse" />
            )}
          </div>

          <h2 className={`text-3xl md:text-4xl font-black ${isVictory ? 'text-amber-300' : 'text-rose-400'}`}>
            {isVictory ? '🎉 戰鬥勝利！野生動物團隊大獲全勝' : '💀 戰敗！野生動物團隊不敵 BOSS'}
          </h2>
          <p className="text-sm text-slate-400">
            {isVictory
              ? `經過 ${stats.totalTurns} 回合的激烈交鋒，成功擊退了【${boss.name}】！`
              : `【${boss.name}】守住了優勢（剩餘 HP: ${boss.hp} / ${boss.maxHp}）。繼續調整戰術再接再厲！`}
          </p>
        </div>

        {/* MVP Showcase Card */}
        {mvpHero && maxDmg > 0 && (
          <div className="bg-gradient-to-r from-amber-950/40 via-slate-950 to-amber-950/40 border border-amber-500/40 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-950 border border-amber-500 flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-lg">
              {PLAYER_CLASSES[mvpHero.role]?.imageUrl ? (
                <img
                  src={PLAYER_CLASSES[mvpHero.role].imageUrl}
                  alt={mvpHero.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              ) : (
                <Award className="w-8 h-8 text-amber-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Award className="w-3 h-3" /> 傷害 MVP
                </span>
                <span className="text-xs text-amber-300 font-medium">輸出王</span>
              </div>
              <h3 className="text-lg font-bold text-slate-100 mt-0.5">{mvpHero.name}</h3>
              <p className="text-xs text-slate-400">
                對 BOSS 總計輸出 <span className="text-amber-400 font-bold text-sm">{maxDmg}</span> 點傷害
              </p>
            </div>
          </div>
        )}

        {/* Team Performance Breakdown Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" /> 團隊戰鬥結算統計 (共 {stats.totalTurns} 回合)
          </h4>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {heroes.map((hero) => {
              const dmg = stats.heroDamage[hero.id] || 0;
              const isAlive = hero.hp > 0;

              return (
                <div
                  key={hero.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
                      {PLAYER_CLASSES[hero.role]?.imageUrl ? (
                        <img
                          src={PLAYER_CLASSES[hero.role].imageUrl}
                          alt={hero.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Shield className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-200 flex items-center gap-2">
                        <span>{hero.name}</span>
                        {!isAlive && (
                          <span className="text-[10px] text-rose-400 bg-rose-950 px-1.5 py-0.2 rounded border border-rose-800">
                            陣亡
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {PLAYER_CLASSES[hero.role]?.name || hero.role}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-[10px] text-slate-500">剩餘 HP</div>
                      <div className="font-bold text-rose-400 flex items-center justify-end gap-1">
                        <Heart className="w-3 h-3 fill-rose-400" /> {hero.hp} / {hero.maxHp}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">總輸出傷害</div>
                      <div className="font-bold text-amber-400 text-sm">{dmg} HP</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={onRestart}
            className="w-full sm:w-auto px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-base"
          >
            <RefreshCw className="w-5 h-5" /> 重新開始戰鬥 / 切換關卡
          </button>
        </div>
      </motion.div>
    </div>
  );
};
