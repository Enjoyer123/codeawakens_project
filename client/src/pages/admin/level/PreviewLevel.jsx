// src/pages/admin/level/PreviewLevel.jsx
// Preview level page for admin to test patterns
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GameCore from '../../../components/playgame/GameCore';
import { useLevel } from '../../../services/hooks/useLevel';
import { useUnlockPattern, useUnlockLevel, usePatterns } from '../../../services/hooks/usePattern';
import PageLoader from '../../../components/shared/Loading/PageLoader';
import { toast } from 'sonner';



const PreviewLevel = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const { data: levelData, isLoading: isLevelLoading, error: levelError } = useLevel(levelId);
  const { data: patternsDataRaw, isLoading: isPatternsLoading, error: patternsError } = usePatterns(levelId);

  const [patterns, setPatterns] = useState([]);
  const [selectedPatternId, setSelectedPatternId] = useState(null);
  const [selectedPatternXml, setSelectedPatternXml] = useState(null);
  const [panelOpen, setPanelOpen] = useState(true);

  const unlockPatternMutation = useUnlockPattern();
  const unlockLevelMutation = useUnlockLevel();

  // Combine loading and error states
  const loading = isLevelLoading || isPatternsLoading;
  const error = levelError?.message || patternsError?.message;

  // Sync patterns data to local state for optimistic updates
  useEffect(() => {
    if (patternsDataRaw) {
      const patternsArray = Array.isArray(patternsDataRaw) ? patternsDataRaw : (patternsDataRaw.patterns || []);
      setPatterns(patternsArray);
    }
  }, [patternsDataRaw]);

  const handleSelectPattern = (pattern) => {
    if (selectedPatternId === pattern.pattern_id) {
      // Deselect
      setSelectedPatternId(null);
      setSelectedPatternXml(null);
    } else {
      setSelectedPatternId(pattern.pattern_id);
      setSelectedPatternXml(pattern.xmlpattern || null);
    }
  };

  const handleUnlockPattern = async (unlockPatternId) => {
    try {
      // Check if pattern is already available
      const patternData = patterns.find(p => String(p.pattern_id) === String(unlockPatternId));

      if (patternData && patternData.is_available) {
        console.log('🔍 [Preview] Pattern already unlocked. Skipping.');
        return;
      }

      await unlockPatternMutation.mutateAsync(unlockPatternId);
      // Update local state
      setPatterns(prev => prev.map(p =>
        p.pattern_id === unlockPatternId ? { ...p, is_available: true } : p
      ));
      toast.success('รูปแบบคำตอบถูกปลดล็อคแล้ว!');
    } catch (error) {
      console.error('Error unlocking pattern:', error);
      throw error;
    }
  };

  const handleUnlockLevel = async (unlockLevelId) => {
    if (levelData && levelData.is_unlocked) {
      console.log('🔍 [Preview] Level already published. Skipping.');
      return;
    }
    try {
      await unlockLevelMutation.mutateAsync(unlockLevelId);
      // useUnlockLevel automatically invalidates the level query, so no need for setLevel
      toast.success('ด่านถูกปลดล็อค (Publish) แล้ว!');
    } catch (error) {
      console.error('Error unlocking level:', error);
      throw error;
    }
  };

  if (loading) {
    return <PageLoader message="Preparing preview mode..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-xl font-bold text-red-500 mb-2">เกิดข้อผิดพลาด</div>
          <div className="text-gray-400">{error}</div>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            กลับ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden relative">
      <GameCore
        levelId={levelId}
        isPreview={true}
        patternId={selectedPatternId}
        patternXml={selectedPatternXml}
        onUnlockPattern={handleUnlockPattern}
        onUnlockLevel={handleUnlockLevel}
      />

      {/* Pattern Selector Panel */}
      {patterns.length > 0 && (
        <div className={`absolute top-3 right-3 z-[1000] ${panelOpen ? 'min-w-[260px]' : 'w-auto'}`}>
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className={`flex items-center justify-between gap-2 px-4 py-2 w-full bg-white/95 backdrop-blur-sm border border-gray-200 text-gray-800 text-sm font-semibold shadow-md transition-colors hover:bg-gray-50 focus:outline-none ${panelOpen ? 'rounded-t-xl' : 'rounded-xl'}`}
          >
            <span className="flex items-center gap-2">
              Patterns ({patterns.length})
            </span>
            <span className="text-[10px] text-gray-500">{panelOpen ? '▲' : '▼'}</span>
          </button>

          {panelOpen && (
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 border-t-0 p-2 max-h-[320px] overflow-y-auto rounded-b-xl shadow-lg">
              {/* No selection option */}
              <button
                onClick={() => { setSelectedPatternId(null); setSelectedPatternXml(null); }}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-left transition-colors ${!selectedPatternId
                    ? 'bg-blue-50 border border-blue-200 text-blue-800'
                    : 'bg-transparent border border-transparent text-gray-600 hover:bg-gray-50'
                  } mb-1`}
              >
                <span className="font-medium">เล่นเฉยๆ (ไม่เลือก Pattern)</span>
              </button>

              {patterns.map((p) => {
                const isSelected = selectedPatternId === p.pattern_id;
                return (
                  <button
                    key={p.pattern_id}
                    onClick={() => handleSelectPattern(p)}
                    className={`group flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-left transition-colors ${isSelected
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-transparent border border-transparent hover:bg-gray-50'
                      } mb-1`}
                  >
                    <span className={`text-[10px] ${p.is_available ? 'text-green-500' : 'text-red-400'}`}>
                      {p.is_available ? '●' : '●'}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${isSelected ? 'text-blue-800' : 'text-gray-700 group-hover:text-gray-900'}`}>
                        {p.pattern_name}
                      </div>
                      {p.pattern_type && (
                        <div className="text-[11px] text-gray-500 mt-0.5 truncate">
                          {p.pattern_type.type_name}
                          {p.bigO && <span className="text-gray-400 ml-1">· O({p.bigO})</span>}
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <span className="text-blue-600 font-bold ml-2">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PreviewLevel;
