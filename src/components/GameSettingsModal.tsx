import React from 'react';
import { GameRulesConfig } from '../types';
import { X, Settings, Users, Eye, Zap, RefreshCw } from 'lucide-react';

interface GameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GameRulesConfig;
  onChangeConfig: (newConfig: GameRulesConfig) => void;
  heroCount: number;
  onChangeHeroCount: (count: number) => void;
  onRestartGame: () => void;
}

export const GameSettingsModal: React.FC<GameSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  heroCount,
  onChangeHeroCount,
  onRestartGame,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-5">
          <Settings className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-lg">遊戲機制與數據設定 (Rules & Engine Settings)</h3>
        </div>

        <div className="space-y-4 text-xs sm:text-sm">
          {/* Hero Count */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <label className="font-bold text-slate-200 flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-amber-400" /> 出戰玩家/英雄人數:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[1, 2, 3, 4, 5, 6].map((count) => (
                <button
                  key={count}
                  onClick={() => onChangeHeroCount(count)}
                  className={`py-2 rounded-lg font-bold border transition cursor-pointer text-xs ${
                    heroCount === count
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {count} 人
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              可測試 1人獨戰 或 2~6 人多人共鬥機制。變更人數將重新開啟新對局。
            </p>
          </div>

          {/* Priority Speed Formula */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <label className="font-bold text-slate-200 flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-emerald-400" /> 結算階段優先順序公式:
            </label>
            <select
              value={config.priorityFormula}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  priorityFormula: e.target.value as GameRulesConfig['priorityFormula'],
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="SPEED_PLUS_PRIORITY">
                敏捷度 + 卡牌優先級 (預設：兼顧角色屬性與招式速度)
              </option>
              <option value="CARD_PRIORITY_ONLY">
                僅看卡牌優先級 (Card Priority Only)
              </option>
              <option value="CHARACTER_SPEED_ONLY">
                僅看角色敏捷度 (Character Speed Only)
              </option>
            </select>
          </div>

          {/* Boss Intel Reveal Mode */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <label className="font-bold text-slate-200 flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-purple-400" /> BOSS 同步出牌情報模式:
            </label>
            <select
              value={config.bossIntelMode}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  bossIntelMode: e.target.value as GameRulesConfig['bossIntelMode'],
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="FULL_SECRET">全暗牌 (Full Secret) - 出牌階段無法得知 BOSS 任何卡牌</option>
              <option value="CARD_TYPE_ONLY">僅顯示種類 (Type Only) - 可看到攻/防/咒文提示</option>
              <option value="REVEALED">完全公開 (Revealed) - 可精準預測 BOSS 優先級與招式</option>
            </select>
          </div>

          {/* Lock-In Cancel toggle */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-200 block">允許解鎖 (Cancel Lock-In)</span>
              <span className="text-[11px] text-slate-400">全員結算前是否允許反悔重新挑選卡牌</span>
            </div>
            <input
              type="checkbox"
              checked={config.allowCancelLockIn}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  allowCancelLockIn: e.target.checked,
                })
              }
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onRestartGame();
              onClose();
            }}
            className="bg-rose-900/50 hover:bg-rose-800 text-rose-200 border border-rose-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> 重新開局 (Restart)
          </button>

          <button
            onClick={onClose}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs transition cursor-pointer"
          >
            儲存並關閉
          </button>
        </div>
      </div>
    </div>
  );
};
