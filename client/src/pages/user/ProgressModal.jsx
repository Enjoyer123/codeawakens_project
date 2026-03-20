import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useSaveUserProgress, useCheckRewards } from '../../services/hooks/useProfile';
import { API_BASE_URL } from '../../config/apiConfig';
import confetti from 'canvas-confetti';

// ─── Sub-components ────────────────────────────────────────────

/** Pixel-art button used for AGAIN / HOME */
const PixelButton = ({ label, onClick }) => (
  <button
    onClick={onClick}
    className="group relative w-5/12 max-w-[220px] transition-transform hover:scale-105 active:translate-y-1"
  >
    <img src="/button.png" alt={label} className="block w-full h-auto" style={{ imageRendering: 'pixelated' }} />
    <img
      src="/buttonhover.png" alt=""
      className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-100"
      style={{ imageRendering: 'pixelated' }}
    />
    <span className="absolute inset-0 flex items-center justify-center pb-1 text-[#fdf6e3] group-hover:text-white font-bold text-sm sm:text-lg drop-shadow-md font-pixel uppercase">
      {label}
    </span>
  </button>
);

/** 5-slot reward strip */
const RewardSlots = ({ rewards }) => (
  <div className="mt-6">
    <h3 className="font-bold text-[#5d4037] mb-2 text-sm text-center font-pixel uppercase">Rewards</h3>
    <div
      className="relative w-full max-w-[450px] mx-auto aspect-[5/1] grid grid-cols-5"
      style={{
        backgroundImage: "url('/reward.png')",
        backgroundSize: '100% 100%',
        imageRendering: 'pixelated',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const item = rewards[i]?.reward;
        const img = item?.frame5 || item?.frame1;
        const url = img ? (img.startsWith('http') ? img : `${API_BASE_URL}${img}`) : null;

        return (
          <div key={i} className="relative w-full h-full flex items-center justify-center p-0.5">
            {rewards[i] ? (
              <div
                className="w-full h-full flex items-center justify-center group relative bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/reward1cell.png')", imageRendering: 'pixelated' }}
              >
                {url ? (
                  <img
                    src={url} alt={item?.reward_name || 'Reward'}
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
);

// ─── Main Component ────────────────────────────────────────────

const ProgressModal = ({ isOpen, onClose, gameResult, levelData, blocklyXml, textCodeContent, finalScore, hp_remaining, getToken, userBigO }) => {
  const navigate = useNavigate();
  const isVictory = gameResult === 'victory';

  // Service hooks — no custom wrapper needed
  const saveMutation = useSaveUserProgress();
  const rewardMutation = useCheckRewards();

  const [awardedRewards, setAwardedRewards] = useState([]);

  // Derived values for display
  const stars = finalScore?.stars ?? (isVictory ? 3 : 0);
  const totalScore = finalScore?.totalScore ?? (isVictory ? 60 : 0);
  const patternBonus = finalScore?.pattern_bonus_score || 0;

  // Save + check rewards when modal opens
  useEffect(() => {
    if (!isOpen || !getToken || saveMutation.isPending || saveMutation.isSuccess || saveMutation.isError) return;
    const levelId = levelData?.level_id || levelData?.id;
    if (!levelId) return;

    const progressData = {
      level_id: levelId,
      status: isVictory ? 'completed' : 'in_progress',
      attempts_count: 1,
      blockly_code: blocklyXml || null,
      text_code: levelData?.textcode ? textCodeContent : null,
      best_score: totalScore,
      pattern_bonus_score: patternBonus,
      is_correct: isVictory,
      stars_earned: stars,
      hp_remaining: hp_remaining ?? 0,
      user_big_o: userBigO || null,
    };

    console.log('📝 Saving user progress...', progressData);
    saveMutation.mutate(progressData, {
      onSuccess: () => {
        console.log('✅ Save success');
        if (!isVictory) return;
        rewardMutation.mutate({ levelId, totalScore }, {
          onSuccess: (data) => {
            if (data?.awardedRewards?.length > 0) setAwardedRewards(data.awardedRewards);
          },
          onError: (e) => console.error('Error checking rewards:', e),
        });
      },
      onError: (e) => console.error('❌ Error saving:', e),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, levelData, getToken, gameResult]);

  // 🎊 Victory Confetti!
  useEffect(() => {
    if (!isOpen || !isVictory) return;
    // Burst 1: Center explosion
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    // Burst 2: Left side
    setTimeout(() => confetti({ particleCount: 40, angle: 60, spread: 55, origin: { x: 0, y: 0.65 } }), 250);
    // Burst 3: Right side
    setTimeout(() => confetti({ particleCount: 40, angle: 120, spread: 55, origin: { x: 1, y: 0.65 } }), 400);
  }, [isOpen, isVictory]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 bg-transparent border-0 shadow-none overflow-visible" hideCloseButton>
        <div className="relative w-full shadow-2xl transform transition-all duration-300">

          {/* Background frame */}
          <img src="/scoreccl1.png" alt="Score Board" className="w-full h-auto block select-none" style={{ imageRendering: 'pixelated' }} />

          {/* Content overlay */}
          <div className="absolute inset-0 flex flex-col px-[8%] pt-[6%] pb-[8%]">

            {/* Header */}
            <div className="flex justify-between items-start h-[10%] shrink-0">
              <h2
                className="text-[#2d1b0e] font-bold drop-shadow-sm uppercase"
                style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 'clamp(12px, 2.5vw, 24px)' }}
              >
                {isVictory ? 'VICTORY' : 'GAME OVER'}
              </h2>
              <button onClick={() => { onClose(); navigate('/user/mapselect'); }} className="text-[#5d4037] hover:text-red-600 hover:scale-110 transition-transform font-bold text-xl">
                X
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="space-y-4">

                {/* Stars */}
                <div className="flex justify-center py-2">
                  <img
                    src={!isVictory ? '/star0.png' : `/star${stars}.png`}
                    alt="Rank Stars"
                    className="h-20 sm:h-30 object-contain drop-shadow-md animate-bounce-slow"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>

                {/* Score breakdown */}
                <div
                  className="bg-[#fdf6e3]/90 p-4 mx-2 my-8"
                  style={{
                    boxShadow: '-3px 0 0 0 #8d6e63, 3px 0 0 0 #8d6e63, 0 -3px 0 0 #8d6e63, 0 3px 0 0 #8d6e63',
                    imageRendering: 'pixelated'
                  }}
                >
                  <h3 className="font-bold text-[#5d4037] mb-2 font-pixel text-xs sm:text-sm uppercase tracking-wider">Score Breakdown</h3>
                  <div className="space-y-1 text-xs sm:text-sm font-mono text-[#5d4037]">
                    <div className="flex justify-between"><span>Base Completion:</span><span>60</span></div>

                    {userBigO && (
                      <div className="flex justify-between text-[#8d6e63] italic">
                        <span>Selected Big O:</span>
                        <span className="font-mono font-bold px-1 rounded-sm">{userBigO}</span>
                      </div>
                    )}

                    {patternBonus > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span>Pattern Bonus:</span><span>+{patternBonus}</span>
                      </div>
                    )}

                    {finalScore?.bigOPenalty > 0 && (
                      <div className="flex justify-between text-red-600 font-bold">
                        <span>Big O Penalty:</span><span>-{finalScore.bigOPenalty}</span>
                      </div>
                    )}

                    <div className="border-t-2 border-[#8d6e63]/50 mt-2 pt-2 flex justify-between font-bold text-base text-[#2d1b0e]">
                      <span>Total Score:</span>
                      <span className="text-blue-700">{totalScore}</span>
                    </div>
                  </div>
                </div>

                {/* Rewards */}
                {rewardMutation.isPending && (
                  <div className="bg-yellow-100/80 border-2 border-yellow-500 p-3 rounded text-center">
                    <p className="text-yellow-800 text-xs animate-pulse">Checking Rewards...</p>
                  </div>
                )}
                {awardedRewards.length > 0 && <RewardSlots rewards={awardedRewards} />}

              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex justify-center gap-4 shrink-0 pb-12 items-end">
              <PixelButton label="AGAIN" onClick={() => window.location.reload()} />
              <PixelButton label="HOME" onClick={() => navigate('/user/mapselect')} />
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProgressModal;