import React from 'react';
import {
  PlayerRole,
  PlayerEquipmentSelection,
  EquipmentItem,
  CalculatedPlayerStats,
} from '../types';
import {
  PLAYER_CLASSES,
  HEAD_EQUIPMENT,
  CHEST_EQUIPMENT,
  GLOVES_EQUIPMENT,
  LEG_EQUIPMENT,
  calculatePlayerStats,
} from '../data/racesAndEquipment';
import { Shield, Zap, Heart, Sword, Feather, Sparkles } from 'lucide-react';

interface EquipmentSelectorProps {
  selectedRole: PlayerRole;
  selectedEquipment: PlayerEquipmentSelection;
  onChangeRole: (role: PlayerRole) => void;
  onChangeEquipment: (equipment: PlayerEquipmentSelection) => void;
  onConfirm?: () => void;
}

export const EquipmentSelector: React.FC<EquipmentSelectorProps> = ({
  selectedRole,
  selectedEquipment,
  onChangeRole,
  onChangeEquipment,
  onConfirm,
}) => {
  const currentRaceDef = PLAYER_CLASSES[selectedRole] || PLAYER_CLASSES.PYCNONOTUS;
  const currentStats: CalculatedPlayerStats = calculatePlayerStats(currentRaceDef, selectedEquipment);

  const handleSelectHead = (item: EquipmentItem) => {
    onChangeEquipment({ ...selectedEquipment, head: item });
  };

  const handleSelectChest = (item: EquipmentItem) => {
    onChangeEquipment({ ...selectedEquipment, chest: item });
  };

  const handleSelectGloves = (item: EquipmentItem) => {
    onChangeEquipment({ ...selectedEquipment, gloves: item });
  };

  const handleSelectLeg = (item: EquipmentItem) => {
    onChangeEquipment({ ...selectedEquipment, leg: item });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-6 text-slate-100 max-w-2xl mx-auto shadow-2xl">
      {/* HEADER */}
      <div className="border-b border-slate-800 pb-3">
        <h3 className="text-lg font-black text-amber-400 flex items-center gap-2">
          <span>🐾 選擇台灣原生種族與 4 部位裝備</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          配置您的裝備部位以計算最終生命值、攻擊力、防禦力與敏捷度。
        </p>
      </div>

      {/* 1. RACE / SPECIES SELECTION */}
      <div>
        <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">
          1. 選擇種族 (Player Class / Race)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(PLAYER_CLASSES) as PlayerRole[]).map((roleKey) => {
            const cls = PLAYER_CLASSES[roleKey];
            const isSelected = selectedRole === roleKey;
            return (
              <button
                key={roleKey}
                type="button"
                onClick={() => onChangeRole(roleKey)}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                  isSelected
                    ? 'bg-amber-950 border-amber-400 ring-2 ring-amber-400 text-slate-100'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                {cls.imageUrl && (
                  <img
                    src={cls.imageUrl}
                    alt={cls.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-xl object-contain bg-slate-900 border border-slate-800 p-0.5 shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black flex items-center justify-between">
                    <span>{cls.name}</span>
                    {isSelected && <span className="text-amber-400 text-xs">✓</span>}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono italic">
                    {cls.latinName}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. EQUIPMENT SELECTION (4 SLOTS) */}
      <div className="space-y-4">
        <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider">
          2. 裝備選擇 (Head, Chest, Gloves, Leg)
        </label>

        {/* Slot: Head */}
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
          <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>頭部 (Head Helmet)</span>
            <span className="text-amber-400 text-[11px] font-normal">
              {selectedEquipment.head?.name || '無'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {HEAD_EQUIPMENT.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectHead(item)}
                className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                  selectedEquipment.head?.id === item.id
                    ? 'bg-amber-950 border-amber-400 text-amber-200 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-slate-200">{item.name}</div>
                {selectedEquipment.head?.id === item.id && (
                  <span className="text-amber-400 text-[10px]">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Slot: Chest */}
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
          <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>胸部 (Chest Armor)</span>
            <span className="text-amber-400 text-[11px] font-normal">
              {selectedEquipment.chest?.name || '無'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {CHEST_EQUIPMENT.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectChest(item)}
                className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                  selectedEquipment.chest?.id === item.id
                    ? 'bg-amber-950 border-amber-400 text-amber-200 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-slate-200">{item.name}</div>
                {selectedEquipment.chest?.id === item.id && (
                  <span className="text-amber-400 text-[10px]">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Slot: Gloves */}
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
          <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>手部 (Gloves)</span>
            <span className="text-amber-400 text-[11px] font-normal">
              {selectedEquipment.gloves?.name || '無'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {GLOVES_EQUIPMENT.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectGloves(item)}
                className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                  selectedEquipment.gloves?.id === item.id
                    ? 'bg-amber-950 border-amber-400 text-amber-200 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-slate-200">{item.name}</div>
                {selectedEquipment.gloves?.id === item.id && (
                  <span className="text-amber-400 text-[10px]">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Slot: Leg */}
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
          <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>腿部 (Leg Armor)</span>
            <span className="text-amber-400 text-[11px] font-normal">
              {selectedEquipment.leg?.name || '無'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {LEG_EQUIPMENT.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectLeg(item)}
                className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                  selectedEquipment.leg?.id === item.id
                    ? 'bg-amber-950 border-amber-400 text-amber-200 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-slate-200">{item.name}</div>
                {selectedEquipment.leg?.id === item.id && (
                  <span className="text-amber-400 text-[10px]">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. STATS PREVIEW (calculatePlayerStats 最終數值) */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500 space-y-3">
        <div className="text-xs font-bold text-amber-400 flex items-center justify-between uppercase tracking-wider">
          <span>3. 玩家最終數值 (calculatePlayerStats)</span>
          <span className="text-[10px] text-slate-400 font-normal">種族基礎 + 裝備加成加總</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
          {/* Max HP */}
          <div className="bg-slate-900 p-2 rounded-xl border border-rose-500">
            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Heart className="w-3 h-3 text-rose-400" /> Max HP
            </div>
            <div className="text-sm font-black text-rose-300 mt-0.5">
              {currentStats.maxHp}
            </div>
          </div>

          {/* Attack */}
          <div className="bg-slate-900 p-2 rounded-xl border border-amber-500">
            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Sword className="w-3 h-3 text-amber-400" /> 攻擊
            </div>
            <div className="text-sm font-black text-amber-300 mt-0.5">
              {currentStats.attack}
            </div>
          </div>

          {/* Defense */}
          <div className="bg-slate-900 p-2 rounded-xl border border-cyan-500">
            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Shield className="w-3 h-3 text-cyan-400" /> 防禦
            </div>
            <div className="text-sm font-black text-cyan-300 mt-0.5">
              {currentStats.defense}
            </div>
          </div>

          {/* Evasion */}
          <div className="bg-slate-900 p-2 rounded-xl border border-emerald-500">
            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Feather className="w-3 h-3 text-emerald-400" /> 閃避
            </div>
            <div className="text-sm font-black text-emerald-300 mt-0.5">
              {currentStats.evasion}
            </div>
          </div>

          {/* Stamina */}
          <div className="bg-slate-900 p-2 rounded-xl border border-purple-500">
            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" /> 體力
            </div>
            <div className="text-sm font-black text-purple-300 mt-0.5">
              {currentStats.stamina}
            </div>
          </div>

          {/* Speed */}
          <div className="bg-slate-900 p-2 rounded-xl border border-indigo-500">
            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 text-indigo-400" /> 敏捷
            </div>
            <div className="text-sm font-black text-indigo-300 mt-0.5">
              {currentStats.speed}
            </div>
          </div>
        </div>
      </div>

      {onConfirm && (
        <button
          onClick={onConfirm}
          className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-black transition cursor-pointer shadow-lg"
        >
          確認套用配置
        </button>
      )}
    </div>
  );
};
