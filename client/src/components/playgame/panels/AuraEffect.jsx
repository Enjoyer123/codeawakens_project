import React, { useState, useEffect } from 'react';
import { getCurrentGameState } from '@/gameutils/shared/game/gameState';

const SingleAura = ({ effectKey }) => {
  const [frame, setFrame] = useState(1);

  // Map effectKey (e.g., 'aura_1', 'circle_2') to animation config
  const getEffectConfig = (key) => {
    if (!key) return null;
    
    // Key comes directly from Phaser's activeEffects array
    const [type, indexStr] = key.split('_');
    const index = parseInt(indexStr) || 1;

    // Default baseline config
    let config = { prefix: key, maxFrames: 8, speed: 80, scale: 1.5, blend: 'screen' };

    // Set correct frame counts matching the /aura/ folder assets
    if (type === 'aura') {
      if (index === 1) config.maxFrames = 8;
      else if (index === 2) { config.maxFrames = 13; config.speed = 60; config.scale = 1.6; }
    } else if (type === 'circle') {
      if (index === 1) { config.maxFrames = 7; config.speed = 100; config.scale = 1.8; }
      else if (index === 2) { config.maxFrames = 9; config.speed = 90; config.scale = 1.7; }
    }

    return config;
  };

  const config = getEffectConfig(effectKey);

  // Reset frame to 1 when effect changes
  useEffect(() => {
    setFrame(1);
  }, [effectKey]);

  // Handle frame cycling animation
  useEffect(() => {
    if (!config) return;

    const interval = setInterval(() => {
      setFrame((prev) => (prev % config.maxFrames) + 1);
    }, config.speed);

    return () => clearInterval(interval);
  }, [config]);

  if (!config) return null;

  return (
    <div 
      className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center animate-pulse"
      style={{
        mixBlendMode: config.blend,
        transform: `scale(${config.scale})`
      }}
    >
      <img 
        src={`/aura/${config.prefix}_${frame}.png`} 
        alt={`Synced Aura Effect ${effectKey}`} 
        className="w-full h-full object-contain opacity-80"
        style={{ 
            imageRendering: 'pixelated',
            filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.8))'
        }}
      />
    </div>
  );
};

const AuraEffect = () => {
  const [activeEffects, setActiveEffects] = useState([]);

  // Poll for active effect changes to perfectly sync with Phaser
  useEffect(() => {
    const pollInterval = setInterval(() => {
      const state = getCurrentGameState();
      const effects = state?.activeEffects || [];
      
      // Filter only aura or circle effects
      const visualEffects = effects.filter(e => e.includes('aura') || e.includes('circle'));
      
      setActiveEffects(prev => {
        // Deep compare array to prevent infinite re-renders
        if (prev.length !== visualEffects.length) return visualEffects;
        for (let i = 0; i < prev.length; i++) {
          if (prev[i] !== visualEffects[i]) return visualEffects;
        }
        return prev;
      });
      
    }, 200); // Check every 200ms (5 times per sec)
    
    return () => clearInterval(pollInterval);
  }, []);

  if (activeEffects.length === 0) return null;

  return (
    <>
      {activeEffects.map((effectKey, index) => (
        <SingleAura key={`${effectKey}-${index}`} effectKey={effectKey} />
      ))}
    </>
  );
};

export default AuraEffect;
