import React, { useState } from 'react';
import { QrCode, Copy, Check, Users, Wifi, Phone, ShieldCheck, Sparkles, BookOpen, ExternalLink } from 'lucide-react';
import { Hero } from '../types';

interface RoomQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  heroes: Hero[];
  onOpenTechStackModal: () => void;
  onSimulateJoinMobile: (heroId: string) => void;
}

export const RoomQrModal: React.FC<RoomQrModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  heroes,
  onOpenTechStackModal,
  onSimulateJoinMobile,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const roomUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}&mode=player`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(roomUrl)}&color=38bdf8&bg=0f172a`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const connectedCount = heroes.filter((h) => h.isConnected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-cyan-500/30 w-full max-w-2xl rounded-2xl shadow-2xl p-6 relative overflow-hidden text-slate-100 flex flex-col gap-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
                手機掃碼免下載連線房間
                <span className="text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                  即時同步中
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                玩家可掃描 QR Code 或輸入房間代碼，手機無需安裝 App 直接開始遊戲
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

        {/* Room Code & QR Code Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center bg-slate-950/80 border border-slate-800 rounded-2xl p-5 text-center shadow-inner">
            <div className="relative group p-2 bg-slate-900 border border-slate-700 rounded-xl shadow-lg mb-3">
              <img
                src={qrCodeImageUrl}
                alt="Room QR Code"
                className="w-48 h-48 rounded-lg object-contain"
              />
              <div className="absolute inset-0 bg-cyan-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none" />
            </div>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-cyan-400" />
              用手機相機或 LINE 掃描開啟網頁
            </span>
          </div>

          {/* Room Details & Direct Link */}
          <div className="space-y-4">
            {/* Room Code Box */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium block mb-1">房間邀請代碼 (Room Code)</span>
              <div className="text-3xl font-black text-cyan-400 tracking-wider font-mono">
                {roomCode}
              </div>
            </div>

            {/* Direct URL & Copy Button */}
            <div>
              <span className="text-xs text-slate-400 font-medium block mb-1">直連專用網址</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={roomUrl}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-2 flex-1 focus:outline-none font-mono"
                />
                <button
                  onClick={handleCopyUrl}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? '已複製' : '複製'}
                </button>
              </div>
            </div>

            {/* Tech Stack Guide Button */}
            <button
              onClick={onOpenTechStackModal}
              className="w-full bg-gradient-to-r from-cyan-900/40 to-slate-800 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-xs font-bold p-3 rounded-xl flex items-center justify-between cursor-pointer transition shadow-md"
            >
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                查看「QR Code 免下載連線」技術架構建議 (WebSocket / Firebase)
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          </div>
        </div>

        {/* Connected Players Realtime Status Bar */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-cyan-400" />
              已連線玩家隊伍 ({connectedCount} / {heroes.length})
            </span>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
              <Wifi className="w-3 h-3 animate-ping text-emerald-400" />
              即時狀態 Sync Active
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {heroes.map((hero) => (
              <div
                key={hero.id}
                className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-200">{hero.name}</div>
                  <div className="text-[10px] text-slate-400">{hero.role}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                      hero.isReady
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : hero.isConnected
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}
                  >
                    {hero.isReady ? '🔒 已鎖定雙卡' : hero.isConnected ? '🟢 已手機登入' : '⚪ 等待連線'}
                  </span>
                  <button
                    onClick={() => onSimulateJoinMobile(hero.id)}
                    className="text-[9px] text-cyan-400 hover:underline cursor-pointer"
                  >
                    切換控制
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-end border-t border-slate-800 pt-3">
          <button
            onClick={onClose}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-6 py-2 rounded-xl text-xs cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            完成進入遊戲戰場
          </button>
        </div>
      </div>
    </div>
  );
};
