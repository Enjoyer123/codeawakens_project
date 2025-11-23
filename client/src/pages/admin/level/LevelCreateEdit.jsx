import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchLevelById,
  createLevel,
  updateLevel,
  fetchAllCategories,
  fetchLevelsForPrerequisite,
  uploadLevelBackgroundImage,
} from '../../../services/levelService';
import { fetchAllBlocks } from '../../../services/blockService';
import { fetchAllVictoryConditions } from '../../../services/victoryConditionService';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { ArrowLeft, Trash2 } from 'lucide-react';
import PhaserMapEditor from '../../../components/admin/level/PhaserMapEditor';
import LevelInfoForm from '../../../components/admin/level/LevelInfoForm';
import BlockSelector from '../../../components/admin/level/BlockSelector';
import VictoryConditionSelector from '../../../components/admin/level/VictoryConditionSelector';
import JSONDataEditor from '../../../components/admin/level/JSONDataEditor';
import BackgroundImageUpload from '../../../components/admin/level/BackgroundImageUpload';
import LevelElementsToolbar from '../../../components/admin/level/LevelElementsToolbar';
import ErrorAlert from '@/components/shared/alert/ErrorAlert';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const LevelCreateEdit = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { levelId } = useParams();
  const isEditing = !!levelId;
  
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(null);
  const [canvasSize] = useState({ width: 1200, height: 600 });
  const [currentMode, setCurrentMode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [prerequisiteLevels, setPrerequisiteLevels] = useState([]);
  const [allBlocks, setAllBlocks] = useState([]);
  const [allVictoryConditions, setAllVictoryConditions] = useState([]);

  const [formData, setFormData] = useState({
    category_id: '',
    level_name: '',
    description: '',
    difficulty_level: 1,
    difficulty: 'easy',
    is_unlocked: false,
    required_level_id: '',
    textcode: false,
    background_image: '',
    start_node_id: null,
    goal_node_id: null,
    goal_type: '',
    nodes: [],
    edges: [],
    monsters: [],
    obstacles: [],
    coin_positions: [],
    people: [],
    treasures: [],
    selectedBlocks: [],
    selectedVictoryConditions: [],
  });

  useEffect(() => {
    loadInitialData();
    if (isEditing) {
      loadLevelData();
    }
  }, [levelId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [categoriesData, prerequisiteData, blocksData, victoryData] = await Promise.all([
        fetchAllCategories(getToken),
        fetchLevelsForPrerequisite(getToken),
        fetchAllBlocks(getToken, 1, 1000, ''),
        fetchAllVictoryConditions(getToken, 1, 1000, ''),
      ]);
      
      setCategories(categoriesData || []);
      setPrerequisiteLevels(prerequisiteData || []);
      setAllBlocks(blocksData?.blocks || []);
      setAllVictoryConditions(victoryData?.victoryConditions || []);
    } catch (err) {
      setError('Failed to load data: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const loadLevelData = async () => {
    try {
      setLoading(true);
      const level = await fetchLevelById(getToken, levelId);
      
      // Parse JSON fields
      const nodes = level.nodes ? (typeof level.nodes === 'string' ? JSON.parse(level.nodes) : level.nodes) : [];
      const edges = level.edges ? (typeof level.edges === 'string' ? JSON.parse(level.edges) : level.edges) : [];
      const monsters = level.monsters ? (typeof level.monsters === 'string' ? JSON.parse(level.monsters) : level.monsters) : [];
      const obstacles = level.obstacles ? (typeof level.obstacles === 'string' ? JSON.parse(level.obstacles) : level.obstacles) : [];
      const coin_positions = level.coin_positions ? (typeof level.coin_positions === 'string' ? JSON.parse(level.coin_positions) : level.coin_positions) : [];
      const people = level.people ? (typeof level.people === 'string' ? JSON.parse(level.people) : level.people) : [];
      const treasures = level.treasures ? (typeof level.treasures === 'string' ? JSON.parse(level.treasures) : level.treasures) : [];

      setFormData({
        category_id: level.category_id.toString(),
        level_name: level.level_name,
        description: level.description || '',
        difficulty_level: level.difficulty_level,
        difficulty: level.difficulty,
        is_unlocked: level.is_unlocked,
        required_level_id: level.required_level_id ? level.required_level_id.toString() : '',
        textcode: level.textcode,
        background_image: level.background_image,
        start_node_id: level.start_node_id,
        goal_node_id: level.goal_node_id,
        goal_type: level.goal_type || '',
        nodes,
        edges,
        monsters,
        obstacles,
        coin_positions,
        people,
        treasures,
        selectedBlocks: level.level_blocks?.map(lb => lb.block_id) || [],
        selectedVictoryConditions: level.level_victory_conditions?.map(lvc => lvc.victory_condition_id) || [],
      });

      // Load background image if exists
      if (level.background_image) {
        if (level.background_image.startsWith('http') || level.background_image.startsWith('data:')) {
          setBackgroundImageUrl(level.background_image);
        } else {
          setBackgroundImageUrl(`${API_BASE_URL}${level.background_image}`);
        }
      }
    } catch (err) {
      setError('Failed to load level: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleBackgroundImageChange = (file, url) => {
      setBackgroundImage(file);
    setBackgroundImageUrl(url);
  };

  const handleJsonFieldChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSetMode = (mode) => {
    if (currentMode === mode) {
      setCurrentMode(null);
      setSelectedNode(null);
    } else {
      setCurrentMode(mode);
      setSelectedNode(null);
    }
  };

  const handleAddMonster = () => {
    handleSetMode('monster');
  };

  const handleAddObstacle = () => {
    handleSetMode('obstacle');
  };

  const handleDeleteMap = () => {
    if (confirm('Are you sure you want to delete the entire map?')) {
      setFormData({
        ...formData,
        nodes: [],
        edges: [],
        monsters: [],
        obstacles: [],
        coin_positions: [],
        people: [],
        treasures: [],
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate required fields
      if (!formData.category_id || !formData.level_name || !formData.difficulty_level || !formData.difficulty) {
        setError('Please fill in all required fields: Category, Level Name, Difficulty Level, and Difficulty');
        setSaving(false);
        return;
      }

      // Upload background image if new one is selected
      let backgroundImagePath = formData.background_image;
      
      if (backgroundImage) {
        try {
          const uploadResult = await uploadLevelBackgroundImage(getToken, backgroundImage);
          backgroundImagePath = uploadResult.imagePath;
        } catch (err) {
          setError('Failed to upload background image. Please try again.');
          setSaving(false);
          return;
        }
      } else if (!backgroundImagePath && backgroundImageUrl) {
        try {
          const response = await fetch(backgroundImageUrl);
          const blob = await response.blob();
          const file = new File([blob], 'background-image.png', { type: blob.type });
          const uploadResult = await uploadLevelBackgroundImage(getToken, file);
          backgroundImagePath = uploadResult.imagePath;
        } catch (err) {
          if (backgroundImageUrl.startsWith('/uploads/')) {
            backgroundImagePath = backgroundImageUrl;
          } else {
            setError('Please upload a background image before saving.');
            setSaving(false);
            return;
          }
        }
      } else if (!backgroundImagePath || backgroundImagePath === '') {
        setError('Please upload a background image before saving.');
        setSaving(false);
        return;
      }

      if (!backgroundImagePath || backgroundImagePath.trim() === '') {
        setError('Background image is required. Please upload a background image.');
        setSaving(false);
        return;
      }

      const levelData = {
        category_id: parseInt(formData.category_id),
        level_name: formData.level_name.trim(),
        description: formData.description || null,
        difficulty_level: parseInt(formData.difficulty_level),
        difficulty: formData.difficulty,
        is_unlocked: formData.is_unlocked,
        required_level_id: formData.required_level_id ? parseInt(formData.required_level_id) : null,
        textcode: formData.textcode,
        background_image: backgroundImagePath,
        start_node_id: formData.start_node_id,
        goal_node_id: formData.goal_node_id,
        goal_type: formData.goal_type || null,
        nodes: formData.nodes.length > 0 ? JSON.stringify(formData.nodes) : null,
        edges: formData.edges.length > 0 ? JSON.stringify(formData.edges) : null,
        monsters: formData.monsters.length > 0 ? JSON.stringify(formData.monsters) : null,
        obstacles: formData.obstacles.length > 0 ? JSON.stringify(formData.obstacles) : null,
        coin_positions: formData.coin_positions.length > 0 ? JSON.stringify(formData.coin_positions) : null,
        people: formData.people.length > 0 ? JSON.stringify(formData.people) : null,
        treasures: formData.treasures.length > 0 ? JSON.stringify(formData.treasures) : null,
        block_ids: formData.selectedBlocks,
        victory_condition_ids: formData.selectedVictoryConditions,
      };

      if (isEditing) {
        await updateLevel(getToken, levelId, levelData);
      } else {
        await createLevel(getToken, levelData);
      }

      navigate('/admin/levels');
    } catch (err) {
      setError('Failed to save level: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="mx-auto" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <ErrorAlert message={error} />
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/levels')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Levels
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">
            {isEditing ? 'Edit Level' : 'Create Level'}
          </h1>
        </div>

        {/* Top Panel - Map Preview */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Preview Map</h2>
            <div className="flex items-center gap-2">
              {currentMode && (
                <div className="px-4 py-2 bg-blue-100 rounded-lg text-sm text-blue-800 font-medium">
                  {currentMode === 'node' && 'โหมด: เพิ่ม Node - คลิกบน Canvas'}
                  {currentMode === 'edge' && (selectedNode 
                    ? `เลือก Node ${selectedNode.id} แล้ว - คลิก Node ปลายทาง`
                    : 'โหมด: เชื่อม Edge - เลือก Node 2 ตัว')}
                  {currentMode === 'start' && 'โหมด: ตั้ง Node เริ่ม - คลิกที่ Node ที่ต้องการ'}
                  {currentMode === 'goal' && 'โหมด: ตั้ง Node ปลาย - คลิกที่ Node ที่ต้องการ'}
                  {currentMode === 'monster' && 'โหมด: เพิ่ม Monster - คลิกบน Canvas เพื่อเลือกตำแหน่ง'}
                  {currentMode === 'obstacle' && 'โหมด: เพิ่ม Obstacle - คลิกบน Canvas เพื่อเลือกตำแหน่ง'}
                  {currentMode === 'delete' && 'โหมด: ลบ - คลิกที่ Node'}
                </div>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteMap}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Map
              </Button>
            </div>
          </div>
          <PhaserMapEditor
            canvasSize={canvasSize}
            backgroundImageUrl={backgroundImageUrl}
            formData={formData}
            currentMode={currentMode}
            selectedNode={selectedNode}
            onFormDataChange={setFormData}
            onSelectedNodeChange={setSelectedNode}
          />
        </div>

        {/* Bottom Panel - Form Fields */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <BackgroundImageUpload
              onImageChange={handleBackgroundImageChange}
              backgroundImageUrl={backgroundImageUrl}
            />

            <LevelInfoForm
              formData={formData}
              categories={categories}
              prerequisiteLevels={prerequisiteLevels}
              isEditing={isEditing}
              levelId={levelId}
              onFormDataChange={setFormData}
            />

            <LevelElementsToolbar
              currentMode={currentMode}
              selectedNode={selectedNode}
              formData={formData}
              onSetMode={handleSetMode}
              onAddMonster={handleAddMonster}
              onAddObstacle={handleAddObstacle}
            />

            <BlockSelector
              allBlocks={allBlocks}
              selectedBlocks={formData.selectedBlocks}
              onBlocksChange={(blocks) => setFormData({ ...formData, selectedBlocks: blocks })}
            />

            <VictoryConditionSelector
              allVictoryConditions={allVictoryConditions}
              selectedVictoryConditions={formData.selectedVictoryConditions}
              onVictoryConditionsChange={(conditions) => setFormData({ ...formData, selectedVictoryConditions: conditions })}
            />

            <JSONDataEditor
              formData={formData}
              onJsonFieldChange={handleJsonFieldChange}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-2 text-lg"
            size="lg"
          >
            {saving ? <Loader className="mr-2" /> : null}
            SAVE
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LevelCreateEdit;
