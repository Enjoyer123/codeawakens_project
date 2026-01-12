import { useState, useCallback } from 'react';
import { saveUserProgress, checkAndAwardRewards } from '../../../services/profileService';

export const useProgressSaver = (getToken) => {
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success', 'error', null
  const [saveError, setSaveError] = useState(null);
  const [awardedRewards, setAwardedRewards] = useState([]);
  const [checkingRewards, setCheckingRewards] = useState(false);

  const saveProgress = useCallback(async ({
    levelData,
    gameResult,
    attempts,
    timeSpent,
    blocklyXml,
    textCodeContent,
    finalScore,
    hp_remaining,
    userBigO
  }) => {
    // Basic validation
    if (!getToken || !levelData || (!levelData.level_id && !levelData.id)) {
      console.warn('⚠️ Cannot save progress: Missing data', { hasToken: !!getToken, levelData });
      return;
    }

    setSaving(true);
    setSaveStatus(null);
    setSaveError(null);

    try {
      const progressData = {
        level_id: levelData.level_id || levelData.id,
        status: gameResult === 'victory' ? 'completed' : 'in_progress',
        attempts_count: attempts || 1,
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

      console.log('📝 Saving user progress...', progressData);
      
      const result = await saveUserProgress(getToken, progressData);
      console.log('✅ Save success:', result);
      setSaveStatus('success');

      // Check for rewards
      if (gameResult === 'victory') {
        setCheckingRewards(true);
        try {
          const totalScore = finalScore?.totalScore ?? (progressData.best_score + progressData.pattern_bonus_score);
          const rewardResult = await checkAndAwardRewards(
            getToken,
            levelData.level_id || levelData.id,
            totalScore
          );
          if (rewardResult?.awardedRewards?.length > 0) {
            setAwardedRewards(rewardResult.awardedRewards);
          }
        } catch (error) {
          console.error('Error checking rewards:', error);
        } finally {
          setCheckingRewards(false);
        }
      }

    } catch (error) {
      console.error('❌ Error saving user progress:', error);
      setSaveStatus('error');
      setSaveError(error.message || 'Failed to save progress');
    } finally {
      setSaving(false);
    }
  }, [getToken]);

  return {
    saving,
    saveStatus,
    saveError,
    awardedRewards,
    checkingRewards,
    saveProgress
  };
};
