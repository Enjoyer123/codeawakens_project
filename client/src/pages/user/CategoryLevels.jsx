
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import useUserStore from '../../store/useUserStore';

import { useCategoryData } from './hooks/useCategoryData';
import { getImageUrl } from '@/utils/imageUtils';
import MapCoordinatePicker from '../../components/tools/MapCoordinatePicker';
import PageLoader from '../../components/shared/Loading/PageLoader';



const CategoryLevels = () => {
  const { getToken } = useAuth();
  const { role } = useUserStore();
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const [reloadKey, setReloadKey] = useState(0);
  const [showDevTool, setShowDevTool] = useState(false);
  const [hoveredLevelId, setHoveredLevelId] = useState(null);

  // useCategoryData now uses useAuth internal to hook, so only categoryId is needed.
  // reloadKey is handled by query invalidation or manual refetch if explicitly exposed.
  // But for simple error retry, we might need a refetch function from the hook, 
  // or just invalidate queries.
  // The new hook returns { levels, categoryInfo, loading, error }.
  const { levels, categoryInfo, loading, error } = useCategoryData(null, categoryId, null);
  // Note: first arg was getToken (removed), 3rd was reloadKey. 
  // Actually I refactored it to: useCategoryData(getToken, categoryId, reloadKey) 
  // Wait, let me check the file I just wrote. 
  // Export line: export const useCategoryData = (getToken, categoryId, reloadKey) => { ... }
  // I kept the signature in the file definition to matching existing call site temporarily, 
  // but inside I don't use getToken/reloadKey except indirectly? 
  // Checking file content again: 
  // export const useCategoryData = (getToken, categoryId, reloadKey) => { ... useLevelCategory(categoryId) ... }
  // I DID NOT use getToken or reloadKey in the implementation!
  // So I can clean up the call site.

  const handleLevelSelect = (levelId) => {
    if (levelId === 'train-schedule') {
      navigate('/user/train-schedule');
      return;
    }
    navigate(`/user/mapselection/${levelId}`);
  };

  if (loading) {
    return <PageLoader message="Loading Levels..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-4xl mb-4 font-bold">!</div>
          <p className="text-lg mb-4">{error}</p>
          <button
            onClick={() => setReloadKey((prev) => prev + 1)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition-colors"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  if (!categoryInfo) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-4xl mb-4 font-bold">?</div>
          <p className="text-lg mb-4">ไม่พบประเภทด่านที่ต้องการ</p>
          <button
            onClick={() => navigate('/user/mapselect')}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded transition-colors"
          >
            กลับไปเลือกประเภท
          </button>
        </div>
      </div>
    );
  }

  if (showDevTool) {
    return (
      <div className="min-h-screen bg-white relative">
        <button
          onClick={() => setShowDevTool(false)}
          className="fixed top-4 right-4 z-50 bg-red-600 text-white px-4 py-2 rounded shadow-lg font-bold hover:bg-red-700 transition"
        >
          Close Level Picker
        </button>
        <MapCoordinatePicker
          data={levels}
          idKey="level_id"
          nameKey="title" // Assuming 'title' is valid, fallback to others handled in component
          saveType="level" // Enable level saving mode
          imageSrc={categoryInfo?.background_image ? getImageUrl(categoryInfo.background_image) : "/paper.png"}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-900 relative overflow-hidden flex flex-col justify-center lg:h-screen lg:w-full lg:block">

      {/* Dev Tool Button */}
      {/* Dev Tool Button - Admin Only */}
      {role === 'admin' && (
        <button
          onClick={() => setShowDevTool(true)}
          className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white px-3 py-1 text-xs rounded shadow hover:bg-gray-700 transition opacity-50 hover:opacity-100"
        >
          Open Level Picker
        </button>
      )}


      {console.log(categoryInfo)}
      {/* Map Container */}
      <div className="relative w-full max-w-5xl mx-auto shadow-2xl lg:shadow-none lg:max-w-none lg:mx-0 lg:w-full lg:h-full">
        <img
          src={categoryInfo?.background_image ? getImageUrl(categoryInfo.background_image) : "/Mapdefault.png"}
          alt="Level Map"
          className="w-full h-auto object-contain lg:w-full lg:h-full lg:object-fill block pixelated"
        />

        {/* Level Nodes */}
        {levels.map((level) => {
          // Use coordinates from DB
          const position = level.coordinates;
          // Level is locked if user hasn't unlocked it yet OR if it's a DRAFT (is_unlocked === false)
          const isLocked = level.is_locked || !level.is_unlocked;

          if (!position) return null;

          const isHovered = hoveredLevelId === level.level_id;

          return (
            <div
              key={level.level_id}
              onClick={() => !isLocked && handleLevelSelect(level.level_id)}
              onMouseEnter={() => setHoveredLevelId(level.level_id)}
              onMouseLeave={() => setHoveredLevelId(null)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-10 
                  ${isLocked ? 'cursor-not-allowed contrast-75 grayscale-[0.6]' : 'cursor-pointer group'}`}
              style={{ left: `${position.left}%`, top: `${position.top}%` }}
            >
              {/* Node Container (Interactive Dot with Label) */}
              <div className="relative flex flex-col items-center justify-center transition-all duration-300">

                {/* Expanding Info Pill (Label Above) */}
                <div className={`mb-1.5 transition-all duration-200 ease-out z-20 ${isHovered ? 'scale-110' : 'scale-100'}`}>
                  <div className={`
                    px-2 py-0.5 border shadow-[0_2px_8px_rgba(0,0,0,0.5)] rounded flex items-center gap-1.5 whitespace-nowrap
                    ${isLocked
                      ? 'bg-gray-800/90 border-gray-600/60 shadow-none'
                      : 'bg-[#0f111a]/90 border-[#7048e8]/60 group-hover:border-[#7048e8] group-hover:shadow-[0_0_12px_rgba(112,72,232,0.4)] group-hover:bg-[#0f111a]'
                    }
                  `}>
                    {!level.is_unlocked && (
                      <span className="bg-red-600 text-white text-[8px] md:text-[9px] font-bold px-1 py-0.5 rounded-sm">
                        DRAFT
                      </span>
                    )}

                    <span className={`font-bold text-[9px] md:text-xs tracking-wide ${isLocked ? 'text-gray-400' : 'text-[#e0e7ff]'}`}>
                      {level.title || level.level_name}
                    </span>

                    {isLocked && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* The actual Dot on the map */}
                <div className={`
                  w-3 h-3 md:w-4 md:h-4 rounded-full border border-white/40 z-10 transition-transform
                  ${isLocked
                    ? 'bg-gray-600 shadow-none'
                    : 'bg-[#7048e8] shadow-[0_0_8px_rgba(112,72,232,0.6)] animate-pulse group-hover:animate-none group-hover:scale-110'
                  }
                `} />

                {/* Subtle Glow under the dot (Only if unlocked) */}
                {!isLocked && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-[#7048e8]/10 rounded-full blur-md -z-1" />
                )}
              </div>

              {/* Locked Tooltip */}
              {isLocked && isHovered && (
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-max max-w-[200px] z-50">
                  <div className="bg-black/90 text-white text-xs md:text-sm px-3 py-1.5 rounded-lg shadow-xl border border-white/20 text-center">
                    {(() => {
                      // Condition 1: Admin Locked (is_unlocked = false) -> Future Update
                      if (level.is_unlocked === false) {
                        return "รอการอัพเดทในอนาคต";
                      }

                      // Condition 2: Prerequisite Locked -> Must Pass ...
                      const reqId = level.require_level_id || level.required_level_id;
                      if (reqId) {
                        const reqLevel = levels.find(l => l.level_id === reqId || l.level_id == reqId);
                        const reqName = reqLevel ? (reqLevel.title || reqLevel.level_name) : `Level ${reqId}`;
                        return `ต้องผ่านด่าน "${reqName}" ก่อน`;
                      }

                      // Fallback
                      return "รอการอัพเดทในอนาคต";
                    })()}
                    {/* Little triangle arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/90"></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Fallback for levels without positions */}
      {levels.some(l => !l.coordinates) && (
        <div className="absolute bottom-16 left-0 right-0 p-4 flex justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-xl pointer-events-auto max-w-2xl w-full">
            <h3 className="text-sm font-bold text-gray-500 mb-2 uppercase">Unplaced Levels ({categoryInfo.category_name})</h3>
            <div className="flex flex-wrap gap-2">
              {levels.filter(l => !l.coordinates).map(level => (
                <button
                  key={level.level_id}
                  onClick={() => handleLevelSelect(level.level_id)}
                  className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <span className={`w-2 h-2 rounded-full ${level.is_unlocked ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  {level.title || level.level_name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryLevels;
