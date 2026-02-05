import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Coins, Users, Gem, Link, Code } from 'lucide-react';
import { ITEM_TYPES } from '@/constants/itemTypes';

import { useLevelElements } from './hooks/useLevelElements';

const LevelElementsToolbar = ({ currentMode, selectedNode, formData, onSetMode, onAddMonster, onAddObstacle, selectedCategory, selectedMonsterType, onMonsterTypeChange, coinValue, onCoinValueChange, edgeWeight, onEdgeWeightChange, onFormDataChange }) => {
  const { isItemTypeEnabled, isWeightedGraphCategory } = useLevelElements(selectedCategory);
  const [showPlayerSelect, setShowPlayerSelect] = useState(false);

  // --- Special Algorithm Mode Detection ---
  const activeAlgo =
    formData.knapsack_data ? { key: 'knapsack_data', label: 'Knapsack Data' } :
      formData.coin_change_data ? { key: 'coin_change_data', label: 'Coin Change Data' } :
        formData.subset_sum_data ? { key: 'subset_sum_data', label: 'Subset Sum Data' } :
          formData.applied_data ? { key: 'applied_data', label: 'Applied Data' } : null;

  // Local state for JSON string to allow editing
  const [jsonString, setJsonString] = useState('');
  const [jsonError, setJsonError] = useState(null);

  // Sync internal JSON string with formData when algo changes or mounts
  useEffect(() => {
    if (activeAlgo) {
      const data = formData[activeAlgo.key];
      // If data is object/array, stringify. If null/undefined, empty string.
      // If it's already a string (shouldn't be based on useLevelForm), leave it.
      const str = data ? JSON.stringify(data, null, 2) : '{}';
      setJsonString(str);
    }
  }, [activeAlgo?.key, formData]); // Dependency on formData might cause cursor jump if we sync on every regular update. Be careful.

  // Optimize: Only sync if formData has changed SIGNIFICANTLY or keys changed.
  // Actually, we should only pull from formData if we are NOT editing?
  // But formData is the source of truth.
  // Let's assume onFormDataChange updates formData with PARSED object.
  // So if we type, we update formData. formData updates, triggering useEffect -> re-format.
  // This WILL cause cursor jump.
  // Solution: Update formData ONLY on Blur?
  // Or: Don't dependency loop.
  // Let's rely on local state for editing, and push to parent on change (if valid).

  const handleJsonChange = (e) => {
    const newVal = e.target.value;
    setJsonString(newVal);

    try {
      const parsed = JSON.parse(newVal);
      setJsonError(null);
      // Valid JSON: Update parent
      onFormDataChange({ ...formData, [activeAlgo.key]: parsed });
    } catch (err) {
      setJsonError("Invalid JSON");
      // Don't update parent with invalid data, but keep local string
    }
  };

  const handleAddCoin = () => {
    onSetMode('coin');
  };

  const handleAddPeople = () => {
    onSetMode('people');
  };

  const handleAddTreasure = () => {
    onSetMode('treasure');
  };

  // --- Render Special Mode ---
  if (activeAlgo) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-blue-600">{activeAlgo.label}</h2>
          <Badge variant="outline" className="text-xs">JSON Mode</Badge>
        </div>

        {/* Character Selection (Persisted) */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-500 uppercase">Player Character</label>
          <select
            value={formData.character || 'main_1'}
            onChange={(e) => onFormDataChange({ ...formData, character: e.target.value })}
            className="w-full text-xs h-8 border border-gray-200 rounded-md px-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="main_1">Main 1</option>
            <option value="main_2">Main 2</option>
            <option value="main_3">Main 3</option>
          </select>
        </div>

        {/* JSON Editor */}
        <div className="space-y-2">
          <label className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase">
            <span>JSON Input</span>
            {jsonError && <span className="text-red-500">{jsonError}</span>}
          </label>
          <textarea
            value={jsonString}
            onChange={handleJsonChange}
            className={`w-full h-80 font-mono text-xs p-3 border rounded-md focus:outline-none focus:ring-1 ${jsonError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
            spellCheck="false"
          />
          <p className="text-[10px] text-gray-400">
            Edit the raw data for {activeAlgo.label}. Must be valid JSON.
          </p>
        </div>
      </div>
    );
  }

  // --- Render Standard Mode ---
  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Level Elements</h2>
        <Button
          variant={currentMode === 'delete' ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => onSetMode('delete')}
          className={`text-xs ${currentMode === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'text-red-500 hover:text-red-600 border-red-200 hover:bg-red-50'}`}
        >
          <Trash2 className="h-3 w-3 mr-2" />
          Delete Mode
        </Button>
      </div>

      {/* Group 1: Map Structure */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Map Structure</h3>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={currentMode === 'node' ? 'default' : 'outline'}
            onClick={() => onSetMode('node')}
            className="w-full justify-start px-2"
          >
            <Plus className="h-3 w-3 mr-1" />
            <span className="text-[10px]">Node</span>
          </Button>
          <Button
            variant={currentMode === 'edge' ? 'default' : 'outline'}
            onClick={() => onSetMode('edge')}
            className="w-full justify-start px-2"
          >
            <Plus className="h-3 w-3 mr-1" />
            <span className="text-[10px]">Edge</span>
          </Button>
          <Button
            variant={currentMode === 'obstacle' ? 'default' : 'outline'}
            onClick={onAddObstacle}
            className="w-full justify-start px-2"
          >
            <Plus className="h-3 w-3 mr-1" />
            <span className="text-[10px]">Obstacle</span>
          </Button>
        </div>

        {/* Edge Weight Input Sub-section - แสดงเมื่อเป็น Shortest Path หรือ Minimum Spanning Tree */}
        {isWeightedGraphCategory() && currentMode === 'edge' && (
          <div className="bg-gray-50 p-2 rounded-md border border-gray-100 animate-in fade-in slide-in-from-top-1 duration-200">
            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">
              Edge Weight
            </label>
            <div className="flex items-center gap-2">
              <Link className="w-3 h-3 text-blue-500" />
              <Input
                type="number"
                min="1"
                value={edgeWeight || 1}
                onChange={(e) => {
                  const newValue = e.target.value === '' ? 1 : parseInt(e.target.value, 10);
                  const finalValue = isNaN(newValue) || newValue < 1 ? 1 : newValue;
                  onEdgeWeightChange(finalValue);
                }}
                className="h-7 text-sm py-1"
                placeholder="1"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>

      {/* Group 2: Objectives */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Objectives</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={currentMode === 'start' ? 'default' : 'outline'}
            onClick={() => onSetMode('start')}
            className={`w-full justify-start ${currentMode === 'start' ? 'bg-green-600' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800'}`}
          >
            <span className="mr-2">🏁</span>
            Start
          </Button>
          <Button
            variant={currentMode === 'goal' ? 'default' : 'outline'}
            onClick={() => onSetMode('goal')}
            className={`w-full justify-start ${currentMode === 'goal' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:text-amber-800'}`}
          >
            <span className="mr-2">🎯</span>
            Goal
          </Button>
        </div>
      </div>

      {/* Group 3: Characters & Enemies */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Characters & Enemies</h3>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={showPlayerSelect ? 'default' : 'outline'}
              onClick={() => {
                setShowPlayerSelect(!showPlayerSelect);
                if (currentMode === 'monster') onSetMode(null);
              }}
              className={`w-full justify-start ${showPlayerSelect ? 'bg-blue-600' : ''}`}
            >
              <Users className="h-4 w-4 mr-2" />
              Player
            </Button>
            <Button
              variant={currentMode === 'monster' ? 'default' : 'outline'}
              onClick={() => {
                onAddMonster();
                setShowPlayerSelect(false);
              }}
              className="w-full justify-start"
            >
              <Plus className="h-4 w-4 mr-2" />
              Monster
            </Button>
          </div>

          {/* Player Character Selector */}
          {showPlayerSelect && (
            <div className="bg-gray-50 p-2 rounded-md border border-gray-100 animate-in fade-in slide-in-from-top-1 duration-200">
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">
                Choose Character
              </label>
              <div className="flex flex-col gap-1">
                {[
                  { id: 'main_1', name: 'Main 1', img: '/characters/main_1_00.png' },
                  { id: 'main_2', name: 'Main 2', img: '/characters/main_2_00.png' },
                  { id: 'main_3', name: 'Main 3', img: '/characters/main_3_00.png' },
                ].map((char) => (
                  <Button
                    key={char.id}
                    variant={(formData.character || 'main_1') === char.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      onFormDataChange({ ...formData, character: char.id });
                    }}
                    className={`justify-start h-9 text-[10px] py-1 px-2 ${(formData.character || 'main_1') === char.id ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'text-gray-600'}`}
                  >
                    <img src={char.img} alt={char.name} className="w-6 h-6 mr-2 object-contain" />
                    {char.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Monster Type Selector */}
          {currentMode === 'monster' && (
            <div className="bg-gray-50 p-2 rounded-md border border-gray-100 animate-in fade-in slide-in-from-top-1 duration-200">
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">
                Monster Type
              </label>
              <div className="flex flex-col gap-1">
                {[
                  { id: 'vampire_1', name: 'Vampire', img: '/enemies/vampire_1_00.png' },
                  { id: 'vampire_2', name: 'Vampire 2', img: '/enemies/vampire_2_00.png' },
                  { id: 'vampire_3', name: 'Vampire 3', img: '/enemies/vampire_3_00.png' },
                ].map((monster) => (
                  <Button
                    key={monster.id}
                    variant={selectedMonsterType === monster.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => typeof onMonsterTypeChange === 'function' && onMonsterTypeChange(monster.id)}
                    className={`justify-start h-9 text-[10px] py-1 px-2 ${selectedMonsterType === monster.id ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'text-gray-600'}`}
                  >
                    <img src={monster.img} alt={monster.name} className="w-6 h-6 mr-2 object-contain" />
                    {monster.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Group 4: Items (Conditional) */}
      {
        (isItemTypeEnabled(ITEM_TYPES.COIN_POSITIONS) || isItemTypeEnabled(ITEM_TYPES.PEOPLE) || isItemTypeEnabled(ITEM_TYPES.TREASURES)) && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Items</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {isItemTypeEnabled(ITEM_TYPES.COIN_POSITIONS) && (
                  <Button
                    variant={currentMode === 'coin' ? 'default' : 'outline'}
                    onClick={handleAddCoin}
                    className="w-full justify-start"
                  >
                    <Coins className="h-4 w-4 mr-2" />
                    Coin
                  </Button>
                )}
                {isItemTypeEnabled(ITEM_TYPES.PEOPLE) && (
                  <Button
                    variant={currentMode === 'people' ? 'default' : 'outline'}
                    onClick={handleAddPeople}
                    className="w-full justify-start"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    People
                  </Button>
                )}
                {isItemTypeEnabled(ITEM_TYPES.TREASURES) && (
                  <Button
                    variant={currentMode === 'treasure' ? 'default' : 'outline'}
                    onClick={handleAddTreasure}
                    className="w-full justify-start"
                  >
                    <Gem className="h-4 w-4 mr-2" />
                    Treasure
                  </Button>
                )}
              </div>

              {/* Coin Value Input Sub-section */}
              {isItemTypeEnabled(ITEM_TYPES.COIN_POSITIONS) && currentMode === 'coin' && (
                <div className="bg-gray-50 p-2 rounded-md border border-gray-100 animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">
                    Coin Value
                  </label>
                  <div className="flex items-center gap-2">
                    <Coins className="w-3 h-3 text-yellow-500" />
                    <Input
                      type="number"
                      min="1"
                      value={coinValue || 10}
                      onChange={(e) => {
                        const newValue = e.target.value === '' ? 10 : parseInt(e.target.value, 10);
                        const finalValue = isNaN(newValue) ? 10 : newValue;
                        onCoinValueChange(finalValue);
                      }}
                      className="h-7 text-sm py-1"
                      placeholder="10"
                      autoFocus
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      }


    </div >
  );
};

export default LevelElementsToolbar;