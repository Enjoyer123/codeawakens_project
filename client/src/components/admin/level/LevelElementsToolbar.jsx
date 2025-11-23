import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

const LevelElementsToolbar = ({ currentMode, selectedNode, formData, onSetMode, onAddMonster, onAddObstacle }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-bold mb-4">Level Elements</h2>
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
        </div>
      </div>
    </div>
  );
};

export default LevelElementsToolbar;

