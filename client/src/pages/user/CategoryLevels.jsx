// src/components/CategoryLevels.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

import { getLevelCategoryById } from '../../services/levelCategoryService';
import { fetchAllLevels } from '../../services/levelService';

const CategoryLevels = () => {
  const { getToken } = useAuth();
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const navigate = useNavigate();
  const { categoryId } = useParams();

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
        // กรองเฉพาะด่านที่ is_unlocked = true
        const unlockedLevels = derivedLevels.filter(level => level.is_unlocked === true);
        console.log('🔍 CategoryLevels - Total levels:', derivedLevels.length, 'Unlocked levels:', unlockedLevels.length);
        console.log('🔍 CategoryLevels - Levels is_unlocked values:', derivedLevels.map(l => ({ id: l.level_id, name: l.level_name, is_unlocked: l.is_unlocked })));
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

  const handleLevelSelect = (levelId) => {
    navigate(`/user/mapselection/${levelId}`);
  };

  const getDifficultyColor = (difficulty) => {
    console.log("Getting color for difficulty:", difficulty);
    switch (difficulty) {
      case 'ง่าย':
        return 'bg-gray-500';
      case 'ปานกลาง':
        return 'bg-gray-500';
      case 'ยาก':
        return 'bg-gray-500';
      case 'ยากมาก':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (categoryId) => {

  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">กำลังโหลดด่าน...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠</div>
          <p className="text-gray-700 text-lg mb-4">{error}</p>
          <button 
            onClick={() => setReloadKey((prev) => prev + 1)}
            className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded transition-colors"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  if (!categoryInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <p className="text-gray-700 text-lg mb-4">ไม่พบประเภทด่านที่ต้องการ</p>
          <button 
            onClick={() => navigate('/user/mapselect')}
            className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded transition-colors"
          >
            กลับไปเลือกประเภท
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        {/* Category Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="text-6xl mr-4">{getCategoryIcon(categoryInfo.category_id)}</div>
            <div>
              <h1 className="text-3xl font-light text-gray-800 mb-2">
                {categoryInfo.category_name}
              </h1>
              <p className="text-gray-500 text-lg">{categoryInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Levels Grid */}
        {levels.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl text-gray-600 mb-2">ยังไม่มีด่านในประเภทนี้</h3>
            <p className="text-gray-500 mb-6">ด่านจะถูกเพิ่มในอนาคต</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {levels.map((level) => (
              <div
                key={level.level_id}
                onClick={() => handleLevelSelect(level.level_id)}
                className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border border-gray-200"
              >
                {/* Level Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">{level.level_name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getDifficultyColor(level.difficulty || 'ปานกลาง')}`}>
                    {level.difficulty || 'ปานกลาง'}
                  </span>
                </div>

                {/* Level Info */}
                <div className="space-y-3">                 
                  {/* Level Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <div className="text-sm text-white">เงื่อนไขของด่านนี้</div>
                      <div className="text-white font-medium">Node {level.goal_node_id || 'N/A'}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-white">มอนสเตอร์</div>
                      <div className="text-white font-medium">
                        {level.monsters ? (Array.isArray(level.monsters) ? level.monsters.length : Object.keys(level.monsters).length) : 0} ตัว
                      </div>
                    </div>
                  </div>
                  
                </div>

                {/* Play Button */}
                <div className="mt-6 text-center">
                  <button className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors w-full">
                    เล่นด่าน
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="text-center mt-12 space-x-4">
          <button
            onClick={() => navigate('/user/mapselect')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg text-sm font-medium transition-colors"
          >
            กลับไปเลือกประเภท
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryLevels;
