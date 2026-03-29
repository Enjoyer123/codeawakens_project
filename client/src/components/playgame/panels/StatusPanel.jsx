/**
 * StatusPanel Component
 * 
 * Displays player HP using sprite-based images and current weapon status.
 * HP system uses 11 sprites: HP_100.png to HP_0.png (in increments of 10)
 */

import React from 'react';
import AuraEffect from './AuraEffect';

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
    <div className="w-full h-full bg-[#18113c]/80 backdrop-blur-md rounded-2xl p-2 lg:p-3 border border-purple-500/40 shadow-xl relative overflow-hidden">

      <div className="flex flex-col gap-1 w-full relative group">
        
        {/* HP Bar & Avatar Unit */}
        <div className="relative w-full">

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
            className="absolute rounded-full flex items-center justify-center"
            style={{
              top: '11%',      // ปรับขึ้น-ลง
              left: '4%',      // ปรับซ้าย-ขวา
              width: '26%',    // ขนาดความกว้างของหน้าตัวละคร (เพิ่มจาก 21.5%)
              aspectRatio: '1/1',
              zIndex: 10,
            }}
          >
            {/* พื้นหลังดำวงกลมแยกต่างหาก ตัด clip-path แบบกลม เพื่อให้ Aura พุ่งออกไปได้ */}
            <div className="absolute inset-0 bg-black/50 rounded-full overflow-hidden" />
            
            <img
              src={`/characters/${characterName}.png`}
              alt="Char"
              className="w-[85%] h-[85%] object-contain relative z-10" 
              style={{ imageRendering: 'pixelated' }}
            />

            {/* อนิเมชัน Aura รอบตัวละคร (Sync กับ Phaser Active Effects อัตโนมัติ) */}
            <AuraEffect />
          </div>

          {/* 3. HP Text - วางไว้ใต้หลอดเลือดตามภาพ */}
          <div className="mt-[-6px] ml-4 text-[12px] md:text-[14px] font-bold text-white drop-shadow-md text-right tracking-wide">
            {playerHpState} / 100 HP
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusPanel;
