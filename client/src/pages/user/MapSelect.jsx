import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import useUserStore from '../../store/useUserStore';
import { playSound, playBGM, stopBGM } from '../../gameutils/sound/soundManager';

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

  // Handle BGM
  useEffect(() => {
    playBGM('map');
    return () => stopBGM();
  }, []);

  if (isError) {
    return <PageError message={queryError?.message} title="Failed to fetch categories" />;
  }

  const categories = categoriesData?.levelCategories || [];


  const handleCategorySelect = (categoryId) => {
    playSound('select_map');
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

  const getUnplayedLevelsCount = (category) => {
    if (!Array.isArray(category.levels)) return 0;
    const progressList = userProfile?.user_progress || [];
    
    return category.levels.filter(level => {
      const isLocked = level.is_locked || !level.is_unlocked;
      if (isLocked) return false;
      const progress = progressList.find(p => String(p.level_id) === String(level.level_id));
      return !progress || progress.status !== 'completed';
    }).length;
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
            const unplayedCount = getUnplayedLevelsCount(category);
            
            // Category is locked if it has levels AND every level is locked for this user
            const hasLevels = Array.isArray(category.levels) && category.levels.length > 0;
            const isLocked = !hasLevels || category.levels.every(level => level.is_locked === true || !level.is_unlocked);
            if (!position) return null;

            return (
              <div
                key={category.category_id}
                onClick={() => !isLocked && handleCategorySelect(category.category_id)}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer group'}`}
                style={{ left: `${position.left}%`, top: `${position.top}%` }}
                title={isLocked ? 'ต้องผ่านด่านก่อนหน้าก่อน' : ''}
              >
                {/* Node Container (Interactive Dot with Label) */}
                <div className="relative flex flex-col items-center justify-center transition-all duration-300">
                  {/* Expanding Info Pill (Visible BY DEFAULT) */}
                  <div className="mb-1.5 opacity-100 scale-100 transition-all duration-200 ease-out z-20">
                    <div className={`px-2 py-0.5 border shadow-[0_2px_8px_rgba(0,0,0,0.5)] rounded flex items-center gap-1.5 whitespace-nowrap ${isLocked
                      ? 'bg-gray-800/90 border-gray-600/60 shadow-none'
                      : 'bg-[#0f111a]/90 border-[#7048e8]/60 group-hover:border-[#7048e8] group-hover:shadow-[0_0_12px_rgba(112,72,232,0.4)] group-hover:bg-[#0f111a]'
                      }`}>
                      <span className={`font-bold text-[9px] md:text-xs tracking-wide ${isLocked ? 'text-gray-400' : 'text-[#e0e7ff]'}`}>
                        {category.category_name}
                      </span>
                      {isLocked ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <div className="flex gap-1 items-center">
                          {unplayedCount > 0 && (
                            <span className="bg-red-500 animate-pulse text-white text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded-sm shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                              {unplayedCount} New
                            </span>
                          )}
                          {category.levels?.some(l => l.required_for_post_test) && (
                            <span className="bg-amber-500/90 text-white text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded-sm shadow-sm flex items-center gap-0.5" title="หมวดหมู่นี้มีด่านสำคัญสำหรับ Post-test">
                              <span className="text-[10px]">⭐</span> Post-Test
                            </span>
                          )}
                          {count > 0 && (
                            <span className="bg-[#7048e8]/80 text-white text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-sm group-hover:bg-[#7048e8]">
                              {count}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* The actual Dot on the map */}
                  <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full border border-white/40 z-10 transition-transform ${isLocked
                    ? 'bg-gray-600 shadow-none'
                    : 'bg-[#7048e8] shadow-[0_0_8px_rgba(112,72,232,0.6)] animate-pulse group-hover:animate-none group-hover:scale-110'
                    }`} />

                  {/* Subtle Glow under the dot (Only if unlocked) */}
                  {!isLocked && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-[#7048e8]/10 rounded-full blur-md -z-1" />
                  )}
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
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md border border-gray-100 transform transition-all">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-[#7048e8]/10 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#7048e8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">แจ้งเตือนจากระบบ</h2>
              <div className="text-base text-gray-600 mb-8 space-y-2">
                <p>คุณยังไม่ได้ทำแบบทดสอบก่อนเรียน (Pre-test)</p>
                <p>กรุณาทำแบบทดสอบก่อนเข้าสู่ระบบแผนที่</p>
              </div>
              <button
                onClick={() => navigate('/test/pre')}
                className="w-full inline-flex justify-center items-center px-6 py-3 bg-[#7048e8] text-white text-lg font-bold rounded-lg hover:bg-[#5b37cc] focus:outline-none focus:ring-4 focus:ring-[#7048e8]/30 transition-all shadow-md active:scale-[0.98]"
              >
                เริ่มทำแบบทดสอบ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};


export default MapSelect;
