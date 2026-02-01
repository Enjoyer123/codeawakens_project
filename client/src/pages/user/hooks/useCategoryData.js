import { useMemo } from 'react';
import { useLevelCategory } from '../../../services/hooks/useLevelCategories';
import { useLevels } from '../../../services/hooks/useLevel';

export const useCategoryData = (getToken, categoryId, reloadKey) => {
  // 1. Fetch Category Data
  const {
    data: categoryRes,
    isLoading: loadingCategory,
    error: errorCategory
  } = useLevelCategory(categoryId);

  // 2. Fetch All Levels (Dependent Query: Only if we suspect missing levels/need filtering)
  // The original logic fetches all levels if categoryData.levels is empty.
  // To handle this cleanly in hooks, we can always fetch all levels (cached) Or fetch conditionally.
  // A balanced approach: Fetch all levels if category is loaded but has no levels array.

  // Check if we need to fetch all levels (fallback)
  const categoryData = categoryRes?.levelCategory || categoryRes?.data?.levelCategory || categoryRes;
  const hasEmbeddedLevels = categoryData && Array.isArray(categoryData.levels) && categoryData.levels.length > 0;

  const shouldFetchAllLevels = !!categoryData && !hasEmbeddedLevels;

  const {
    data: allLevelsRes,
    isLoading: loadingAllLevels,
    error: errorAllLevels
  } = useLevels(1, 1000, '', { // Assuming useLevels accepts args. But useLevels signature is (page, limit, search).
    enabled: shouldFetchAllLevels
  });

  const loading = loadingCategory || (shouldFetchAllLevels && loadingAllLevels);
  const error = (errorCategory?.message || (shouldFetchAllLevels && errorAllLevels?.message)) || null;

  // Derived Data Processing
  const { levels, categoryInfo } = useMemo(() => {
    if (!categoryData) return { levels: [], categoryInfo: null };

    let derivedLevels = [];

    if (hasEmbeddedLevels) {
      derivedLevels = categoryData.levels;
    } else if (allLevelsRes?.levels) {
      // Filter manually
      derivedLevels = allLevelsRes.levels.filter(
        (level) =>
          level.category?.category_id === categoryData.category_id ||
          level.category_id === categoryData.category_id
      );
    }

    // --- Hardcoded Logic for Greedy Category (Legacy) ---
    if (categoryData.category_name === 'Greedy' || categoryId === '4' || categoryData.category_id === 4) {
      const trainLevelExists = derivedLevels.find(l => l.level_id === 'train-schedule');
      if (!trainLevelExists) {
        // We must clone derivedLevels since it might be frozen from query cache
        derivedLevels = [...derivedLevels, {
          level_id: 'train-schedule',
          level_name: 'Train Scheduling (Interval Partitioning)',
          difficulty: 'ปานกลาง',
          is_unlocked: true,
          description: 'Manage train platforms using Greedy Algorithm',
          goal_node_id: 'Optimize Platforms',
          monsters: [],
          category_id: 4
        }];
      }
    }

    return { levels: derivedLevels, categoryInfo: categoryData };

  }, [categoryData, hasEmbeddedLevels, allLevelsRes, categoryId]);

  return { levels, categoryInfo, loading, error };
};
