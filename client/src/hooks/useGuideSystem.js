import { useState, useEffect } from 'react';

export const useGuideSystem = (levelData) => {
  const [showGuide, setShowGuide] = useState(false);
  const [guides, setGuides] = useState([]);

  useEffect(() => {
    if (levelData?.guides && levelData.guides.length > 0) {
      // Filter only active guides and sort by display_order
      const activeGuides = levelData.guides
        .filter(guide => guide.is_active)
        .sort((a, b) => a.display_order - b.display_order);

      setGuides(activeGuides);
      setShowGuide(true);
    } else {
      setGuides([]);
      setShowGuide(false);
    }
  }, [levelData]);

  const closeGuide = () => {
    setShowGuide(false);
  };

  const openGuide = () => {
    if (guides.length > 0) {
      setShowGuide(true);
    }
  };

  return {
    showGuide,
    guides,
    closeGuide,
    openGuide,
    hasGuides: guides.length > 0
  };
};
