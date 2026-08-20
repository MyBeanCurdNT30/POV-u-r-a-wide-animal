import React, { useState } from 'react';
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
import {
  UserPlus,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Shield,
  Zap,
  Heart,
  Sword,
  Feather,
  Sparkles,
  Play,
  Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PlayerCreationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHero: (name: string, role: PlayerRole, equipment: PlayerEquipmentSelection) => void;
  defaultName?: string;
  isMandatory?: boolean;
}

const STEP_TITLES = [
  '1. 玩家暱稱與種族',
  '2. 頭部頭盔裝備',
  '3. 胸部胸甲裝備',
  '4. 手部手套裝備',
  '5. 腿部護腿裝備',
  '6. 數值確認與加入',
];

export const PlayerCreationWizardModal: React.FC<PlayerCreationWizardModalProps> = ({
  isOpen,
  onClose,
  onAddHero,
  defaultName = '',
  isMandatory = false,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [heroName, setHeroName] = useState<string>(defaultName);
  const [selectedRole, setSelectedRole] = useState<PlayerRole>('PYCNONOTUS');
  const [selectedEquipment, setSelectedEquipment] = useState<PlayerEquipmentSelection>({
    head: HEAD_EQUIPMENT[0],
    chest: CHEST_EQUIPMENT[0],
    gloves: GLOVES_EQUIPMENT[0],
    leg: LEG_EQUIPMENT[0],
  });

  if (!isOpen) return null;

  const currentRaceDef = PLAYER_CLASSES[selectedRole] || PLAYER_CLASSES.PYCNONOTUS;
  const currentStats: CalculatedPlayerStats = calculatePlayerStats(currentRaceDef, selectedEquipment);

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = (e?: React.FormEvent, customEquipment?: PlayerEquipmentSelection) => {
    if (e) e.preventDefault();
    const finalName = heroName.trim() || `玩家 ${Math.floor(Math.random() * 900) + 100}`;
    onAddHero(finalName, selectedRole, customEquipment || selectedEquipment);
    onClose();
    // Reset state for next use
    setCurrentStep(1);
    setHeroName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-xl shadow-2xl relative text-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* MODAL HEADER */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-amber-300 flex items-center gap-2">
                <span>建立玩家角色 (Character Creation)</span>
              </h3>
              <p className="text-xs text-slate-400">
                頁面 {currentStep} / 6：{STEP_TITLES[currentStep - 1]}
              </p>
            </div>
          </div>

          {!isMandatory ? (
            <button
              onClick={onClose}
              type="button"
              className="text-slate-400 hover:text-slate-100 p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-[11px] font-bold text-amber-400 bg-amber-950/60 border border-amber-500/40 px-2.5 py-1 rounded-full">
              請建立角色加入
            </span>
          )}
        </div>

        {/* STEP PROGRESS BAR */}
        <div className="bg-slate-950 px-5 py-2 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            {STEP_TITLES.map((title, idx) => {
              const stepNum = idx + 1;
              const isCompleted = stepNum < currentStep;
              const isCurrent = stepNum === currentStep;
              return (
                <button
                  key={stepNum}
                  type="button"
                  onClick={() => setCurrentStep(stepNum)}
                  className={`flex-1 h-2 rounded-full transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                      : isCompleted
                      ? 'bg-emerald-500'
                      : 'bg-slate-800'
                  }`}
                  title={title}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>第 1 頁：種族</span>
            <span>第 2 頁：頭盔</span>
            <span>第 3 頁：胸甲</span>
            <span>第 4 頁：手套</span>
            <span>第 5 頁：護腿</span>
            <span>第 6 頁：加入</span>
          </div>
        </div>

        {/* WIZARD CONTENT AREA */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          <AnimatePresence mode="wait">
            {/* STEP 1: NAME & RACE */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1.5">
                    1. 玩家暱稱 / 角色名稱：
                  </label>
                  <input
                    type="text"
                    placeholder="輸入暱稱（例如：小明 / 飛鳥勇者）..."
                    value={heroName}
                    onChange={(e) => setHeroName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">
                    2. 選擇角色種族 (4 選 1)：
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(Object.keys(PLAYER_CLASSES) as PlayerRole[]).map((roleKey) => {
                      const cls = PLAYER_CLASSES[roleKey];
                      const isSelected = selectedRole === roleKey;
                      return (
                        <div
                          key={roleKey}
                          onClick={() => setSelectedRole(roleKey)}
                          className={`p-4 rounded-2xl border transition cursor-pointer flex items-center gap-3.5 ${
                            isSelected
                              ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-400/50 shadow-lg'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400 hover:bg-slate-900/60'
                          }`}
                        >
                          {cls.imageUrl && (
                            <img
                              src={cls.imageUrl}
                              alt={cls.name}
                              referrerPolicy="no-referrer"
                              className="w-14 h-14 rounded-2xl object-contain bg-slate-900 border border-slate-800 p-1 shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-slate-100 text-base">{cls.name}</span>
                              {isSelected && (
                                <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  已選擇 ✓
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">
                              {cls.latinName}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: HEAD EQUIPMENT */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-3 text-xs text-amber-200">
                  <span className="font-bold">第二頁：選擇頭部頭盔 (Head Equipment)</span>
                </div>

                <div className="space-y-2.5">
                  {HEAD_EQUIPMENT.map((item) => {
                    const isSelected = selectedEquipment.head?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedEquipment({ ...selectedEquipment, head: item })}
                        className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-400/50 shadow-lg'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="font-black text-sm text-slate-100 flex items-center gap-2">
                          <span>{item.name}</span>
                        </div>
                        {isSelected && (
                          <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-2.5 py-1 rounded-full">
                            已選擇 ✓
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 3: CHEST EQUIPMENT */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-3 text-xs text-amber-200">
                  <span className="font-bold">第三頁：選擇胸部胸甲 (Chest Equipment)</span>
                </div>

                <div className="space-y-2.5">
                  {CHEST_EQUIPMENT.map((item) => {
                    const isSelected = selectedEquipment.chest?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedEquipment({ ...selectedEquipment, chest: item })}
                        className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-400/50 shadow-lg'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="font-black text-sm text-slate-100 flex items-center gap-2">
                          <span>{item.name}</span>
                        </div>
                        {isSelected && (
                          <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-2.5 py-1 rounded-full">
                            已選擇 ✓
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 4: GLOVES EQUIPMENT */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-3 text-xs text-amber-200">
                  <span className="font-bold">第四頁：選擇手部手套 (Gloves Equipment)</span>
                </div>

                <div className="space-y-2.5">
                  {GLOVES_EQUIPMENT.map((item) => {
                    const isSelected = selectedEquipment.gloves?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedEquipment({ ...selectedEquipment, gloves: item })}
                        className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-400/50 shadow-lg'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="font-black text-sm text-slate-100 flex items-center gap-2">
                          <span>{item.name}</span>
                        </div>
                        {isSelected && (
                          <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-2.5 py-1 rounded-full">
                            已選擇 ✓
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 5: LEG EQUIPMENT */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-3 text-xs text-amber-200">
                  <span className="font-bold">第五頁：選擇腿部護腿 (Leg Equipment)</span>
                </div>

                <div className="space-y-2.5">
                  {LEG_EQUIPMENT.map((item) => {
                    const isSelected = selectedEquipment.leg?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedEquipment({ ...selectedEquipment, leg: item })}
                        className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-400/50 shadow-lg'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="font-black text-sm text-slate-100 flex items-center gap-2">
                          <span>{item.name}</span>
                        </div>
                        {isSelected && (
                          <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-2.5 py-1 rounded-full">
                            已選擇 ✓
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 6: STATS & SUMMARY CONFIRMATION */}
            {currentStep === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 text-emerald-200 space-y-1">
                  <div className="font-bold text-sm flex items-center gap-2 text-emerald-300">
                    <Award className="w-5 h-5 text-emerald-400" />
                    <span>第六頁：裝備與能力全覽確認</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    您已選擇完全部裝備，點擊下方「加入遊戲」按鈕即可跳轉進入戰場畫面！
                  </p>
                </div>

                {/* Profile Banner */}
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
                  {currentRaceDef.imageUrl && (
                    <img
                      src={currentRaceDef.imageUrl}
                      alt={currentRaceDef.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-2xl object-contain bg-slate-900 border border-slate-700 p-1 shrink-0"
                    />
                  )}
                  <div>
                    <div className="text-base font-black text-amber-300">
                      {heroName.trim() || '未知名稱玩家'}
                    </div>
                    <div className="text-xs text-slate-300 font-bold">
                      種族：{currentRaceDef.name} ({currentRaceDef.latinName})
                    </div>
                  </div>
                </div>

                {/* Equipment Summary List */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <div className="font-bold text-slate-300 border-b border-slate-800 pb-1.5">
                    已選擇配戴裝備 (Selected Equipment)：
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-300">
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <span className="text-amber-400 font-bold">頭部：</span>
                      {selectedEquipment.head?.name}
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <span className="text-amber-400 font-bold">胸部：</span>
                      {selectedEquipment.chest?.name}
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <span className="text-amber-400 font-bold">手部：</span>
                      {selectedEquipment.gloves?.name}
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <span className="text-amber-400 font-bold">腿部：</span>
                      {selectedEquipment.leg?.name}
                    </div>
                  </div>
                </div>

                {/* Final Stats Calculation Panel */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/50 space-y-3">
                  <div className="text-xs font-bold text-amber-400 flex items-center justify-between uppercase tracking-wider">
                    <span>最終角色戰力數值 (Final Stats)</span>
                    <span className="text-[10px] text-slate-400 font-normal">種族基礎 + 裝備加成總和</span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                    {/* Max HP */}
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-rose-500/60">
                      <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                        <Heart className="w-3 h-3 text-rose-400" /> HP
                      </div>
                      <div className="text-sm font-black text-rose-300 mt-0.5">
                        {currentStats.maxHp}
                      </div>
                    </div>

                    {/* Attack */}
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-amber-500/60">
                      <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                        <Sword className="w-3 h-3 text-amber-400" /> 攻擊
                      </div>
                      <div className="text-sm font-black text-amber-300 mt-0.5">
                        {currentStats.attack}
                      </div>
                    </div>

                    {/* Defense */}
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-cyan-500/60">
                      <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                        <Shield className="w-3 h-3 text-cyan-400" /> 防禦
                      </div>
                      <div className="text-sm font-black text-cyan-300 mt-0.5">
                        {currentStats.defense}
                      </div>
                    </div>

                    {/* Evasion */}
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-emerald-500/60">
                      <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                        <Feather className="w-3 h-3 text-emerald-400" /> 閃避
                      </div>
                      <div className="text-sm font-black text-emerald-300 mt-0.5">
                        {currentStats.evasion}
                      </div>
                    </div>

                    {/* Stamina */}
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-purple-500/60">
                      <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-400" /> 體力
                      </div>
                      <div className="text-sm font-black text-purple-300 mt-0.5">
                        {currentStats.stamina}
                      </div>
                    </div>

                    {/* Speed */}
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-indigo-500/60">
                      <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                        <Zap className="w-3 h-3 text-indigo-400" /> 敏捷
                      </div>
                      <div className="text-sm font-black text-indigo-300 mt-0.5">
                        {currentStats.speed}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* MODAL FOOTER BUTTONS */}
        <div className="bg-slate-950 px-5 py-3.5 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>上一頁</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition flex items-center gap-1 cursor-pointer shadow-md"
            >
              <span>下一頁</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 hover:from-amber-400 hover:to-emerald-300 text-slate-950 text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-xl hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>加入遊戲 (JOIN GAME)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
