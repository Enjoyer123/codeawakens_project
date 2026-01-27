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
import { ArrowLeft, Trash2, Eye, Save, Layout, Settings, Image as ImageIcon, Database, Box, Trophy } from 'lucide-react';
import PhaserMapEditor from '../../../components/admin/level/PhaserMapEditor';
import LevelInfoForm from '../../../components/admin/level/LevelInfoForm';
import BlockSelector from '../../../components/admin/level/BlockSelector';
import VictoryConditionSelector from '../../../components/admin/level/VictoryConditionSelector';
import BackgroundImageUpload from '../../../components/admin/level/BackgroundImageUpload';
import LevelElementsToolbar from '../../../components/admin/level/LevelElementsToolbar';
import PatternListDialog from '../../../components/admin/pattern/PatternListDialog';
import ErrorAlert from '@/components/shared/alert/ErrorAlert';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const LevelCreateEdit = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { levelId } = useParams();
  const isEditing = !!levelId;

  const [backgroundImage, setBackgroundImage] = useState(null);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(null);
  const [canvasSize] = useState({ width: 1200, height: 920 });
  const [currentMode, setCurrentMode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [coinValue, setCoinValue] = useState(10); // ค่าเริ่มต้นสำหรับเหรียญ
  const [edgeWeight, setEdgeWeight] = useState(1); // ค่าเริ่มต้นสำหรับ edge weight

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [prerequisiteLevels, setPrerequisiteLevels] = useState([]);
  const [allBlocks, setAllBlocks] = useState([]);
  const [allVictoryConditions, setAllVictoryConditions] = useState([]);
  const [patternListDialogOpen, setPatternListDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null); // เก็บข้อมูล category ที่เลือก
  const [monsterPlacementPos, setMonsterPlacementPos] = useState(null);
  const [monsterDialogOpen, setMonsterDialogOpen] = useState(false);
  const [selectedMonsterType, setSelectedMonsterType] = useState('enemy');

  const [formData, setFormData] = useState({
    category_id: '',
    level_name: '',
    description: '',
    difficulty_level: 1,
    difficulty: 'easy',
    is_unlocked: false,
    required_level_id: '',
    require_pre_score: 0,
    required_for_post_test: false,
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

      // Debug: ตรวจสอบว่า categories มี category_items หรือไม่
      if (process.env.NODE_ENV === 'development') {
        console.log('Categories loaded:', categoriesData?.map(cat => ({
          category_id: cat.category_id,
          category_name: cat.category_name,
          item_enable: cat.item_enable,
          category_items: cat.category_items,
          item: cat.item, // backward compatibility
        })));
      }
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
      let edges = level.edges ? (typeof level.edges === 'string' ? JSON.parse(level.edges) : level.edges) : [];
      // ตรวจสอบและเพิ่ม value field ถ้าไม่มี (backward compatibility)
      edges = edges.map(edge => ({
        ...edge,
        value: edge.value !== undefined && edge.value !== null ? edge.value : undefined,
      }));
      const monsters = level.monsters ? (typeof level.monsters === 'string' ? JSON.parse(level.monsters) : level.monsters) : [];
      const obstacles = level.obstacles ? (typeof level.obstacles === 'string' ? JSON.parse(level.obstacles) : level.obstacles) : [];
      let coin_positions = level.coin_positions ? (typeof level.coin_positions === 'string' ? JSON.parse(level.coin_positions) : level.coin_positions) : [];
      // ตรวจสอบและเพิ่ม value field ถ้าไม่มี (backward compatibility)
      coin_positions = coin_positions.map(coin => ({
        ...coin,
        value: coin.value !== undefined && coin.value !== null ? coin.value : 10,
      }));
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
        require_pre_score: level.require_pre_score !== undefined && level.require_pre_score !== null ? level.require_pre_score : 0,
        required_for_post_test: level.required_for_post_test || false,
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

      // อัปเดต selectedCategory เมื่อโหลด level
      if (level.category) {
        setSelectedCategory(level.category);
        // Debug: ตรวจสอบว่า category มี category_items หรือไม่
        if (process.env.NODE_ENV === 'development') {
          console.log('Selected category from level:', {
            category_id: level.category.category_id,
            category_name: level.category.category_name,
            item_enable: level.category.item_enable,
            category_items: level.category.category_items,
            item: level.category.item, // backward compatibility
          });
        }
      } else if (level.category_id) {
        const category = categories.find(cat => cat.category_id === level.category_id);
        setSelectedCategory(category || null);
        // Debug: ตรวจสอบว่า category มี category_items หรือไม่
        if (process.env.NODE_ENV === 'development' && category) {
          console.log('Selected category from categories:', {
            category_id: category.category_id,
            category_name: category.category_name,
            item_enable: category.item_enable,
            category_items: category.category_items,
            item: category.item, // backward compatibility
          });
        }
      }

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

  const handleMonsterPlacementRequest = (x, y, clickedNode) => {
    // แทนที่จะเปิด Dialog ตลอดเวลา ให้ใช้ selectedMonsterType ที่เลือกไว้จาก Toolbar เลย
    setMonsterPlacementPos({ x, y, clickedNode });

    // ถ้าผู้ใช้ต้องการความเร็ว ให้วางมอนสเตอร์ทันทีที่คลิก โดยใช้ประเภทที่เลือกไว้
    confirmMonsterPlacement(selectedMonsterType, { x, y, clickedNode });
  };

  const confirmMonsterPlacement = (type, forcedPos = null) => {
    const pos = forcedPos || monsterPlacementPos;
    if (!pos) return;

    const { x, y, clickedNode } = pos;
    const currentFormData = formData;

    const newMonsterId = currentFormData.monsters.length > 0
      ? Math.max(...currentFormData.monsters.map(m => m.id)) + 1
      : 1;

    const patrolWidth = 40;
    const patrolHeight = 45;
    const centerX = Math.round(x);
    const centerY = Math.round(y);

    const patrol = [
      { x: centerX - patrolWidth / 2, y: centerY - patrolHeight / 2 },
      { x: centerX + patrolWidth / 2, y: centerY - patrolHeight / 2 },
      { x: centerX + patrolWidth / 2, y: centerY + patrolHeight / 2 },
      { x: centerX - patrolWidth / 2, y: centerY + patrolHeight / 2 }
    ];

    const monsterTemplates = {
      'enemy': {
        name: '👹 Goblin',
        hp: 3,
        damage: 100,
        detectionRange: 60
      },
      'vampire_1': {
        name: '🧛 Vampire',
        hp: 3,
        damage: 100,
        detectionRange: 80
      }
    };

    const template = monsterTemplates[type] || monsterTemplates['enemy'];

    const baseMonsterData = {
      ...template,
      type: type,
      x: centerX,
      y: centerY,
      startNode: clickedNode ? clickedNode.id : null,
      patrol: patrol,
      defeated: false,
    };

    setFormData(prev => {
      const monsters = prev.monsters || [];
      const newMonsterId = monsters.length > 0
        ? Math.max(...monsters.map(m => m.id)) + 1
        : 1;

      return {
        ...prev,
        monsters: [...monsters, { id: newMonsterId, ...baseMonsterData }],
      };
    });

    setMonsterDialogOpen(false);
    setMonsterPlacementPos(null);
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
        require_pre_score: parseInt(formData.require_pre_score) || 0,
        required_for_post_test: formData.required_for_post_test,
        textcode: formData.textcode,
        background_image: backgroundImagePath,
        start_node_id: formData.start_node_id !== null && formData.start_node_id !== undefined ? formData.start_node_id : null,
        goal_node_id: formData.goal_node_id !== null && formData.goal_node_id !== undefined ? formData.goal_node_id : null,
        goal_type: formData.goal_type || null,
        nodes: formData.nodes.length > 0 ? JSON.stringify(formData.nodes) : null,
        edges: formData.edges.length > 0 ? JSON.stringify(formData.edges) : null,
        monsters: formData.monsters.length > 0 ? JSON.stringify(formData.monsters) : null,
        obstacles: formData.obstacles.length > 0 ? JSON.stringify(formData.obstacles) : null,
        coin_positions: formData.coin_positions.length > 0 ? JSON.stringify(formData.coin_positions) : null,
        people: formData.people.length > 0 ? JSON.stringify(formData.people) : null,
        treasures: formData.treasures.length > 0 ? JSON.stringify(formData.treasures) : null,
        knapsack_data: formData.knapsack_data ? JSON.stringify(formData.knapsack_data) : null,
        subset_sum_data: formData.subset_sum_data ? JSON.stringify(formData.subset_sum_data) : null,
        coin_change_data: formData.coin_change_data ? JSON.stringify(formData.coin_change_data) : null,
        nqueen_data: formData.nqueen_data ? JSON.stringify(formData.nqueen_data) : null,
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
    <div className="min-h-screen p-6 font-sans bg-gray-50">
      <div className="max-w-[1920px] mx-auto space-y-6">
        <ErrorAlert message={error} />

        {/* Editor Header */}
        <AdminPageHeader
          title={isEditing ? 'Level Editor' : 'New Level Project'}
          subtitle={isEditing ? `ID: ${levelId} • ${formData.difficulty}` : 'UNSAVED DRAFT'}
          backPath="/admin/levels"
          rightContent={
            <div className="flex items-center gap-3">
              {isEditing && levelId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPatternListDialogOpen(true)}
                  className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Pattern
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={saving}
                className="ml-2 bg-blue-600 hover:bg-blue-500 text-white shadow-lg border-0 min-w-[140px] font-bold tracking-wide"
                size="default"
              >
                {saving ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isEditing ? 'SAVE CHANGES' : 'CREATE LEVEL'}
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-12 gap-6 lg:h-[calc(100vh-140px)] h-auto">
          {/* Left Sidebar: Tools & Properties */}
          <div className="col-span-12 lg:col-span-4 xl:col-span-3 flex flex-col gap-4 overflow-hidden lg:h-full h-[600px]">
            <Tabs defaultValue="settings" className="flex flex-col h-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
              <div className="px-4 pt-4 bg-white border-b border-gray-100">
                <TabsList className="w-full p-1 bg-white border border-gray-200 rounded-lg">
                  <TabsTrigger value="settings" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-blue-600 text-xs uppercase font-bold tracking-wider py-2 shadow-sm">
                    <Settings className="w-3 h-3 mr-2" /> Settings
                  </TabsTrigger>
                  <TabsTrigger value="assets" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-blue-600 text-xs uppercase font-bold tracking-wider py-2 shadow-sm">
                    <ImageIcon className="w-3 h-3 mr-2" /> Assets
                  </TabsTrigger>
                  <TabsTrigger value="logic" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-blue-600 text-xs uppercase font-bold tracking-wider py-2 shadow-sm">
                    <Database className="w-3 h-3 mr-2" /> Logic
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar bg-gray-50/50">
                <TabsContent value="settings" className="space-y-6 mt-0">
                  <LevelInfoForm
                    formData={formData}
                    categories={categories}
                    prerequisiteLevels={prerequisiteLevels}
                    isEditing={isEditing}
                    levelId={levelId}
                    onFormDataChange={(newFormData) => {
                      setFormData(newFormData);
                      // อัปเดต selectedCategory เมื่อเลือก category
                      if (newFormData.category_id) {
                        const category = categories.find(cat => cat.category_id.toString() === newFormData.category_id);
                        setSelectedCategory(category || null);
                        // Debug: ตรวจสอบว่า category มี category_items หรือไม่
                        if (process.env.NODE_ENV === 'development' && category) {
                          console.log('Selected category changed:', {
                            category_id: category.category_id,
                            category_name: category.category_name,
                            item_enable: category.item_enable,
                            category_items: category.category_items,
                            item: category.item, // backward compatibility
                          });
                        }
                      } else {
                        setSelectedCategory(null);
                      }
                    }}
                  />

                </TabsContent>

                <TabsContent value="assets" className="space-y-6 mt-0">
                  <BackgroundImageUpload
                    onImageChange={handleBackgroundImageChange}
                    backgroundImageUrl={backgroundImageUrl}
                  />
                  <div className="pt-4 border-t border-gray-200">



                    <LevelElementsToolbar
                      currentMode={currentMode}
                      selectedNode={selectedNode}
                      formData={formData}
                      onSetMode={handleSetMode}
                      onAddMonster={handleAddMonster}
                      onAddObstacle={handleAddObstacle}
                      selectedCategory={selectedCategory}
                      selectedMonsterType={selectedMonsterType}
                      onMonsterTypeChange={setSelectedMonsterType}
                      coinValue={coinValue}
                      onCoinValueChange={setCoinValue}
                      edgeWeight={edgeWeight}
                      onEdgeWeightChange={setEdgeWeight}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="logic" className="space-y-6 mt-0">

                  <VictoryConditionSelector
                    allVictoryConditions={allVictoryConditions}
                    selectedVictoryConditions={formData.selectedVictoryConditions}
                    onVictoryConditionsChange={(conditions) => setFormData({ ...formData, selectedVictoryConditions: conditions })}
                  />

                  <div className="pt-4 border-t border-gray-200 mt-6">
                    <BlockSelector
                      allBlocks={allBlocks}
                      selectedBlocks={formData.selectedBlocks}
                      onBlocksChange={(blocks) => setFormData({ ...formData, selectedBlocks: blocks })}
                    />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Main Workspace: Canvas */}
          <div className="col-span-12 lg:col-span-8 xl:col-span-9 flex flex-col lg:h-full h-[600px] bg-white border border-gray-200 rounded-xl shadow-xl relative">
            {/* Toolbar Header for Canvas */}
            <div className="h-14 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4">
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="text-xs font-bold text-black uppercase tracking-wider mr-2">Workspace</span>

                {currentMode && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 animate-pulse">
                    {currentMode === 'node' && 'MODE: ADD NODE'}
                    {currentMode === 'edge' && 'MODE: CONNECT EDGE'}
                    {currentMode === 'start' && 'MODE: SET START'}
                    {currentMode === 'goal' && 'MODE: SET GOAL'}
                    {currentMode === 'monster' && 'MODE: PLACE MONSTER'}
                    {currentMode === 'obstacle' && 'MODE: PLACE OBSTACLE'}
                    {currentMode === 'delete' && 'MODE: DELETE'}
                  </Badge>
                )}
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteMap}
                className="h-8 text-xs bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                CLEAR MAP
              </Button>
            </div>

            {/* Canvas Container */}
            <div className="flex-1 bg-white relative flex items-center justify-center p-0 lg:p-8 overflow-hidden">
              <div className="shadow-lg border-white rounded-lg relative w-full h-full flex items-center justify-center">
                <PhaserMapEditor
                  canvasSize={canvasSize}
                  backgroundImageUrl={backgroundImageUrl}
                  formData={formData}
                  currentMode={currentMode}
                  selectedNode={selectedNode}
                  onFormDataChange={setFormData}
                  onSelectedNodeChange={setSelectedNode}
                  onAddMonsterRequest={handleMonsterPlacementRequest}
                  selectedCategory={selectedCategory}
                  coinValue={coinValue}
                  edgeWeight={edgeWeight}
                />
                {/* Canvas Overlay Info */}
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur rounded text-[10px] text-gray-200 font-mono pointer-events-none">
                  {canvasSize.width} x {canvasSize.height}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pattern List Dialog */}
      {isEditing && levelId && (
        <PatternListDialog
          open={patternListDialogOpen}
          onOpenChange={setPatternListDialogOpen}
          levelId={parseInt(levelId)}
          levelName={formData.level_name}
        />
      )}

      {/* Monster Selection Dialog */}
      <Dialog open={monsterDialogOpen} onOpenChange={setMonsterDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>เลือกประเภทมอนสเตอร์</DialogTitle>
            <DialogDescription>
              เลือกมอนสเตอร์ที่คุณต้องการวางที่ตำแหน่งนี้
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-6 border-2 hover:border-blue-500 hover:bg-blue-50"
              onClick={() => confirmMonsterPlacement('enemy')}
            >
              <span className="text-4xl">👹</span>
              <span className="font-bold">Goblin</span>
              <span className="text-xs text-gray-500">HP: 3 | ATK: 100</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-6 border-2 hover:border-blue-500 hover:bg-blue-50"
              onClick={() => confirmMonsterPlacement('vampire_1')}
            >
              <span className="text-4xl">🧛</span>
              <span className="font-bold">Vampire</span>
              <span className="text-xs text-gray-500">HP: 3 | ATK: 100</span>
            </Button>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setMonsterDialogOpen(false)}
            >
              ยกเลิก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LevelCreateEdit;
