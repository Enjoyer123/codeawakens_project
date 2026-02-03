/**
 * StatusPanel Component
 * 
 * Displays player HP using sprite-based images and current weapon status.
 * HP system uses 11 sprites: HP_100.png to HP_0.png (in increments of 10)
 */

import React from 'react';

/**
 * StatusPanel - Displays sprite-based HP bar with weapon information
 * 
 * @param {Object} props
 * @param {number} props.playerHpState - Current player HP (0-100)
 * @param {Object} props.currentWeaponData - Current weapon data object
 * @param {string} props.currentWeaponData.name - Weapon name
 * @param {string} props.characterName - Character identifier (e.g., "main_1")
 */
const StatusPanel = ({ playerHpState, currentWeaponData, characterName = 'main_1' }) => {
  // Calculate which HP sprite to show (rounded to nearest 10)
  const hpLevel = Math.floor(playerHpState / 10) * 10;

  return (
    <div className="flex-shrink-0 bg-black/30 rounded-lg p-3 border border-gray-700/50 min-w-[300px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</span>
        {currentWeaponData && (
          <span className="text-[10px] bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded border border-blue-800/50">
            {currentWeaponData.name}
          </span>
        )}
      </div>

      {/* Container หลัก - ใช้ flex เพื่อจัดวาง Status และอาวุธ */}
      <div className="flex flex-col gap-1 scale-90 origin-top-left"> {/* ปรับ scale ตรงนี้เพื่อลดขนาดทั้งแผง */}

        {/* HP Bar & Avatar Unit */}
        <div className="relative" style={{ width: '200px' }}> {/* กำหนดความกว้างกรอบรวม */}

          {/* 1. รูปหลอดเลือด (Background) */}
          <img
            src={`/hp/HP_${hpLevel}.png`}
            alt="HP Bar"
            className="block w-full h-auto"
            style={{
              imageRendering: 'pixelated',
            }}
          />

          {/* 2. Character Avatar - วางซ้อนในวงกลม */}
          <div
            className="absolute overflow-hidden rounded-full flex items-center justify-center"
            style={{
              top: '11%',      // ปรับขึ้น-ลง
              left: '4%',      // ปรับซ้าย-ขวา
              width: '26%',    // ขนาดความกว้างของหน้าตัวละคร (เพิ่มจาก 21.5%)
              aspectRatio: '1/1',
              zIndex: 10,
              backgroundColor: 'rgba(0,0,0,0.5)'
            }}
          >
            <img
              src={`/characters/${characterName}.png`}
              alt="Char"
              className="w-[85%] h-[85%] object-contain" // ปรับขนาดรูปข้างในวงกลมเล็กน้อยไม่ให้ชิดขอบไป
              style={{ imageRendering: 'pixelated' }}
            />
          </div>

          {/* 3. HP Text - วางไว้ใต้หลอดเลือดตามภาพ */}
          <div className="mt-1 ml-4 text-[11px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
            {playerHpState} / 100 HP
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusPanel;
