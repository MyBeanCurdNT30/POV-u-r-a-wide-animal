import React from 'react';
import { BattleLog } from '../types';
import { X, ListOrdered, Shield, Heart, Sword, Flame, Info } from 'lucide-react';

interface BattleLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: BattleLog[];
  onClearLogs: () => void;
}

export const BattleLogDrawer: React.FC<BattleLogDrawerProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col p-4 text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-sm">戰鬥詳細日誌</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClearLogs}
            className="text-[10px] text-slate-400 hover:text-slate-200 bg-slate-800 px-2 py-1 rounded"
          >
            清空
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1 rounded bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Log items container */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
        {logs.length === 0 ? (
          <div className="text-slate-500 text-center py-8 italic">尚無戰鬥紀錄</div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`p-2.5 rounded-lg border leading-relaxed ${
                log.type === 'attack'
                  ? 'bg-rose-950/30 border-rose-900/50 text-rose-200'
                  : log.type === 'heal'
                  ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-200'
                  : log.type === 'defend'
                  ? 'bg-cyan-950/30 border-cyan-900/50 text-cyan-200'
                  : log.type === 'boss'
                  ? 'bg-purple-950/30 border-purple-900/50 text-purple-200'
                  : log.type === 'phase'
                  ? 'bg-amber-950/30 border-amber-900/50 text-amber-200 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span className="font-bold text-amber-400">Turn {log.turn}</span>
                <span>{log.timestamp}</span>
              </div>
              <div>{log.text}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
