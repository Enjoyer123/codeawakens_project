import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Coins, Users, Gem, Link } from 'lucide-react';
import { ITEM_TYPES } from '@/constants/itemTypes';

import { useLevelElements } from './hooks/useLevelElements';

const LevelElementsToolbar = ({ currentMode, selectedNode, formData, onSetMode, onAddMonster, onAddObstacle, selectedCategory, selectedMonsterType, onMonsterTypeChange, coinValue, onCoinValueChange, edgeWeight, onEdgeWeightChange }) => {
  const { isItemTypeEnabled, isWeightedGraphCategory } = useLevelElements(selectedCategory);

  const handleAddCoin = () => {
    onSetMode('coin');
  };

  const handleAddPeople = () => {
    onSetMode('people');
  };

  const handleAddTreasure = () => {
    onSetMode('treasure');
  };
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
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={currentMode === 'node' ? 'default' : 'outline'}
            onClick={() => onSetMode('node')}
            className="w-full justify-start"
          >
            <Plus className="h-4 w-4 mr-2" />
            Node
          </Button>
          <Button
            variant={currentMode === 'edge' ? 'default' : 'outline'}
            onClick={() => onSetMode('edge')}
            className="w-full justify-start"
          >
            <Plus className="h-4 w-4 mr-2" />
            Edge
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

      {/* Group 3: Enemies & Obstacles */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Enemies & Obstacles</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={currentMode === 'monster' ? 'default' : 'outline'}
              onClick={onAddMonster}
              className="w-full justify-start"
            >
              <Plus className="h-4 w-4 mr-2" />
              Monster
            </Button>
            <Button
              variant={currentMode === 'obstacle' ? 'default' : 'outline'}
              onClick={onAddObstacle}
              className="w-full justify-start"
            >
              <Plus className="h-4 w-4 mr-2" />
              Obstacle
            </Button>
          </div>

          {/* Monster Type Selector - แสดงเมื่ออยู่ในโหมด monster */}
          {currentMode === 'monster' && (
            <div className="bg-gray-50 p-2 rounded-md border border-gray-100 animate-in fade-in slide-in-from-top-1 duration-200">
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">
                Monster Type
              </label>
              <div className="flex flex-col gap-1">
                <Button
                  variant={selectedMonsterType === 'enemy' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => typeof onMonsterTypeChange === 'function' && onMonsterTypeChange('enemy')}
                  className={`justify-start h-7 text-[10px] py-1 px-2 ${selectedMonsterType === 'enemy' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'text-gray-600'}`}
                >
                  <span className="mr-2">👹</span> Goblin
                </Button>
                <Button
                  variant={selectedMonsterType === 'vampire_1' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => typeof onMonsterTypeChange === 'function' && onMonsterTypeChange('vampire_1')}
                  className={`justify-start h-7 text-[10px] py-1 px-2 ${selectedMonsterType === 'vampire_1' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'text-gray-600'}`}
                >
                  <span className="mr-2">🧛</span> Vampire
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Group 4: Items (Conditional) */}
      {(isItemTypeEnabled(ITEM_TYPES.COIN_POSITIONS) || isItemTypeEnabled(ITEM_TYPES.PEOPLE) || isItemTypeEnabled(ITEM_TYPES.TREASURES)) && (
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
      )}


    </div>
  );
};

export default LevelElementsToolbar;