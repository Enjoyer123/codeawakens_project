import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader } from '@/components/ui/loader';
import PageLoader from '@/components/shared/Loading/PageLoader';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Trash2, Eye, Save, Settings, Image as ImageIcon, Database } from 'lucide-react';

// Components
import PhaserMapEditor from '../../../components/admin/level/editor/PhaserMapEditor';
import AlgoPreview from '../../../components/admin/level/preview/AlgoPreview';
import LevelInfoForm from '../../../components/admin/level/forms/LevelInfoForm';
import BlockSelector from '../../../components/admin/level/editor/BlockSelector';
import VictoryConditionSelector from '../../../components/admin/level/forms/VictoryConditionSelector';
import BackgroundImageUpload from '../../../components/admin/level/forms/BackgroundImageUpload';
import LevelElementsToolbar from '../../../components/admin/level/editor/LevelElementsToolbar';
import PatternListDialog from '../../../components/admin/pattern/PatternListDialog';
import ErrorAlert from '@/components/shared/alert/ErrorAlert';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import AlertDialog from '@/components/shared/dialog/AlertDialog';
import { useAlertDialog } from '@/components/shared/dialog/useAlertDialog';

// Hooks
import { useLevelData } from '../../../components/admin/level/hooks/useLevelData';
import { useLevelForm } from '../../../components/admin/level/hooks/useLevelForm';

const MODE_LABELS = {
  node: 'MODE: ADD NODE',
  edge: 'MODE: CONNECT EDGE',
  start: 'MODE: SET START',
  goal: 'MODE: SET GOAL',
  monster: 'MODE: PLACE MONSTER',
  obstacle: 'MODE: PLACE OBSTACLE',
  delete: 'MODE: DELETE',
};

const CANVAS_SIZE = { width: 1200, height: 920 };

const LevelCreateEdit = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { levelId } = useParams();
  const isEditing = !!levelId;

  // --- 0. Shared Dialogs ---
  const { alertDialog, showAlert } = useAlertDialog();

  // --- 1. Data Layer ---
  const {
    loading: isDataLoading,
    error: dataError,
    categories,
    prerequisiteLevels,
    allBlocks,
    allVictoryConditions,
    initialLevelData,
    initialSelectedCategory,
    initialBackgroundImageUrl,
  } = useLevelData(levelId, getToken);

  // --- 2. Form Layer ---
  const {
    formData,
    setFormData,
    backgroundImageUrl,
    saving,
    error: formError, // Error handling inside hook
    handleJsonFieldChange, // If needed for direct field manipulation
    handleBackgroundImageChange,
    handleDeleteMap,
    handleSave,
    addMonster
  } = useLevelForm({
    initialData: initialLevelData,
    initialBackgroundImageUrl,
    levelId,
    isEditing,
    getToken,
    navigate,
    showAlert
  });

  // --- 3. UI State ---
  const [currentMode, setCurrentMode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [coinValue, setCoinValue] = useState(10);
  const [edgeWeight, setEdgeWeight] = useState(1);
  const [patternListDialogOpen, setPatternListDialogOpen] = useState(false);
  const [selectedMonsterType, setSelectedMonsterType] = useState('vampire_1');

  // Detect level type for canvas switching (ใช้ algo_data แทน legacy columns)
  const algoType = formData.algo_data?.type || null;
  //DEMO FIBO
  const PURE_ALGO_TYPES = ['KNAPSACK', 'COINCHANGE', 'SUBSETSUM', 'NQUEEN', 'FIBONACCI'];
  const isPureAlgo = algoType && PURE_ALGO_TYPES.includes(algoType);
  const isGraphAlgo = algoType === 'EMEI';

  // Selected Category (Derived with useMemo)
  const selectedCategory = useMemo(() => {
    if (formData.category_id && categories.length > 0) {
      return categories.find(cat => cat.category_id.toString() === formData.category_id.toString()) || initialSelectedCategory;
    }
    return initialSelectedCategory;
  }, [formData.category_id, categories, initialSelectedCategory]);

  // --- 4. Event Handlers (Interaction) ---

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
    if (!clickedNode) {
      showAlert('คำเตือน', '⚠️ Monster must be placed on a node (ตำแหน่งนี้ไม่ใช่ Node)');
      return;
    }

    // ✅ Snap to Node Position
    const snapPos = { x: clickedNode.x, y: clickedNode.y };

    // Direct add functionality using currently selected type from toolbar
    addMonster(selectedMonsterType, snapPos.x, snapPos.y, clickedNode.id);
  };

  // --- Render ---

  if (isDataLoading) {
    return <PageLoader message="Loading level data..." />;
  }

  // Combine errors
  const displayError = dataError || formError;

  return (
    <div className="min-h-screen p-6 font-sans bg-gray-50">
      <div className="max-w-[1920px] mx-auto space-y-6">
        <ErrorAlert message={displayError} />

        {/* Editor Header */}
        <AdminPageHeader
          title={isEditing ? 'Level Editor' : 'New Level Project'}
          subtitle={isEditing ? `ID: ${levelId}` : 'UNSAVED DRAFT'}
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

              <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50/50">
                <TabsContent value="settings" className="space-y-6 mt-0">
                  <LevelInfoForm
                    formData={formData}
                    categories={categories}
                    prerequisiteLevels={prerequisiteLevels}
                    isEditing={isEditing}
                    levelId={levelId}
                    onFormDataChange={setFormData}
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
                      onAddObstacle={() => handleSetMode('obstacle')}
                      selectedCategory={selectedCategory}
                      selectedMonsterType={selectedMonsterType}
                      onMonsterTypeChange={setSelectedMonsterType}
                      coinValue={coinValue}
                      onCoinValueChange={setCoinValue}
                      edgeWeight={edgeWeight}
                      onEdgeWeightChange={setEdgeWeight}
                      onFormDataChange={setFormData}
                      showAlert={showAlert}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="logic" className="space-y-6 mt-0">
                  <VictoryConditionSelector
                    allVictoryConditions={allVictoryConditions}
                    selectedVictoryConditions={formData.selectedVictoryConditions}
                    onVictoryConditionsChange={(conditions) => setFormData(prev => ({ ...prev, selectedVictoryConditions: conditions }))}
                  />
                  <div className="pt-4 border-t border-gray-200 mt-6">
                    <BlockSelector
                      allBlocks={allBlocks}
                      selectedBlocks={formData.selectedBlocks}
                      onBlocksChange={(blocks) => setFormData(prev => ({ ...prev, selectedBlocks: blocks }))}
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
                <span className="text-xs font-bold text-black uppercase tracking-wider mr-2">
                  {isPureAlgo ? 'Preview' : 'Workspace'}
                </span>
                {!isPureAlgo && currentMode && MODE_LABELS[currentMode] && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 animate-pulse">
                    {MODE_LABELS[currentMode]}
                  </Badge>
                )}
              </div>

              {!isPureAlgo && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteMap}
                  className="h-8 text-xs bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  CLEAR MAP
                </Button>
              )}
            </div>

            {/* Canvas Container */}
            <div className="flex-1 bg-white relative flex items-center justify-center p-0 lg:p-8 overflow-hidden">
              <div className="shadow-lg border-white rounded-lg relative w-full h-full flex items-center justify-center">
                {isPureAlgo ? (
                  <AlgoPreview
                    algoType={algoType}
                    data={formData.algo_data?.payload}
                    backgroundImageUrl={backgroundImageUrl}
                  />
                ) : (
                  <PhaserMapEditor
                    canvasSize={CANVAS_SIZE}
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
                    showAlert={showAlert}
                  />
                )}

                {/* Canvas Overlay Info */}
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur rounded text-[10px] text-gray-200 font-mono pointer-events-none">
                  {CANVAS_SIZE.width} x {CANVAS_SIZE.height}
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

      <AlertDialog {...alertDialog} />
    </div>
  );
};

export default LevelCreateEdit;
