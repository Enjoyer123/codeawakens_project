import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';

import { fetchAllLevelCategories } from '../../services/levelCategoryService';

const MapSelect = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ดึงข้อมูลประเภทด่านจาก API
  useEffect(() => {
    const fetchCategoriesall = async () => {
      try {
        setLoading(true);

        const data = await fetchAllLevelCategories(getToken);

        console.log("API RAW:", data);

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
    navigate(`/mapselect/${categoryId}`);
  };

  const getCategoryCount = (categoryId) => {
    // หาจำนวนด่านจากข้อมูลที่ได้รับจาก API
    const category = categories.find(cat => cat.category_id === categoryId);
    if (!category) return 0;
    
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

  const getCategoryColor = (difficulty_order) => {
    const colors = {
      1: "bg-gray-800 hover:bg-gray-900",
      2: "bg-gray-800 hover:bg-gray-900",
      3: "bg-gray-800 hover:bg-gray-900",
      4: "bg-gray-800 hover:bg-gray-900",
      5: "bg-gray-800 hover:bg-gray-900",
      6: "bg-gray-800 hover:bg-gray-900",
      7: "bg-gray-800 hover:bg-gray-900",
      8: "bg-gray-800 hover:bg-gray-900"
    };
    return colors[difficulty_order] || "bg-gray-800 hover:bg-gray-900";
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
            <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>เกิดข้อผิดพลาด: {error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                ลองใหม่
              </button>
            </div>
          </div>
        )}

        {/* Categories Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {categories.map((category) => {
              const count = getCategoryCount(category.category_id);
              const colorClass = getCategoryColor(category.difficulty_order);

              return (
                <div
                  key={category.category_id}
                  onClick={() => handleCategorySelect(category.category_id)}
                  className={`${colorClass} text-white rounded-xl p-8 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg`}
                >
                  {/* Category Icon */}
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-semibold mb-2">{category.category_name}</h3>
                  </div>

                  {/* Category Description */}
                  {/* <p className="text-white/90 text-sm mb-4 text-center leading-relaxed">
                    {category.description || 'ไม่มีคำอธิบาย'}
                  </p> */}

                  {/* Level Count */}
                  <div className="text-center">
                    <div className="bg-white/20 rounded-full px-4 py-2 inline-block">
                      <span className="text-sm font-medium">
                        {count} ด่าน
                      </span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* No Data State */}
        {!loading && !error && categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">ไม่พบข้อมูลประเภทด่าน</p>
          </div>
        )}

      </div>
    </div>
  );
};


export default MapSelect;
