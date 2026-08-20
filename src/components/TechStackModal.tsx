import React from 'react';
import { Database, Zap, Cpu, Server, CheckCircle2, ArrowRight, ShieldCheck, Code, Globe, Layers } from 'lucide-react';

interface TechStackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TechStackModal: React.FC<TechStackModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl p-6 relative overflow-hidden text-slate-100 flex flex-col gap-6 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-950 border border-amber-500 text-amber-400">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-100">
                免下載 QR Code 連線技術方案建議
              </h2>
              <p className="text-xs text-slate-400">
                為提供高流暢、低延遲的「大螢幕 + 手機控制器」跨裝置卡牌連線體驗，建議之主流技術架構評估
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-2 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Option 1: Firebase Realtime Database */}
        <div className="bg-slate-950 border border-amber-500 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-amber-300">方案 A：Firebase Realtime Database / Firestore（推薦首選）</h3>
            </div>
            <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-500 px-2 py-0.5 rounded font-bold">
              最快上線 / 免維護 Server
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            透過 Firebase WebSocket 監聽（<code className="text-amber-300">onValue</code> 或 <code className="text-amber-300">onSnapshot</code>），當玩家手機掃碼登入時寫入 <code className="text-amber-300">rooms/&#123;roomId&#125;/players/&#123;playerId&#125;</code>，大螢幕即時顯示連線。
          </p>
          <ul className="text-xs text-slate-400 space-y-1 pl-4 list-disc">
            <li><strong className="text-slate-200">優點：</strong> 無需自行架設 WebSockets 主機，開箱即用支援極低延遲 state sync。</li>
            <li><strong className="text-slate-200">適合場景：</strong> 聚會同樂、展覽體驗、免下載快速對戰。</li>
          </ul>
        </div>

        {/* Option 2: Socket.io */}
        <div className="bg-slate-950 border border-cyan-500 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-cyan-300">方案 B：Socket.io / WebSockets (Node.js Express)</h3>
            </div>
            <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500 px-2 py-0.5 rounded font-bold">
              完全自訂 / 最低延遲 (&lt;20ms)
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            建立 Node.js Server 監聽 <code className="text-cyan-300">io.on('connection')</code>，手機送出 <code className="text-cyan-300">socket.emit('COMMIT_CARDS', &#123; slot1, slot2 &#125;)</code>，房長端收到事件後即時更新 UI。
          </p>
          <ul className="text-xs text-slate-400 space-y-1 pl-4 list-disc">
            <li><strong className="text-slate-200">優點：</strong> 可實現房長伺服器權威驗證（Server-Authoritative Game Logic），避免卡牌客戶端篡改。</li>
            <li><strong className="text-slate-200">適合場景：</strong> 大型多人同步對戰與具備等級/資產防刷機機制的競技作品。</li>
          </ul>
        </div>

        {/* Option 3: PeerJS */}
        <div className="bg-slate-950 border border-emerald-500 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-emerald-300">方案 C：PeerJS / WebRTC (Peer-to-Peer 點對點連線)</h3>
            </div>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500 px-2 py-0.5 rounded font-bold">
              0 伺服器成本
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            房長大螢幕建立 Peer ID（即為房間代碼 ROOM-8899），手機控制器透過 WebRTC Data Channel 直連房長裝置傳送點擊指令。
          </p>
          <ul className="text-xs text-slate-400 space-y-1 pl-4 list-disc">
            <li><strong className="text-slate-200">優點：</strong> 點對點直接連線，流量不經過中間伺服器，流量費用 0 元。</li>
          </ul>
        </div>

        {/* Room Join Sequence Flow Chart */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-400" />
            免下載 QR Code 連線時序流程 (Sequence Diagram)
          </h4>
          <div className="text-[11px] text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono leading-relaxed space-y-1">
            <div className="text-amber-400 font-bold">1. [房長 Host/BOSS] 建立遊戲房間 → 畫面顯示 QR Code (含房間網址與代碼)</div>
            <div className="text-cyan-400 font-bold">2. [玩家 Player] 手機開啟相機掃描 QR Code → 開啟行動端控制器 UI (不用下載 App)</div>
            <div className="text-emerald-400 font-bold">3. [玩家 Player] 輸入暱稱 + 選擇職業 → 送出 Join Room 事件 → 大螢幕顯示「已登入」亮燈</div>
            <div className="text-purple-400 font-bold">4. [回合階段] 手機選擇槽位卡牌 1 & 2 → 按下「鎖定」 → 大螢幕實時更新鎖定燈號</div>
            <div className="text-rose-400 font-bold">5. [結算階段] 全員鎖定完成 → 大螢幕觸發「交錯結算演算法」播放雙卡大絕動畫！</div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-end border-t border-slate-800 pt-3">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-5 py-2 rounded-xl text-xs border border-slate-700 cursor-pointer"
          >
            理解並關閉
          </button>
        </div>
      </div>
    </div>
  );
};
