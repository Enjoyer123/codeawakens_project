import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Coins, Users, Gem } from 'lucide-react';
import { ITEM_TYPES } from '@/constants/itemTypes';

const LevelElementsToolbar = ({ currentMode, selectedNode, formData, onSetMode, onAddMonster, onAddObstacle, selectedCategory, coinValue, onCoinValueChange }) => {
  // ตรวจสอบว่า item enable หรือไม่
  const isItemEnabled = selectedCategory?.item_enable === true;
  
  // ดึงรายการ item ที่ enable จาก category_items หรือ item (backward compatibility)
  const getEnabledItems = () => {
    if (!isItemEnabled) return [];
    
    // ใช้ category_items ถ้ามี (ตารางใหม่)
    if (selectedCategory?.category_items && Array.isArray(selectedCategory.category_items)) {
      return selectedCategory.category_items.map(ci => ci.item_type);
    }
    
    // Fallback ไปใช้ item (backward compatibility)
    if (!selectedCategory?.item) return [];
    
    let itemData = selectedCategory.item;
    
    // ถ้าเป็น string ให้ parse JSON
    if (typeof itemData === 'string') {
      try {
        itemData = JSON.parse(itemData);
      } catch (e) {
        return [];
      }
    }
    
    // แปลงเป็น array
    return Array.isArray(itemData) ? itemData : [itemData];
  };
  
  const enabledItems = getEnabledItems();
  
  // ตรวจสอบว่า item นี้ enable หรือไม่
  const isItemTypeEnabled = (itemName) => {
    if (!isItemEnabled) return false;
    return enabledItems.includes(itemName);
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
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-bold mb-4">Level Elements</h2>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={currentMode === 'node' ? 'default' : 'outline'}
            onClick={() => onSetMode('node')}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            + node
          </Button>
          <Button
            variant={currentMode === 'edge' ? 'default' : 'outline'}
            onClick={() => onSetMode('edge')}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            + edge
          </Button>
          <Button
            variant={currentMode === 'start' ? 'default' : 'outline'}
            onClick={() => onSetMode('start')}
            className="w-full bg-green-100 hover:bg-green-200"
          >
            🏁 Start
          </Button>
          <Button
            variant={currentMode === 'goal' ? 'default' : 'outline'}
            onClick={() => onSetMode('goal')}
            className="w-full bg-yellow-100 hover:bg-yellow-200"
          >
            🎯 Goal
          </Button>
          <Button
            variant={currentMode === 'delete' ? 'default' : 'outline'}
            onClick={() => onSetMode('delete')}
            className="w-full bg-red-100 hover:bg-red-200"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button
            variant={currentMode === 'monster' ? 'default' : 'outline'}
            onClick={onAddMonster}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            + Monster
          </Button>
          <Button
            variant={currentMode === 'obstacle' ? 'default' : 'outline'}
            onClick={onAddObstacle}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            + obstacle
          </Button>
          {isItemTypeEnabled(ITEM_TYPES.COIN_POSITIONS) && (
            <Button
              variant={currentMode === 'coin' ? 'default' : 'outline'}
              onClick={handleAddCoin}
              className="w-full"
            >
              <Coins className="h-4 w-4 mr-2" />
              + Coin
            </Button>
          )}
          {isItemTypeEnabled(ITEM_TYPES.PEOPLE) && (
            <Button
              variant={currentMode === 'people' ? 'default' : 'outline'}
              onClick={handleAddPeople}
              className="w-full"
            >
              <Users className="h-4 w-4 mr-2" />
              + People
            </Button>
          )}
          {isItemTypeEnabled(ITEM_TYPES.TREASURES) && (
            <Button
              variant={currentMode === 'treasure' ? 'default' : 'outline'}
              onClick={handleAddTreasure}
              className="w-full"
            >
              <Gem className="h-4 w-4 mr-2" />
              + Treasure
            </Button>
          )}
        </div>
        
        {isItemTypeEnabled(ITEM_TYPES.COIN_POSITIONS) && (
          <div className="border-t pt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              มูลค่าเหรียญ
            </label>
            <Input
              type="number"
              min="1"
              value={coinValue || 10}
              onChange={(e) => {
                const newValue = e.target.value === '' ? 10 : parseInt(e.target.value, 10);
                const finalValue = isNaN(newValue) ? 10 : newValue;
                onCoinValueChange(finalValue);
              }}
              placeholder="10"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              ค่าที่จะใช้เมื่อวางเหรียญใหม่ (ค่าเริ่มต้น: 10)
            </p>
          </div>
        )}
      </div>
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Nodes:</span>
            <span className="ml-2 font-bold text-blue-600">{formData.nodes.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Edges:</span>
            <span className="ml-2 font-bold text-blue-600">{formData.edges.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Monsters:</span>
            <span className="ml-2 font-bold text-blue-600">{formData.monsters.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Obstacles:</span>
            <span className="ml-2 font-bold text-blue-600">{formData.obstacles.length}</span>
          </div>
          {isItemTypeEnabled(ITEM_TYPES.COIN_POSITIONS) && (
            <div>
              <span className="text-gray-600">Coins:</span>
              <span className="ml-2 font-bold text-blue-600">{formData.coin_positions?.length || 0}</span>
            </div>
          )}
          {isItemTypeEnabled(ITEM_TYPES.PEOPLE) && (
            <div>
              <span className="text-gray-600">People:</span>
              <span className="ml-2 font-bold text-blue-600">{formData.people?.length || 0}</span>
            </div>
          )}
          {isItemTypeEnabled(ITEM_TYPES.TREASURES) && (
            <div>
              <span className="text-gray-600">Treasures:</span>
              <span className="ml-2 font-bold text-blue-600">{formData.treasures?.length || 0}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LevelElementsToolbar;

