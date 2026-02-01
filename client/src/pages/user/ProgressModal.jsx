import React, { useEffect } from 'react';
import { useProgressSaver } from './hooks/useProgressSaver';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { API_BASE_URL } from '../../config/apiConfig';

const ProgressModal = ({ isOpen, onClose, gameResult, levelData, blocklyXml, textCodeContent, finalScore, hp_remaining, getToken }) => {
  const navigate = useNavigate();

  const {
    saving,
    saveStatus,
    saveError,
    awardedRewards,
    checkingRewards,
    saveProgress
  } = useProgressSaver();

  // Data to display/save
  const userProgressData = {
    level_id: levelData?.level_id || levelData?.id,
    status: gameResult === 'victory' ? 'completed' : 'in_progress',
    blockly_code: blocklyXml || null,
    text_code: levelData?.textcode ? textCodeContent : null,
    best_score: finalScore?.totalScore ?? (gameResult === 'victory' ? 60 : 0),
    pattern_bonus_score: finalScore?.pattern_bonus_score || 0,
    is_correct: gameResult === 'victory',
    stars_earned: finalScore?.stars ?? (gameResult === 'victory' ? 3 : 0),
    hp_remaining: hp_remaining ?? 0,
  };

  // Trigger save when modal opens
  useEffect(() => {
    if (isOpen && getToken && (levelData?.level_id || levelData?.id) && !saveStatus && !saving) {
      saveProgress({
        levelData,
        gameResult,
        blocklyXml,
        textCodeContent,
        finalScore,
        hp_remaining
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, levelData, getToken, gameResult]);

  // Minimize modal (just close, don't navigate)
  const handleMinimize = () => {
    onClose();
  };

  // Navigate away (for buttons)
  const handleNavigateAway = () => {
    onClose();
    navigate('/user/mapselect');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleMinimize}>
      <DialogContent
        className="max-w-2xl p-0 bg-transparent border-0 shadow-none overflow-visible"
        // Prevent default close button from showing
        hideCloseButton
      >
        {/* Pixel Card Wrapper */}
        <div className="relative w-full shadow-2xl transform transition-all duration-300">

          {/* --- Layer ล่าง: กรอบรูป (Background) --- */}
          <img
            src="/scoreccl1.png"
            alt="Score Board"
            className="w-full h-auto block select-none"
            style={{ imageRendering: 'pixelated' }}
          />

          {/* --- Layer บน: เนื้อหา --- */}
          <div className="absolute inset-0 flex flex-col px-[8%] pt-[6%] pb-[8%]">

            {/* === A. Header Section === */}
            <div className="flex justify-between items-start h-[10%] shrink-0">
              <h2
                className="text-[#2d1b0e] font-bold drop-shadow-sm uppercase"
                style={{
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: 'clamp(12px, 2.5vw, 24px)'
                }}
              >
                {gameResult === 'victory' ? 'VICTORY' : 'GAME OVER'}
              </h2>

              <button onClick={handleNavigateAway} className="text-[#5d4037] hover:text-red-600 hover:scale-110 transition-transform font-bold text-xl">
                ✕
              </button>
            </div>

            {/* === B. Scrollable Content (Score & Details) === */}
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="space-y-4">

                {/* ⭐ STAR SECTION ⭐ */}
                <div className="flex justify-center py-2">
                  {console.log("stars_earned", userProgressData.stars_earned)}
                  <img
                    // ✅ Logic: ถ้าไม่ชนะ = star0 | ถ้าชนะ = star + เลขดาว (1,2,3)
                    src={gameResult !== 'victory' ? '/star0.png' : `/star${userProgressData.stars_earned || 0}.png`}
                    alt="Rank Stars"
                    className="h-20 sm:h-30 object-contain drop-shadow-md animate-bounce-slow"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>


                {/* Score Details Box */}
                <div
                  className="bg-[#fdf6e3]/90 p-4 mx-2 my-8" // ลบ border/rounded เดิมออก, ใส่ mx-1 กันเงาขาด
                  style={{
                    // สร้างขอบ Pixel ด้วย Box Shadow (เทคนิค NES Style)
                    boxShadow: `
      -3px 0 0 0 #8d6e63,  /* ขอบซ้าย */
       3px 0 0 0 #8d6e63,  /* ขอบขวา */
       0 -3px 0 0 #8d6e63, /* ขอบบน */
       0 3px 0 0 #8d6e63   /* ขอบล่าง */
    `,
                    imageRendering: 'pixelated'
                  }}
                >
                  <h3 className="font-bold text-[#5d4037] mb-2 font-pixel text-xs sm:text-sm uppercase tracking-wider">
                    Score Breakdown
                  </h3>
                  {/* ... (เนื้อหาข้างในเหมือนเดิม) ... */}
                  <div className="space-y-1 text-xs sm:text-sm font-mono text-[#5d4037]">
                    {/* ... */}
                    <div className="flex justify-between">
                      <span>Base Completion:</span>
                      <span>60</span>
                    </div>
                    {userProgressData.pattern_bonus_score > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span>Pattern Bonus:</span>
                        <span>+{userProgressData.pattern_bonus_score}</span>
                      </div>
                    )}
                    {finalScore?.testCaseBonus > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span>Test Case Bonus:</span>
                        <span>+{Math.round(finalScore.testCaseBonus)}</span>
                      </div>
                    )}
                    {finalScore?.bigOPenalty > 0 && (
                      <div className="flex justify-between text-red-600 font-bold">
                        <span>Big O Penalty:</span>
                        <span>-{finalScore.bigOPenalty}</span>
                      </div>
                    )}
                    <div className="border-t-2 border-[#8d6e63]/50 mt-2 pt-2 flex justify-between font-bold text-base text-[#2d1b0e]">
                      <span>Total Score:</span>
                      <span className="text-blue-700">{finalScore?.totalScore ?? userProgressData.best_score}</span>
                    </div>
                  </div>
                </div>


                {/* Rewards Section */}
                {checkingRewards && (
                  <div className="bg-yellow-100/80 border-2 border-yellow-500 p-3 rounded text-center">
                    <p className="text-yellow-800 text-xs animate-pulse">Checking Rewards...</p>
                  </div>
                )}

                {/* Rewards Section */}
                {awardedRewards.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-bold text-[#5d4037] mb-2 text-sm text-center font-pixel uppercase">

                    </h3>

                    {/* Container: แถบ 5 ช่อง (ใช้ reward.png เป็นพื้นหลัง) */}
                    <div
                      className="relative w-full max-w-[450px] mx-auto aspect-[5/1] grid grid-cols-5"
                      style={{
                        backgroundImage: "url('/reward.png')",
                        backgroundSize: '100% 100%', // ยืดเต็มกรอบ
                        imageRendering: 'pixelated',
                        backgroundRepeat: 'no-repeat'
                      }}
                    >
                      {/* Loop สร้าง 5 ช่อง (Fixed 5 Slots) */}
                      {Array.from({ length: 5 }).map((_, index) => {
                        const userReward = awardedRewards[index];
                        const item = userReward?.reward;
                        // Logic from InventoryTab: use frame5 or frame1
                        const itemImage = item?.frame5 || item?.frame1;
                        const imageUrl = itemImage ? (
                          itemImage.startsWith('http') ? itemImage : `${API_BASE_URL}${itemImage}`
                        ) : null;

                        return (
                          <div key={index} className="relative w-full h-full flex items-center justify-center p-0.5">

                            {userReward ? (
                              <div
                                className="w-full h-full flex items-center justify-center group relative bg-cover bg-center bg-no-repeat"
                                style={{
                                  backgroundImage: "url('/reward1cell.png')",
                                  imageRendering: 'pixelated'
                                }}
                              >
                                {imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt={item?.reward_name || 'Reward'}
                                    className="w-full h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform"
                                    style={{ imageRendering: 'pixelated' }}
                                    title={item?.reward_name}
                                  />
                                ) : (
                                  <span className="text-[#5d4037] font-bold text-[8px] sm:text-[10px] leading-tight text-center drop-shadow-sm px-1 break-words line-clamp-2">
                                    {item?.reward_name || 'Item'}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="w-full h-full" />
                            )}

                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}


              </div>
            </div>

            {/* === C. Footer Buttons (AGAIN / NEXT) === */}
            <div className="flex justify-center gap-4 shrink-0 pb-12 items-end">

              {/* ปุ่ม AGAIN */}
              <button
                onClick={handleNavigateAway}
                // ✅ ปรับขนาด: w-5/12 (กว้างเกือบครึ่ง) และ max-w จำกัดไม่ให้ใหญ่เกิน
                className="group relative w-5/12 max-w-[220px] transition-transform hover:scale-105 active:translate-y-1"
              >
                {/* 1. รูปหลัก (Base) */}
                <img
                  src="/button.png"
                  alt="Button Normal"
                  className="block w-full h-auto"
                  style={{ imageRendering: 'pixelated' }}
                />

                {/* 2. รูป Hover (Overlay) */}
                <img
                  src="/buttonhover.png"
                  alt="Button Hover"
                  className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-100"
                  style={{ imageRendering: 'pixelated' }}
                />

                {/* 3. Text */}
                <span className="absolute inset-0 flex items-center justify-center pb-1 text-[#fdf6e3] group-hover:text-white font-bold text-sm sm:text-lg drop-shadow-md font-pixel uppercase">
                  AGAIN
                </span>
              </button>

              {/* ปุ่ม NEXT (แสดงเฉพาะตอนชนะ) */}
              {gameResult === 'victory' && (
                <button
                  onClick={handleNavigateAway}
                  className="group relative w-5/12 max-w-[220px] transition-transform hover:scale-105 active:translate-y-1"
                >
                  {/* 1. รูปหลัก */}
                  <img
                    src="/button.png"
                    alt="Button Normal"
                    className="block w-full h-auto"
                    style={{ imageRendering: 'pixelated' }}
                  />

                  {/* 2. รูป Hover */}
                  <img
                    src="/buttonhover.png"
                    alt="Button Hover"
                    className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-100"
                    style={{ imageRendering: 'pixelated' }}
                  />

                  {/* 3. Text */}
                  <span className="absolute inset-0 flex items-center justify-center pb-1 text-[#fdf6e3] group-hover:text-white font-bold text-sm sm:text-lg drop-shadow-md font-pixel uppercase">
                    NEXT
                  </span>
                </button>
              )}

            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProgressModal;