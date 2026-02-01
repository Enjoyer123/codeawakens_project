import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { saveUserProgress, checkAndAwardRewards } from '../../../services/profileService';

export const useProgressSaver = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [saveStatus, setSaveStatus] = useState(null); // 'success', 'error', null
  const [awardedRewards, setAwardedRewards] = useState([]);
  const [checkingRewards, setCheckingRewards] = useState(false);

  const mutation = useMutation({
    mutationFn: async (vars) => {
      const { levelData, gameResult, attempts, timeSpent, blocklyXml, textCodeContent, finalScore, hp_remaining, userBigO } = vars;
      if (!getToken || !levelData || (!levelData.level_id && !levelData.id)) {
        throw new Error('Missing data');
      }

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

      let rewards = [];
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
            rewards = rewardResult.awardedRewards;
          }
        } catch (e) {
          console.error('Error checking rewards:', e);
        } finally {
          setCheckingRewards(false);
        }
      }
      return { result, rewards };
    },
    onSuccess: (data) => {
      console.log('✅ Save success:', data.result);
      setSaveStatus('success');
      setAwardedRewards(data.rewards);

      // Invalidate user profile to update progress across the app
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      // Also invalidate levels if completion status is stored there (it usually is in user_progress which is in profile)
    },
    onError: (error) => {
      console.error('❌ Error saving user progress:', error);
      setSaveStatus('error');
    }
  });

  const saveProgress = useCallback((data) => {
    setSaveStatus(null);
    setAwardedRewards([]);
    mutation.mutate(data);
  }, [mutation]);

  return {
    saving: mutation.isPending,
    saveStatus,
    saveError: mutation.error?.message || null,
    awardedRewards,
    checkingRewards,
    saveProgress
  };
};
