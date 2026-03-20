import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import { playSound, playBGM } from '../../../gameutils/sound/soundManager';

// Map character key → single-frame portrait image
const CHARACTER_SPRITES = {
  player: '/characters/main_1_00.png',
  main_1: '/characters/main_1_00.png',
  main_2: '/characters/main_2_00.png',
  main_3: '/characters/main_3_00.png',
};

function getCharacterSprite(charKey) {
  if (!charKey) return CHARACTER_SPRITES.player;
  return CHARACTER_SPRITES[charKey] || CHARACTER_SPRITES.player;
}

/**
 * MissionBriefing - หน้าต่างรับภารกิจสไตล์ Visual Novel
 *
 * 3 สถานะ:
 *  1. waiting  — รอผู้เล่นคลิก (แสดง "▶ คลิกเพื่อเริ่ม...")
 *  2. typing   — กำลังพิมพ์ข้อความ (typewriter effect)
 *  3. done     — พิมพ์เสร็จ คลิกอีกทีเพื่อเข้าเกม
 */
const MissionBriefing = ({ isOpen, onStart, levelData }) => {
  // phase: 'waiting' | 'typing' | 'done'
  const [phase, setPhase] = useState('waiting');
  const [displayedText, setDisplayedText] = useState('');
  const intervalRef = useRef(null);

  const levelName = levelData?.level_name || 'Code Awakens: บททดสอบแรก';
  const description = levelData?.description || 'ยินดีต้อนรับเข้าสู่ระบบ... ภารกิจของคุณคือการแก้ไขบั๊กที่ซ่อนอยู่ในโค้ดชุดนี้ให้สำเร็จ หากพร้อมแล้ว กดเพื่อเริ่มได้เลย!';
  const missionText = description;
  const charSprite = useMemo(() => getCharacterSprite(levelData?.character), [levelData?.character]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPhase('waiting');
      setDisplayedText('');
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [isOpen]);

  // Start typewriter when phase changes to 'typing'
  const startTypewriter = useCallback(() => {
    let charIndex = 0;
    setDisplayedText('');

    intervalRef.current = setInterval(() => {
      if (charIndex < missionText.length) {
        setDisplayedText(missionText.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(intervalRef.current);
        setPhase('done');
      }
    }, 35);
  }, [missionText]);

  // จัดการ 3 สถานะเมื่อคลิก
  const handleScreenClick = () => {
    if (phase === 'waiting') {
      // คลิกครั้งแรก → เริ่มทุกอย่างพร้อมกัน (เนียนมาก)
      playSound('mission_start');
      playBGM('game');
      setPhase('typing');
      startTypewriter();
    } else if (phase === 'typing') {
      // คลิกระหว่างพิมพ์ → skip ไปแสดงข้อความทั้งหมด
      if (intervalRef.current) clearInterval(intervalRef.current);
      setDisplayedText(missionText);
      setPhase('done');
    } else {
      // คลิกหลังพิมพ์เสร็จ → เข้าเกม
      onStart();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] w-full h-full bg-black/70 overflow-hidden cursor-pointer select-none animate-in fade-in duration-500"
      onClick={handleScreenClick}
    >
      {/* UI Layer (กล่องข้อความด้านล่าง) */}
      <div className="absolute bottom-0 left-0 w-full px-4 md:px-12 pb-8 pt-10 flex items-end gap-6 z-20">

        {/* Portrait Avatar */}
        <div className="relative w-48 h-60 md:w-64 md:h-80 flex-shrink-0 hidden sm:block z-30">
          <img
            src={charSprite}
            alt="portrait"
            className="absolute bottom-0 w-full h-auto object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        {/* Dialogue Box */}
        <div className="flex-1 bg-gradient-to-b from-[#110c2e]/90 to-[#080517]/95 border-2 border-[#5c6ac4]/60 rounded-xl p-6 md:p-8 relative shadow-[0_8px_32px_rgba(0,0,0,0.8)] backdrop-blur-sm min-h-[150px] md:min-h-[180px] transition-all">

          {/* Name Tag */}
          <div className="absolute -top-6 left-6 md:-top-7 md:left-8 bg-gradient-to-r from-[#4741a6] to-[#2e2675] border-2 border-[#817de0] px-6 py-1.5 md:py-2 rounded-lg shadow-lg">
            <span className="text-white font-bold text-lg md:text-xl tracking-wide drop-shadow-md">
              BOSS
            </span>
          </div>

          {/* Level Name */}
          <div className="absolute top-4 right-6 text-[#817de0] text-sm md:text-base font-semibold tracking-wider">
            {levelName}
          </div>

          {/* Dialogue Text */}
          <div className="mt-4 md:mt-2 w-[90%]">
            {phase === 'waiting' ? (
              /* สถานะรอคลิก — ข้อความกระพริบเชิญชวน */
              <p className="text-[#a5b4fc] text-lg md:text-xl leading-relaxed font-medium animate-pulse">
                ▶ คลิกเพื่อเริ่มภารกิจ...
              </p>
            ) : (
              /* สถานะพิมพ์ / เสร็จแล้ว */
              <p className="text-[#f1f1f5] text-lg md:text-xl leading-relaxed whitespace-pre-wrap font-medium">
                {displayedText}
                {phase === 'typing' && (
                  <span className="inline-block w-3 h-5 bg-[#817de0] ml-1 animate-pulse align-middle" />
                )}
              </p>
            )}
          </div>

          {/* Next/Start Indicator */}
          {phase === 'done' && (
            <div className="absolute bottom-4 right-6 animate-bounce">
              <ChevronRight size={32} className="text-[#a5b4fc] drop-shadow-[0_0_8px_rgba(165,180,252,0.8)]" />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MissionBriefing;