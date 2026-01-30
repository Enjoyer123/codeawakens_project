// src/pages/admin/level/PreviewLevel.jsx
// Preview level page for admin to test patterns
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import GameCore from '../../../components/playgame/GameCore';
import { fetchLevelById } from '../../../services/levelService';
import { unlockPattern, unlockLevel } from '../../../services/patternService';
import PageLoader from '../../../components/shared/Loading/PageLoader';

import { API_BASE_URL } from '../../../config/apiConfig';

const PreviewLevel = () => {
  const { levelId, patternId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [level, setLevel] = useState(null);
  const [pattern, setPattern] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load level data
        const levelData = await fetchLevelById(getToken, levelId);
        setLevel(levelData);

        // Load pattern data if patternId is provided
        if (patternId) {
          const token = await getToken();
          const response = await fetch(`${API_BASE_URL}/api/patterns/${patternId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const patternData = await response.json();
            setPattern(patternData);
          }
        }
      } catch (err) {
        console.error('Error loading preview data:', err);
        setError(err.message || 'Failed to load preview data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [levelId, patternId, getToken]);

  const handleUnlockPattern = async (unlockPatternId) => {
    try {
      const token = await getToken();
      await unlockPattern(unlockPatternId, token);
      console.log('Pattern unlocked successfully');
    } catch (error) {
      console.error('Error unlocking pattern:', error);
      throw error;
    }
  };

  const handleUnlockLevel = async (unlockLevelId) => {
    try {
      const token = await getToken();
      await unlockLevel(unlockLevelId, token);
      console.log('Level unlocked successfully');

      // Show success message and navigate back
      alert('ด่านและรูปแบบคำตอบถูกปลดล็อคแล้ว!');
      navigate(`/admin/levels/${unlockLevelId}/edit`);
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
    <div className="h-full w-full overflow-hidden">
      <GameCore
        levelId={levelId}
        isPreview={true}
        patternId={patternId ? parseInt(patternId) : null}
        onUnlockPattern={handleUnlockPattern}
        onUnlockLevel={handleUnlockLevel}
      />
    </div>
  );
};

export default PreviewLevel;

