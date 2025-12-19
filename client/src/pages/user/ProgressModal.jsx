import React, { useEffect, useState } from 'react';
import { saveUserProgress, checkAndAwardRewards } from '../../services/profileService';

const ProgressModal = ({ isOpen, onClose, gameResult, levelData, attempts, timeSpent, blocklyXml, textCodeContent, finalScore, hp_remaining, userBigO, getToken }) => {
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success', 'error', null
  const [saveError, setSaveError] = useState(null);
  const [awardedRewards, setAwardedRewards] = useState([]);
  const [checkingRewards, setCheckingRewards] = useState(false);

  // ข้อมูลที่จะบันทึกลง database
  const userProgressData = {
    level_id: levelData?.level_id || levelData?.id,
    status: gameResult === 'victory' ? 'completed' : 'in_progress',
    attempts_count: attempts || 0,
    blockly_code: blocklyXml || null,
    text_code: levelData?.textcode ? textCodeContent : null,
    execution_time: timeSpent || 0,
    best_score: finalScore?.totalScore ?? (gameResult === 'victory' ? 60 : 0),
    pattern_bonus_score: finalScore?.pattern_bonus_score || 0,
    is_correct: gameResult === 'victory',
    stars_earned: finalScore?.stars ?? (gameResult === 'victory' ? 3 : 0),
    hp_remaining: hp_remaining ?? 0,
    user_big_o: userBigO || null,
  };

  // บันทึกข้อมูลเมื่อ modal เปิด
  useEffect(() => {
    if (isOpen && getToken && (levelData?.level_id || levelData?.id)) {
      const saveProgress = async () => {
        setSaving(true);
        setSaveStatus(null);
        setSaveError(null);

        try {
          const progressData = {
            level_id: levelData?.level_id || levelData?.id,
            status: gameResult === 'victory' ? 'completed' : 'in_progress',
            attempts_count: attempts || 0,
            blockly_code: blocklyXml || null,
            text_code: levelData?.textcode ? textCodeContent : null,
            execution_time: timeSpent || 0,
            best_score: finalScore?.totalScore ?? (gameResult === 'victory' ? 60 : 0),
            pattern_bonus_score: finalScore?.pattern_bonus_score || 0,
            is_correct: gameResult === 'victory',
            stars_earned: finalScore?.stars ?? (gameResult === 'victory' ? 3 : 0),
            hp_remaining: hp_remaining ?? 0,
            user_big_o: userBigO || null,
          };

          await saveUserProgress(getToken, progressData);
          setSaveStatus('success');

          // Check and award rewards if player completed the level
          if (gameResult === 'victory') {
            setCheckingRewards(true);
            try {
              // Calculate total score (best_score + pattern_bonus_score)
              const totalScore = finalScore?.totalScore ?? (progressData.best_score + progressData.pattern_bonus_score);
              
              const rewardResult = await checkAndAwardRewards(
                getToken,
                levelData?.level_id || levelData?.id,
                totalScore
              );
              if (rewardResult.awardedRewards && rewardResult.awardedRewards.length > 0) {
                setAwardedRewards(rewardResult.awardedRewards);
              }
            } catch (error) {
              console.error('Error checking rewards:', error);
              // Don't show error to user, just log it
            } finally {
              setCheckingRewards(false);
            }
          }
        } catch (error) {
          console.error('Error saving user progress:', error);
          setSaveStatus('error');
          setSaveError(error.message || 'Failed to save progress');
        } finally {
          setSaving(false);
        }
      };

      saveProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // เรียกเมื่อ modal เปิดเท่านั้น เพื่อป้องกันการบันทึกซ้ำ

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      {/* Subtle backdrop with blur to match GuidePopup and LevelDetailViewer */}
      <div className="absolute inset-0 bg-black-900/5 backdrop-blur-sm transition-opacity duration-300" onClick={onClose} />

      <div className="relative bg-black p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto transform transition-all duration-300">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">
            {gameResult === 'victory' ? 'Victory Progress' : 'Game Over'}
          </h2>
          <div className="flex items-center gap-2">
            {saving && (
              <span className="text-yellow-400 text-sm">กำลังบันทึก...</span>
            )}
            {saveStatus === 'success' && (
              <span className="text-green-400 text-sm">✓ บันทึกสำเร็จ</span>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-400 text-sm">✗ บันทึกไม่สำเร็จ</span>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Level Info & Status */}
          <div className="bg-white p-4 rounded">
            <h3 className="font-bold text-gray-800 mb-2">Level Progress</h3>
            <div className="text-gray-600">
              <p>Level ID: {userProgressData.level_id}</p>
              <p>Status: {userProgressData.status}</p>
              <p>Correct Solution: {userProgressData.is_correct ? 'Yes' : 'No'}</p>
            </div>
          </div>

          {/* Score Details */}
          <div className="bg-white p-4 rounded">
            <h3 className="font-bold text-gray-800 mb-2">Score Details</h3>
            <div className="text-gray-600">
              <p>Stars: {'⭐'.repeat(userProgressData.stars_earned)}</p>
              <p>Score: {userProgressData.best_score}</p>
              <p>Pattern Bonus: {userProgressData.pattern_bonus_score}</p>
              <p>Total Score: {finalScore?.totalScore ?? (userProgressData.best_score + userProgressData.pattern_bonus_score)}</p>
            </div>
          </div>

          {/* Attempt Details */}
          <div className="bg-white p-4 rounded">
            <h3 className="font-bold text-gray-800 mb-2">Attempt Information</h3>
            <div className="text-gray-600">
              <p>Attempts: {userProgressData.attempts_count}</p>
              <p>Execution Time: {userProgressData.execution_time}s</p>
              <p>Last Attempt: {new Date().toLocaleString()}</p>
              {userProgressData.is_correct && (
                <p>Completed: {new Date().toLocaleString()}</p>
              )}
            </div>
          </div>

          {/* Code Details */}
          <div className="bg-white p-4 rounded">
            <h3 className="font-bold text-gray-800 mb-2">Code Information</h3>
            <div className="text-gray-600">
              <p>Text Mode: {levelData?.textcode ? 'Yes' : 'No'}</p>
              <p>HP Remaining: {userProgressData.hp_remaining}</p>
              
              {/* Blockly XML Preview */}
              <div className="mt-2">
                <p className="font-bold">Blockly XML:</p>
                <div className="bg-gray-950 text-gray-100 p-2 rounded mt-1 text-xs font-mono overflow-x-auto max-h-32 overflow-y-auto">
                  {userProgressData.blockly_code ? (
                    userProgressData.blockly_code.length > 100 
                      ? userProgressData.blockly_code.substring(0, 1000)
                      : userProgressData.blockly_code
                  ) : 'No Blockly code available'}
                </div>
              </div>
              
              {/* Text Code Preview (if available) */}
              {levelData?.textcode && userProgressData.text_code && (
                <div className="mt-2">
                  <p className="font-bold">Text Code:</p>
                  <div className="bg-gray-950 text-gray-100 p-2 rounded mt-1 text-xs font-mono overflow-x-auto max-h-32 overflow-y-auto">
                    {userProgressData.text_code.length > 100 
                      ? userProgressData.text_code.substring(0, 1000)
                      : userProgressData.text_code}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rewards Section */}
          {checkingRewards && (
            <div className="bg-yellow-900/50 border border-yellow-500 p-4 rounded">
              <p className="text-yellow-300 text-sm">กำลังตรวจสอบรางวัล...</p>
            </div>
          )}

          {awardedRewards.length > 0 && (
            <div className="bg-green-900/50 border border-green-500 p-4 rounded">
              <h3 className="font-bold text-green-400 mb-2">🎉 คุณได้รับรางวัล!</h3>
              <div className="space-y-2">
                {awardedRewards.map((userReward) => (
                  <div key={userReward.user_reward_id} className="text-green-300 text-sm">
                    <p className="font-semibold">✨ {userReward.reward?.reward_name || 'รางวัล'}</p>
                    {userReward.reward?.description && (
                      <p className="text-green-400 text-xs ml-2">{userReward.reward.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {saveStatus === 'error' && saveError && (
            <div className="bg-red-900/50 border border-red-500 p-4 rounded">
              <h3 className="font-bold text-red-400 mb-2">Error Saving Progress</h3>
              <p className="text-red-300 text-sm">{saveError}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProgressModal;