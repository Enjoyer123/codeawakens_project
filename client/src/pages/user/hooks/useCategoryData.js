import { useState, useEffect } from 'react';
import { getLevelCategoryById } from '../../../services/levelCategoryService';
import { fetchAllLevels } from '../../../services/levelService';

export const useCategoryData = (getToken, categoryId, reloadKey) => {
  const [levels, setLevels] = useState([]);
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true;

    const loadCategoryData = async () => {
      if (!categoryId) {
        if (isActive) {
          setCategoryInfo(null);
          setLevels([]);
          setLoading(false);
        }
        return;
      }

      try {
        if (isActive) {
          setLoading(true);
          setError(null);
        }

        const categoryResponse = await getLevelCategoryById(getToken, categoryId);
        const categoryData =
          categoryResponse?.levelCategory ||
          categoryResponse?.data?.levelCategory ||
          categoryResponse;

        if (!categoryData) {
          throw new Error('ไม่พบประเภทด่านที่ต้องการ');
        }

        let derivedLevels = Array.isArray(categoryData.levels) ? categoryData.levels : [];

        // If no levels directly in category response, fetch all and filter (fallback)
        if (derivedLevels.length === 0) {
          const levelResponse = await fetchAllLevels(getToken, 1, 1000);
          const allLevels = levelResponse?.levels || [];
          derivedLevels = allLevels.filter(
            (level) =>
              level.category?.category_id === categoryData.category_id ||
              level.category_id === categoryData.category_id
          );
        }

        if (!isActive) return;
        setCategoryInfo(categoryData);

        // Use all levels returned by server (server handles visibility and locking)
        const unlockedLevels = derivedLevels;

        // Manual Injection for Greedy Category (Legacy Logic)
        if (categoryData.category_name === 'Greedy' || categoryId === '4' || categoryData.category_id === 4) {
          // check if specifically not already there
          if (!unlockedLevels.find(l => l.level_id === 'train-schedule')) {
            unlockedLevels.push({
              level_id: 'train-schedule',
              level_name: 'Train Scheduling (Interval Partitioning)',
              difficulty: 'ปานกลาง',
              is_unlocked: true,
              description: 'Manage train platforms using Greedy Algorithm',
              goal_node_id: 'Optimize Platforms',
              monsters: [],
              category_id: 4 // Ensure it matches
            });
          }
        }

        console.log('🔍 CategoryLevels - Levels loaded:', unlockedLevels.length);
        setLevels(unlockedLevels);
      } catch (err) {
        if (!isActive) return;
        console.error('Error loading category data:', err);
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + (err?.message || 'ไม่ทราบสาเหตุ'));
        setCategoryInfo(null);
        setLevels([]);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadCategoryData();

    return () => {
      isActive = false;
    };
  }, [categoryId, getToken, reloadKey]);

  return { levels, categoryInfo, loading, error };
};
