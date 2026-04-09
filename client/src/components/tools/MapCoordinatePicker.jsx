import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { fetchAllLevelCategories, updateLevelCategoryCoordinates } from '../../services/api/levelCategoryService';
import { updateLevelCoordinates } from '../../services/api/levelService';
import { toast } from 'sonner';
import AlertDialog from '@/components/shared/dialog/AlertDialog';
import { useAlertDialog } from '@/components/shared/dialog/useAlertDialog';

const MapCoordinatePicker = ({
  data = null,
  idKey = 'category_id',
  nameKey = 'name',
  imageSrc = '/map.jpg',
  saveType = 'category' // 'category' or 'level'
}) => {
  const { getToken } = useAuth();
  const [internalCategories, setInternalCategories] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [placements, setPlacements] = useState({});
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);
  const { alertDialog, showAlert } = useAlertDialog();

  const items = data || internalCategories;
  const placedCount = Object.keys(placements).length;

  useEffect(() => {
    if (data) {
      setLoading(false);
      return;
    }

    const loadCategories = async () => {
      try {
        const res = await fetchAllLevelCategories(getToken);
        const cats = Array.isArray(res?.levelCategories) ? res.levelCategories : [];
        setInternalCategories(cats);

        if (!data) {
          const initialPlacements = {};
          cats.forEach(item => {
            if (item.coordinates) {
              initialPlacements[item[idKey]] = item.coordinates;
            }
          });
          setPlacements(initialPlacements);
        }

      } catch (err) {
        console.error('Error loading categories:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, [getToken, data, idKey]);

  useEffect(() => {
    if (data && Array.isArray(data)) {
      const initialPlacements = {};
      data.forEach(item => {
        if (item.coordinates) {
          initialPlacements[item[idKey]] = item.coordinates;
        }
      });
      setPlacements(initialPlacements);
    }
  }, [data, idKey]);

  const handleMapClick = (e) => {
    if (!selectedItem || !mapRef.current) return;

    const rect = mapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const width = rect.width;
    const height = rect.height;

    const leftPercent = (x / width) * 100;
    const topPercent = (y / height) * 100;

    const itemId = selectedItem[idKey];

    setPlacements(prev => ({
      ...prev,
      [itemId]: {
        top: parseFloat(topPercent.toFixed(2)),
        left: parseFloat(leftPercent.toFixed(2))
      }
    }));
  };

  const handleClear = () => {
    showAlert('ยืนยันการลบ', 'Clear all placements?', () => {
      setPlacements({});
    }, { showCancel: true });
  }

  const handleSave = async () => {
    showAlert(
      'ยืนยันการบันทึก',
      `Are you sure you want to save ${placedCount} positions to the database?`,
      async () => {
        setLoading(true);
        let successCount = 0;
        let failCount = 0;

        try {
          const promises = Object.entries(placements).map(async ([itemId, coordinates]) => {
            try {
              if (saveType === 'category') {
                await updateLevelCategoryCoordinates(getToken, itemId, coordinates);
              } else if (saveType === 'level') {
                await updateLevelCoordinates(getToken, itemId, coordinates);
              }
              successCount++;
            } catch (err) {
              console.error(`Failed to save item ${itemId}:`, err);
              failCount++;
            }
          });

          await Promise.all(promises);

          if (failCount === 0) {
            toast.success(`Successfully saved ${successCount} positions!`);
          } else {
            toast.warning(`Saved ${successCount} positions, but failed ${failCount}.`);
          }
        } catch (err) {
          console.error('Error saving coordinates:', err);
          toast.error('Failed to save coordinates.');
        } finally {
          setLoading(false);
        }
      },
      { showCancel: true }
    );
  };

  return (
    <div className="flex h-[calc(100vh-100px)] text-gray-800">
      {/* Sidebar */}
      <div className="w-64 flex flex-col border-r border-gray-200 bg-gray-50 shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold">Select Item</h2>
          <p className="text-xs text-gray-500 mt-1">
            {placedCount}/{items.length} placed
          </p>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {loading ? (
            <div className="text-sm text-gray-500 p-2">Loading...</div>
          ) : (
            items.map(item => {
              const itemId = item[idKey];
              const itemName = item[nameKey] || item['level_name'] || item['category_name'];
              const isPlaced = placements[itemId];
              const isSelected = selectedItem && selectedItem[idKey] === itemId;

              return (
                <div
                  key={itemId}
                  onClick={() => setSelectedItem(item)}
                  className={`px-3 py-2 rounded-lg cursor-pointer transition-all text-sm ${isSelected
                    ? 'bg-blue-600 text-white shadow'
                    : 'hover:bg-gray-100'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${isPlaced ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="font-medium truncate">{itemName}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Actions */}
        <div className="p-3 border-t border-gray-200 space-y-2">
          <button
            onClick={handleSave}
            disabled={placedCount === 0}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Save to DB ({placedCount})
          </button>
          <button
            onClick={handleClear}
            disabled={placedCount === 0}
            className="w-full bg-white text-red-600 border border-red-200 py-2 px-4 rounded-lg hover:bg-red-50 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 bg-gray-900 p-8 flex items-center justify-center relative overflow-auto">
        <div className="relative shadow-2xl inline-block">
          {/* Map Image */}
          <img
            ref={mapRef}
            src={imageSrc}
            alt="Map"
            className="max-w-none cursor-crosshair"
            style={{ height: '800px' }}
            onClick={handleMapClick}
          />
          {/* Markers */}
          {Object.entries(placements).map(([itemId, pos]) => {
            const item = items.find(i => i[idKey].toString() === itemId);
            const itemName = item ? (item[nameKey] || item['level_name'] || item['category_name']) : itemId;
            const isSelected = selectedItem && selectedItem[idKey].toString() === itemId;

            return (
              <div
                key={itemId}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
                style={{ top: `${pos.top}%`, left: `${pos.left}%` }}
              >
                <div className={`w-5 h-5 rounded-full border-2 ${isSelected ? 'bg-yellow-400 border-yellow-600 z-50 scale-125' : 'bg-red-500 border-white shadow'}`} />
                <span className={`mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${isSelected ? 'bg-yellow-100 text-yellow-900 border border-yellow-300' : 'bg-white/90 text-gray-800'}`}>
                  {itemName}
                </span>
              </div>
            );
          })}
        </div>

        {/* Floating hint */}
        {selectedItem && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-4 py-2 rounded-full backdrop-blur-sm">
            Click on the map to place <strong>{selectedItem[nameKey] || selectedItem['level_name'] || selectedItem['category_name']}</strong>
          </div>
        )}
      </div>

      <AlertDialog {...alertDialog} />
    </div>
  );
};

export default MapCoordinatePicker;
