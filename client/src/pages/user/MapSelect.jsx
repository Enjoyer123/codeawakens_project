import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

import { fetchAllLevelCategories } from '../../services/levelCategoryService';
import CategoryCard from '../../components/user/CategoryCard';
import MapCoordinatePicker from '../../components/tools/MapCoordinatePicker';

const CATEGORY_POSITIONS = [
  { id: 1, top: 20.44, left: 73.3 },
  { id: 2, top: 42.94, left: 59.84 },
  { id: 3, top: 43.19, left: 19.3 },
  { id: 4, top: 81.06, left: 65.21 },
  { id: 5, top: 62.81, left: 77.21 },
  { id: 6, top: 33.56, left: 40.23 },
  { id: 7, top: 69.69, left: 29.28 },
  { id: 8, top: 29.44, left: 51.95 },
  { id: 9, top: 50.94, left: 20.91 },
  { id: 10, top: 14.69, left: 57.26 },
  { id: 11, top: 64.94, left: 69.12 },
  { id: 12, top: 85.56, left: 58.72 },
  { id: 13, top: 73.94, left: 77.07 },
];

const MapSelect = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDevTool, setShowDevTool] = useState(false);

  // ดึงข้อมูลประเภทด่านจาก API
  useEffect(() => {
    const fetchCategoriesall = async () => {
      try {
        setLoading(true);

        const data = await fetchAllLevelCategories(getToken);
        console.log('🔍 [MapSelect] data:', data);
        const categoriesFix = Array.isArray(data?.levelCategories)
          ? data.levelCategories
          : [];
        
        setCategories(categoriesFix);
        setError(null);

      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err.message);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoriesall();
  }, [getToken]);

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
        <MapCoordinatePicker />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-900 relative overflow-hidden flex flex-col justify-center lg:h-screen lg:w-full lg:block">
      <button 
        onClick={() => setShowDevTool(true)}
        className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white px-3 py-1 text-xs rounded shadow hover:bg-gray-700 transition opacity-50 hover:opacity-100"
      >
        Open Coordinate Picker
      </button>

      {/* Map Container */}
      {!loading && !error && (
        <div className="relative w-full max-w-5xl mx-auto shadow-2xl lg:shadow-none lg:max-w-none lg:mx-0 lg:w-full lg:h-full">
            <img 
              src="/map.jpg" 
              alt="World Map" 
              className="w-full h-auto object-contain lg:w-full lg:h-full lg:object-fill block"
            />
            
            {/* Category Nodes */}
            {categories.map((category) => {
              const position = CATEGORY_POSITIONS.find(p => p.id === category.category_id);
              const count = getCategoryCount(category);
              
              if (!position) return null;

              return (
                <div
                  key={category.category_id}
                  onClick={() => handleCategorySelect(category.category_id)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{ left: `${position.left}%`, top: `${position.top}%` }}
                >
                  {/* Node Circle (Pill shape for Name) */}
                  <div className="px-2 py-1 md:px-4 md:py-2 min-w-[2rem] min-h-[2rem] md:min-w-[3rem] md:min-h-[3rem] bg-white border-2 md:border-4 border-blue-500 rounded-full shadow-lg flex items-center justify-center transition-transform transform group-hover:scale-110 group-active:scale-95 group-hover:border-yellow-400 z-10 relative">
                    <span className="text-blue-800 font-bold text-[10px] md:text-sm lg:text-base whitespace-nowrap">
                      {category.category_name}
                    </span>
                    
                    {/* Unlocked/Count Indicator */}
                    <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-red-500 text-white text-[8px] md:text-xs font-bold px-1.5 py-0.5 rounded-full shadow border-2 border-white min-w-[16px] text-center">
                       {count}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Fallback for categories without positions */}
      {!loading && !error && categories.some(c => !CATEGORY_POSITIONS.find(p => p.id === c.category_id)) && (
          <div className="p-4 bg-gray-100/90 backdrop-blur-sm grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              <div className="col-span-full text-sm text-gray-600 font-bold mb-2 uppercase tracking-wider">Other Categories</div>
              {categories.filter(c => !CATEGORY_POSITIONS.find(p => p.id === c.category_id)).map(category => (
                  <div key={category.category_id} onClick={() => handleCategorySelect(category.category_id)} className="bg-white p-3 rounded shadow cursor-pointer hover:bg-gray-50 flex items-center gap-2 border border-gray-200">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">{category.category_id}</div>
                        <div className="text-sm truncate font-medium">{category.name}</div>
                  </div>
              ))}
          </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="w-full h-screen flex items-center justify-center bg-gray-100">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="w-full h-screen flex items-center justify-center bg-red-50">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-lg text-center">
            <p className="mb-4">เกิดข้อผิดพลาด: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              ลองใหม่
            </button>
          </div>
        </div>
      )}

      {/* No Data State */}
      {!loading && !error && categories.length === 0 && (
        <div className="w-full h-screen flex items-center justify-center bg-gray-100">
          <p className="text-gray-600 font-medium">ไม่พบข้อมูลประเภทด่าน</p>
        </div>
      )}
    </div>
  );
};


export default MapSelect;
