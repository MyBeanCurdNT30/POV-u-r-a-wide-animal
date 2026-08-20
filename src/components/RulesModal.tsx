import React from 'react';
import { X, Lock, Play, RotateCcw, Zap, Shield, Heart, Sparkles, BookOpen, CheckCircle } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-6 h-6 text-amber-400" />
          <h2 className="text-xl font-bold">同步回合制（Simultaneous Turn-Based）遊戲架構</h2>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
          歡迎使用本遊戲系統原型。所有玩家與 BOSS 在同一回合內同時思考並選擇卡牌，徹底擺脫傳統「單人輪流等待」的停頓感。
        </p>

        {/* Card & Boss Rules Section */}
        <div className="space-y-4">
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm mb-1">
              <Zap className="w-4 h-4" />
              卡牌機制與數值加成
            </div>
            <p className="text-xs text-slate-300 leading-relaxed pl-6">
              玩家手牌全數呈現（共 7 張）：<span className="text-rose-400 font-bold">3 張攻擊</span>（耗費 1 費）、<span className="text-blue-400 font-bold">3 張防禦</span>（耗費 1 費）、<span className="text-teal-400 font-bold">1 張休息</span>（耗費 3 費，補充 HP：一般種族 5 HP，鼬獾 15 HP）。
            </p>
            <div className="my-2 ml-6 bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs text-amber-300 font-mono space-y-1">
              <div>【玩家卡牌加成】</div>
              <div>・攻擊與防禦牌基礎數字 = 3</div>
              <div>・當點數大於 1 時，每超過 1 點則數值 +2：</div>
              <div>  ・攻擊牌傷害 = 3 + Max(0, 攻擊數值 - 1) × 2</div>
              <div>  ・防禦牌護甲 = 3 + Max(0, 防禦數值 - 1) × 2</div>
              <div className="pt-1 text-cyan-300">【BOSS 傷害減免】</div>
              <div>・當玩家防禦點數 &gt; 1 時，每超過 1 點則 BOSS 對該玩家攻擊傷害 -2 點</div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
              <Heart className="w-4 h-4" />
              種族生命值 (HP) 與 BOSS 獨立血量
            </div>
            <div className="pl-6 space-y-2 text-xs text-slate-300">
              <div>
                <span className="text-amber-300 font-bold">・玩家種族基礎 HP：</span>
                白頭翁 45 HP、月鼠 30 HP、白鼻心 55 HP、鼬獾 60 HP。
              </div>
              <div>
                <span className="text-amber-300 font-bold">・BOSS 獨立 200 HP：</span>
                【黃色土狗】與【三花貓】各自具備獨立的 200 點血量與狀態，切換 BOSS 時會保留各自剩餘血量。
              </div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-1">
              <Shield className="w-4 h-4" />
              BOSS 鎖定 AI 規則
            </div>
            <p className="text-xs text-slate-300 leading-relaxed pl-6">
              BOSS 的單體攻擊卡牌（如【咬】、【爪擊】、【重擊】）會優先鎖定攻擊<span className="text-amber-400 font-bold">閃避 (Evasion) 數值最低</span>的玩家！
            </p>
          </div>

          {/* Phase 1 */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1">
              <Lock className="w-4 h-4" />
              1. 出牌階段（Commit Phase）
            </div>
            <p className="text-xs text-slate-300 leading-relaxed pl-6">
              玩家與 BOSS 在同一時間同時挑選要發動的卡牌。選定卡牌與目標後，玩家點擊「鎖定（Lock-In / Ready）」按鈕。
              鎖定後無法隨意變更卡牌，BOSS 也在背景同步完成卡牌選擇並鎖定。
            </p>
          </div>

          {/* Phase 2 */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
              <Play className="w-4 h-4" />
              2. 結算階段（Resolution Phase）
            </div>
            <p className="text-xs text-slate-300 leading-relaxed pl-6">
              當全體玩家與 BOSS 皆完成鎖定後，回合進入自動結算階段。系統根據卡牌類型優先度與敏捷度計算「行動序列」：
            </p>
            <div className="my-2 ml-6 bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs text-amber-300 font-mono space-y-1">
              <div>【算牌優先順序】</div>
              <div>① <span className="text-cyan-300 font-bold">防禦牌 (DEFENSE)</span>：第一優先結算，先手架起護甲防護！</div>
              <div>② <span className="text-emerald-300 font-bold">休息牌 (REST)</span>：第二順位，調息恢復生命值。</div>
              <div>③ <span className="text-purple-300 font-bold">威嚇牌 (INTIMIDATE)</span>：第三順位，進行吠叫、哈氣或削弱干擾。</div>
              <div>④ <span className="text-rose-300 font-bold">攻擊牌 (ATTACK)</span>：第四順位，進行傷害打擊結算。</div>
              <div className="pt-1 text-slate-400">※ 同類型卡牌則依照「角色敏捷 (Speed) + 卡牌優先級 (Priority)」由高至低結算。</div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed pl-6">
              優先度最高者先一步執行防禦護盾、治癒或威嚇，實現「防禦先架起、休息先回血、威嚇先發動、攻擊後結算」的嚴謹策略對抗！
            </p>
          </div>

          {/* Phase 3 */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm mb-1">
              <RotateCcw className="w-4 h-4" />
              3. 回合結束（End Phase）
            </div>
            <p className="text-xs text-slate-300 leading-relaxed pl-6">
              結算完成後，清算盤面護盾與狀態持續時間，補滿玩家能量，抽補充手牌，重新進入下一個回合的「出牌階段」。
            </p>
          </div>
        </div>

        {/* Extensions readiness notice */}
        <div className="mt-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">可擴充性提示：</span>
            本遊戲架構已完全將數據（卡牌數值、BOSS AI、英雄職業、優先級公式）與視訊動畫結算分離。您可以隨時在後續對話中提供更詳細的數值、新卡牌或自訂機制，我將會為您快速更新擴充！
          </div>
        </div>

        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            瞭解，返回對戰
          </button>
        </div>
      </div>
    </div>
  );
};
