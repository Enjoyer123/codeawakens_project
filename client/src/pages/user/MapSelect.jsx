import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import useUserStore from '../../store/useUserStore';

import { useLevelCategories } from '../../services/hooks/useLevelCategories';
import { useProfile } from '../../services/hooks/useProfile';
import MapCoordinatePicker from '../../components/tools/MapCoordinatePicker';
import PageLoader from '../../components/shared/Loading/PageLoader';
import PageError from '../../components/shared/Error/PageError';



const MapSelect = () => {
  const { getToken } = useAuth();
  const { role, preScore } = useUserStore();
  const navigate = useNavigate();
  const [showDevTool, setShowDevTool] = useState(false);

  // Check if user needs pre-test
  // Use direct profile fetch to adhere to backend data, preventing store race conditions on refresh
  const { data: userProfile, isLoading: isProfileLoading } = useProfile();

  // Prefer backend score if available (even if store is not yet synced)
  const backendPreScore = userProfile?.user?.pre_score;
  const effectivePreScore = (backendPreScore !== undefined && backendPreScore !== null)
    ? backendPreScore
    : preScore;

  // Only block if we are NOT loading and we are sure score is missing
  const isPretestRequired = role === 'user' && !isProfileLoading && (effectivePreScore === null || effectivePreScore === undefined);

  // Use TanStack Query
  const {
    data: categoriesData,
    isLoading: loading,
    isError,
    error: queryError
  } = useLevelCategories();

  if (isError) {
    return <PageError message={queryError?.message} title="Failed to fetch categories" />;
  }

  const categories = categoriesData?.levelCategories || [];


  const handleCategorySelect = (categoryId) => {
    // ไปหน้าแสดงด่านในประเภทที่เลือก
    navigate(`/user/mapselect/${categoryId}`);
  };

  const getCategoryCount = (category) => {
    // หาจำนวนด่านจากข้อมูลที่ได้รับจาก API

    // ตรวจสอบว่ามี levels array หรือไม่
    if (Array.isArray(category.levels)) {
      // นับเฉพาะด่านที่ unlock แล้ว
      return category.levels.filter(level => level.is_unlocked === true).length;
    }

    // ถ้ามี level_count ให้ใช้
    if (category.level_count !== undefined && category.level_count !== null) {
      const count = parseInt(category.level_count);
      return isNaN(count) ? 0 : count;
    }

    return 0;
  };

  if (showDevTool) {
    return (
      <div className="min-h-screen bg-white relative">
        <button
          onClick={() => setShowDevTool(false)}
          className="fixed top-4 right-4 z-50 bg-red-600 text-white px-4 py-2 rounded shadow-lg font-bold hover:bg-red-700 transition"
        >
          Close Map Picker
        </button>
        <MapCoordinatePicker
          data={categories} // Pass existing fetched data
          idKey="category_id"
          nameKey="category_name"
          saveType="category"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-900 relative overflow-hidden flex flex-col justify-center lg:h-screen lg:w-full lg:block">
      {role === 'admin' && (
        <button
          onClick={() => setShowDevTool(true)}
          className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white px-3 py-1 text-xs rounded shadow hover:bg-gray-700 transition opacity-50 hover:opacity-100"
        >
          Open Coordinate Picker
        </button>
      )}

      {/* Map Container */}
      {!loading && (
        <div className="relative w-full max-w-5xl mx-auto shadow-2xl lg:shadow-none lg:max-w-none lg:mx-0 lg:w-full lg:h-full">
          <img
            src="/map.jpg"
            alt="World Map"
            className="w-full h-auto object-contain lg:w-full lg:h-full lg:object-fill block"
          />

          {/* Category Nodes */}
          {/* Category Nodes */}
          {categories.map((category) => {
            // Use coordinates from DB
            const position = category.coordinates;
            const count = getCategoryCount(category);

            if (!position) return null;

            return (
              <div
                key={category.category_id}
                onClick={() => handleCategorySelect(category.category_id)}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{ left: `${position.left}%`, top: `${position.top}%` }}
              >
                {/* Node Container (Interactive Dot with Label) */}
                <div className="relative flex flex-col items-center justify-center transition-all duration-300">
                  {/* Expanding Info Pill (Visible BY DEFAULT) */}
                  <div className="mb-1.5 opacity-100 scale-100 transition-all duration-200 ease-out z-20">
                    <div className="px-2 py-0.5 bg-[#0f111a]/90 border border-[#7048e8]/60 shadow-[0_2px_8px_rgba(0,0,0,0.5)] rounded flex items-center gap-1.5 whitespace-nowrap group-hover:border-[#7048e8] group-hover:shadow-[0_0_12px_rgba(112,72,232,0.4)] group-hover:bg-[#0f111a]">
                      <span className="text-[#e0e7ff] font-bold text-[9px] md:text-xs tracking-wide">
                        {category.category_name}
                      </span>
                      {count > 0 && (
                        <span className="bg-[#7048e8]/80 text-white text-[8px] md:text-[10px] font-bold px-1.5 py-0.2 rounded-sm group-hover:bg-[#7048e8]">
                          {count}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* The actual Dot on the map */}
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-[#7048e8] rounded-full border border-white/40 shadow-[0_0_8px_rgba(112,72,232,0.6)] z-10 animate-pulse group-hover:animate-none group-hover:scale-110 transition-transform" />

                  {/* Subtle Glow under the dot */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-[#7048e8]/10 rounded-full blur-md -z-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fallback for categories without positions */}
      {!loading && categories.some(c => !c.coordinates) && (
        <div className="p-4 bg-gray-100/90 backdrop-blur-sm grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          <div className="col-span-full text-sm text-gray-600 font-bold mb-2 uppercase tracking-wider">Other Categories</div>
          {categories.filter(c => !c.coordinates).map(category => (
            <div key={category.category_id} onClick={() => handleCategorySelect(category.category_id)} className="bg-white p-3 rounded shadow cursor-pointer hover:bg-gray-50 flex items-center gap-2 border border-gray-200">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">{category.category_id}</div>
              <div className="text-sm truncate font-medium">{category.name}</div>
            </div>
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <PageLoader message="Loading map..." />
      )}

      {/* No Data State */}
      {!loading && categories.length === 0 && (
        <div className="w-full h-screen flex items-center justify-center bg-gray-100">
          <p className="text-gray-600 font-medium">ไม่พบข้อมูลประเภทด่าน</p>
        </div>
      )}
      {/* Pretest Requirement Alert - Blocking Overlay */}
      {isPretestRequired && !loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center border-4 border-yellow-400">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">⚠️</span>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2 font-pixel">
              กรุณาทำแบบทดสอบ
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              คุณยังไม่มีคะแนน Pre-test<br />
              โปรดทำแบบทดสอบก่อนเข้าเล่นเกม
            </p>

            <button
              onClick={() => navigate('/test/pre')}
              className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-white font-bold text-xl rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95 font-pixel border-b-4 border-yellow-700"
            >
              ทำแบบทดสอบ Pretest
            </button>
          </div>
        </div>
      )}

    </div>
  );
};


export default MapSelect;
