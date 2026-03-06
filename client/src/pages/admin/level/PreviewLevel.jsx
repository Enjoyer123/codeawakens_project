// src/pages/admin/level/PreviewLevel.jsx
// Preview level page for admin to test patterns
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
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
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 1000,
            minWidth: panelOpen ? '260px' : 'auto',
          }}
        >
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'rgba(30, 30, 50, 0.9)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(100, 100, 200, 0.3)',
              borderRadius: panelOpen ? '10px 10px 0 0' : '10px',
              color: '#e0e0ff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
              justifyContent: 'space-between',
            }}
          >
            <span>📋 Patterns ({patterns.length})</span>
            <span style={{ fontSize: '10px' }}>{panelOpen ? '▲' : '▼'}</span>
          </button>

          {panelOpen && (
            <div
              style={{
                background: 'rgba(20, 20, 40, 0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(100, 100, 200, 0.3)',
                borderTop: 'none',
                borderRadius: '0 0 10px 10px',
                padding: '8px',
                maxHeight: '320px',
                overflowY: 'auto',
              }}
            >
              {/* No selection option */}
              <button
                onClick={() => { setSelectedPatternId(null); setSelectedPatternXml(null); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 10px',
                  background: !selectedPatternId ? 'rgba(80, 80, 160, 0.3)' : 'transparent',
                  border: !selectedPatternId ? '1px solid rgba(120, 120, 255, 0.4)' : '1px solid transparent',
                  borderRadius: '8px',
                  color: '#c0c0e0',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  marginBottom: '4px',
                }}
              >
                <span style={{ fontSize: '14px' }}>🎮</span>
                <span>เล่นเฉยๆ (ไม่เลือก Pattern)</span>
              </button>

              {patterns.map((p) => (
                <button
                  key={p.pattern_id}
                  onClick={() => handleSelectPattern(p)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 10px',
                    background: selectedPatternId === p.pattern_id ? 'rgba(80, 80, 160, 0.3)' : 'transparent',
                    border: selectedPatternId === p.pattern_id ? '1px solid rgba(120, 120, 255, 0.4)' : '1px solid transparent',
                    borderRadius: '8px',
                    color: '#e0e0ff',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    marginBottom: '4px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedPatternId !== p.pattern_id) {
                      e.currentTarget.style.background = 'rgba(60, 60, 130, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedPatternId !== p.pattern_id) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span style={{ fontSize: '10px', color: p.is_available ? '#4ade80' : '#f87171' }}>
                    {p.is_available ? '🟢' : '🔴'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.pattern_name}
                    </div>
                    {p.pattern_type && (
                      <div style={{ fontSize: '10px', color: '#8888bb', marginTop: '2px' }}>
                        {p.pattern_type.type_name}
                        {p.bigO && ` · O(${p.bigO})`}
                      </div>
                    )}
                  </div>
                  {selectedPatternId === p.pattern_id && (
                    <span style={{ fontSize: '14px' }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PreviewLevel;
