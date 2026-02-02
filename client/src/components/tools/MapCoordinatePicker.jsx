import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { fetchAllLevelCategories, updateLevelCategoryCoordinates } from '../../services/levelCategoryService';
import { updateLevelCoordinates } from '../../services/levelService';
import { toast } from 'sonner';

const MapCoordinatePicker = ({
  data = null,
  idKey = 'category_id',
  nameKey = 'name',
  imageSrc = '/map.jpg',
  saveType = 'category' // 'category' or 'level'
}) => {
  const { getToken } = useAuth();
  const [internalCategories, setInternalCategories] = useState([]); // Renamed from categories
  const [selectedItem, setSelectedItem] = useState(null); // Renamed from selectedCategory
  const [placements, setPlacements] = useState({});
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  // Use props data if provided, otherwise use fetched data
  const items = data || internalCategories;

  useEffect(() => {
    // Only fetch if no external data provided
    if (data) {
      setLoading(false);
      return;
    }

    const loadCategories = async () => {
      try {
        const res = await fetchAllLevelCategories(getToken);
        const cats = Array.isArray(res?.levelCategories) ? res.levelCategories : [];
        setInternalCategories(cats);

        // Populate initial placements from fetched data if no external data
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

  // Populate initial placements from external data
  useEffect(() => {
    if (data && Array.isArray(data)) {
      const initialPlacements = {};
      data.forEach(item => {
        // Check for coordinates in the item (assuming backend returns it)
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

  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(placements, null, 2);
    navigator.clipboard.writeText(jsonStr);
    alert('Copied to clipboard!');
  };

  const handleClear = () => {
    if (confirm('Clear all placements?')) {
      setPlacements({});
    }
  }

  const handleSave = async () => {
    if (!confirm(`Are you sure you want to save ${Object.keys(placements).length} positions to the database?`)) return;

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
  };

  return (
    <div className="flex h-[calc(100vh-100px)] border-t border-gray-200 text-gray-800">
      {/* Sidebar: List */}
      <div className="w-1/4 p-4 overflow-y-auto border-r border-gray-200 bg-gray-50">
        <h2 className="text-xl font-bold mb-4">Select Item</h2>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="space-y-2">
            {items.map(item => {
              const itemId = item[idKey];
              const itemName = item[nameKey] || item['level_name'] || item['category_name']; // Fallback for names
              const isPlaced = placements[itemId];
              const isSelected = selectedItem && selectedItem[idKey] === itemId;

              return (
                <div
                  key={itemId}
                  onClick={() => setSelectedItem(item)}
                  className={`p-3 rounded cursor-pointer transition-colors ${isSelected
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white hover:bg-gray-100 border border-gray-200'
                    }`}
                >
                  <div className="font-semibold">{itemName}</div>
                  <div className="text-xs opacity-75">
                    {isPlaced ? '✅ Placed' : '⚪ Not placed'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Area: Map */}
      <div className="flex-1 bg-gray-800 p-8 flex items-center justify-center relative overflow-auto">
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
                {/* Circle Marker */}
                <div className={`w-6 h-6 rounded-full border-2 ${isSelected ? 'bg-yellow-400 border-yellow-600 z-50 scale-125' : 'bg-red-500 border-white shadow-sm'}`}></div>
                {/* Label */}
                <span className={`mt-1 text-xs font-bold px-2 py-0.5 rounded shadow-sm whitespace-nowrap ${isSelected ? 'bg-yellow-100 text-yellow-900 border border-yellow-300' : 'bg-white/90 text-gray-800'}`}>
                  {itemName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Panel: Output */}
      <div className="w-1/4 p-4 bg-gray-50 border-l border-gray-200 flex flex-col">
        <h2 className="text-xl font-bold mb-4">Coordinates Output</h2>
        <div className="flex-1 bg-white border border-gray-300 rounded p-2 overflow-auto font-mono text-xs mb-4">
          <pre>{JSON.stringify(placements, null, 2)}</pre>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopyJson}
            className="w-full mb-2 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 font-bold"
          >
            Copy JSON (Backup)
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 font-bold"
            >
              Save to DB
            </button>
            <button
              onClick={handleClear}
              className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 font-bold"
            >
              Clear
            </button>
          </div>

        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p><strong>Instructions:</strong></p>
          <ol className="list-decimal ml-4 space-y-1 mt-2">
            <li>Select a item from the left sidebar.</li>
            <li>Click on the map to place the marker.</li>
            <li>Click "Save to DB" to update database directly.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default MapCoordinatePicker;
