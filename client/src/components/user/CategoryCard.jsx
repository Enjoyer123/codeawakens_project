import React from 'react';

const CategoryCard = ({ category, count, onClick }) => {
  return (
    <div
      onClick={() => onClick(category.category_id)}
      className="text-white rounded-xl p-8 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg"
      style={{
        backgroundColor: category.color_code || '#0d60d3ff', // Fallback to gray-800 if no color
      }}
    >
      {/* Category Icon/Header */}
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold mb-2">{category.category_name}</h3>
      </div>

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
};

export default CategoryCard;
