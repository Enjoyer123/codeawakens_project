
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

import { useCategoryData } from './hooks/useCategoryData';
import { getImageUrl } from '@/utils/imageUtils';
import MapCoordinatePicker from '../../components/tools/MapCoordinatePicker';
import PageLoader from '../../components/shared/Loading/PageLoader';

const LEVEL_POSITIONS = {
  '1': { top: 28.44, left: 30.27 },
  '2': { top: 28.44, left: 25.27 },
  "4": { top: 36.82, left: 47.58 },
  '5': { top: 35.69, left: 64.92 },
  "6": { top: 56.69, left: 64.92 },
  "7": { top: 52.69, left: 56.27 },
  "8": { top: 67.56, left: 28.63 },
  "10": { top: 39.57, left: 51.38 },
  "22": { top: 35.45, left: 49.88 },
  "23": { top: 37.07, left: 57.12 },
  "24": { top: 38.45, left: 65.07 },
  "27": { top: 40.45, left: 65.07 },
};

const CategoryLevels = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const [reloadKey, setReloadKey] = useState(0);
  const [showDevTool, setShowDevTool] = useState(false);

  const { levels, categoryInfo, loading, error } = useCategoryData(getToken, categoryId, reloadKey);

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
          <div className="text-4xl mb-4">⚠</div>
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
          <div className="text-4xl mb-4">❌</div>
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
          imageSrc="/map_level.jpg"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-900 relative overflow-hidden flex flex-col justify-center lg:h-screen lg:w-full lg:block">

      {/* Dev Tool Button */}
      <button
        onClick={() => setShowDevTool(true)}
        className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white px-3 py-1 text-xs rounded shadow hover:bg-gray-700 transition opacity-50 hover:opacity-100"
      >
        Open Level Picker
      </button>



      {/* Map Container */}
      <div className="relative w-full max-w-5xl mx-auto shadow-2xl lg:shadow-none lg:max-w-none lg:mx-0 lg:w-full lg:h-full">
        <img
          src={categoryInfo?.background_image ? getImageUrl(categoryInfo.background_image) : "/map_level.jpg"}
          alt="Level Map"
          className="w-full h-auto object-contain lg:w-full lg:h-full lg:object-fill block"
        />

        {/* Level Nodes */}
        {levels.map((level) => {
          const position = LEVEL_POSITIONS[level.level_id];
          // Level is locked if user hasn't unlocked it yet OR if it's a DRAFT (is_unlocked === false)
          const isLocked = level.is_locked || !level.is_unlocked;

          if (!position) return null;

          return (
            <div
              key={level.level_id}
              onClick={() => !isLocked && handleLevelSelect(level.level_id)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-10 
                ${isLocked ? 'cursor-not-allowed contrast-75 grayscale-[0.6]' : 'cursor-pointer group'}`}
              style={{ left: `${position.left}%`, top: `${position.top}%` }}
            >
              {/* Node Circle (Pill shape) */}
              <div className={`px-2 py-1 md:px-4 md:py-2 min-w-[2rem] min-h-[2rem] md:min-w-[3rem] md:min-h-[3rem] 
                bg-white border-2 md:border-4 rounded-full shadow-lg flex items-center justify-center transition-transform 
                ${isLocked ? 'border-gray-400 opacity-90' : 'border-green-500 transform group-hover:scale-110 group-active:scale-95 group-hover:border-yellow-400'}`}>

                {isLocked && (
                  <div className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full p-1 shadow-md z-20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                {!level.is_unlocked && (
                  <div className="absolute -bottom-2 bg-red-600 text-white text-[8px] md:text-[10px] px-1.5 py-0.5 rounded-md font-bold z-20 shadow-sm uppercase tracking-wider border border-white/20">
                    Draft
                  </div>
                )}

                <span className={`font-bold text-[10px] md:text-sm lg:text-base whitespace-nowrap ${isLocked ? 'text-gray-500' : 'text-green-800'}`}>
                  {level.title || level.level_name}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fallback for levels without positions */}
      {levels.some(l => !LEVEL_POSITIONS[l.level_id]) && (
        <div className="absolute bottom-16 left-0 right-0 p-4 flex justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-xl pointer-events-auto max-w-2xl w-full">
            <h3 className="text-sm font-bold text-gray-500 mb-2 uppercase">Unplaced Levels ({categoryInfo.category_name})</h3>
            <div className="flex flex-wrap gap-2">
              {levels.filter(l => !LEVEL_POSITIONS[l.level_id]).map(level => (
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
