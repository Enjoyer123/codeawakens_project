import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

import { useCategoryData } from './hooks/useCategoryData';
import LevelCard from '../../components/user/LevelCard';

const CategoryLevels = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const [reloadKey, setReloadKey] = useState(0);

  const { levels, categoryInfo, loading, error } = useCategoryData(getToken, categoryId, reloadKey);

  const handleLevelSelect = (levelId) => {
    if (levelId === 'train-schedule') {
      navigate('/user/train-schedule');
      return;
    }
    navigate(`/user/mapselection/${levelId}`);
  };

  const getCategoryIcon = (id) => {
      // Placeholder or can use mapping if needed, currently empty in original code
      return null; 
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
              <LevelCard 
                key={level.level_id} 
                level={level} 
                onClick={handleLevelSelect} 
              />
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
