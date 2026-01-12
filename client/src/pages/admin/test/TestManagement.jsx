import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  fetchAllTests,
  createTest,
  updateTest,
  deleteTest,
  deleteTestChoice,
  uploadTestImage
} from '../../../services/testService';
import { Button } from '@/components/ui/button';
import { Plus, X, Upload, Image as ImageIcon } from 'lucide-react';
import DeleteConfirmDialog from '@/components/admin/dialogs/DeleteConfirmDialog';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import SearchInput from '@/components/admin/formFields/SearchInput';
import ErrorAlert from '@/components/shared/alert/ErrorAlert';
import { LoadingState, EmptyState } from '@/components/shared/DataTableStates';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getImageUrl } from '@/utils/imageUtils';
import TestTable from '@/components/admin/test/TestTable';

const TestManagement = () => {
  const { getToken } = useAuth();
  
  const [activeTab, setActiveTab] = useState('PreTest');
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [formData, setFormData] = useState({
     question: '',
     description: '',
     test_type: 'PreTest',
     is_active: true,
     test_image: '',
     choices: [
         { choice_text: '', is_correct: false },
         { choice_text: '', is_correct: false },
         { choice_text: '', is_correct: false },
         { choice_text: '', is_correct: false },
     ]
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saveError, setSaveError] = useState(null);

  // Delete States
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadTests = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all and filter client side or server side. 
      // Controller has type filter.
      const data = await fetchAllTests(getToken);
      setTests(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  const filteredTests = tests.filter(t => 
      t.test_type === activeTab && 
      (t.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
       t.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenDialog = (test = null) => {
    if (test) {
      setEditingTest(test);
      setFormData({
        question: test.question,
        description: test.description || '',
        test_type: test.test_type,
        is_active: test.is_active,
        test_image: test.test_image || '',
        choices: test.choices.map(c => ({
            test_choice_id: c.test_choice_id,
            choice_text: c.choice_text,
            is_correct: c.is_correct
        }))
      });
    } else {
      setEditingTest(null);
      setFormData({
        question: '',
        description: '',
        test_type: activeTab,
        is_active: true,
        test_image: '',
        choices: [
            { choice_text: '', is_correct: true },
            { choice_text: '', is_correct: false },
            { choice_text: '', is_correct: false },
            { choice_text: '', is_correct: false },
        ]
      });
    }
    setSelectedImage(null);
    setImagePreview(getImageUrl(test?.test_image));
    setSaveError(null);
    setDialogOpen(true);
  };
    
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, test_image: '' }));
  };

  const handleSave = async () => {
      if (!formData.question.trim()) {
          setSaveError("Question is required");
          return;
      }
      
      const hasCorrect = formData.choices.some(c => c.is_correct);
      if (!hasCorrect) {
          setSaveError("At least one choice must be correct");
          return;
      }

      try {
          let imagePath = formData.test_image;
          
          if (selectedImage) {
             const uploadResult = await uploadTestImage(getToken, selectedImage);
             imagePath = uploadResult.path;
          }

          const dataToSave = {
              ...formData,
              test_image: imagePath
          };

          if (editingTest) {
              await updateTest(getToken, editingTest.test_id, dataToSave);
          } else {
              await createTest(getToken, dataToSave);
          }
          setDialogOpen(false);
          loadTests();
      } catch (err) {
          setSaveError(err.message);
      }
  };

  const handleDeleteClick = (test) => {
      setTestToDelete(test);
      setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
      if (!testToDelete) return;
      try {
          setDeleting(true);
          await deleteTest(getToken, testToDelete.test_id);
          setDeleteDialogOpen(false);
          setTestToDelete(null);
          loadTests();
      } catch (err) {
          console.error(err);
      } finally {
          setDeleting(false);
      }
  };

  const updateChoice = (index, field, value) => {
      const newChoices = [...formData.choices];
      newChoices[index] = { ...newChoices[index], [field]: value };
      
      // If setting is_correct to true, assume single choice (radio behavior)?
      // Or multiple choice? Let's allow multiple correct for flexibility, 
      // OR force single correct if that's the rule.
      // Usually simple quizzes are single choice.
      if (field === 'is_correct' && value === true) {
          // Uncheck others
          newChoices.forEach((c, i) => {
              if (i !== index) c.is_correct = false;
          });
      }
      
      setFormData({ ...formData, choices: newChoices });
  };
  
  const removeChoice = async (index) => {
      const choice = formData.choices[index];
      
      // If it's an existing choice in DB, we might want to delete it via API directly
      // OR just let updateTest handle it (if logic supports delta updates).
      // My controller logic currently UPDATES existing IDs and CREATES new ones.
      // It DOES NOT delete missing IDs. So I need to call deleteTestChoice if it has an ID.
      
      if (choice.test_choice_id) {
          try {
              await deleteTestChoice(getToken, choice.test_choice_id);
          } catch (err) {
              setSaveError("Failed to delete choice: " + err.message);
              return; 
          }
      }
      
      const newChoices = formData.choices.filter((_, i) => i !== index);
      setFormData({ ...formData, choices: newChoices });
  };
  
  const addChoice = () => {
      setFormData({
          ...formData,
          choices: [...formData.choices, { choice_text: '', is_correct: false }]
      });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <AdminPageHeader
        title="Test Management"
        subtitle="Manage Pre-Test and Post-Test Questions"
        onAddClick={() => handleOpenDialog()}
        addButtonText="Add Question"
      />

      <ErrorAlert message={error} />

      <Tabs defaultValue="PreTest" value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList>
              <TabsTrigger value="PreTest">Pre-Test</TabsTrigger>
              <TabsTrigger value="PostTest">Post-Test</TabsTrigger>
          </TabsList>
      
        <div className="mt-4">
            <SearchInput
                defaultValue={searchQuery}
                onSearch={setSearchQuery}
                placeholder="Search questions..."
            />
        </div>

        <TabsContent value={activeTab} className="mt-4">
             <div className="bg-white rounded-lg shadow overflow-hidden">
                {loading ? <LoadingState /> : filteredTests.length === 0 ? <EmptyState message="No questions found." /> : (
                 <TestTable 
                    tests={filteredTests}
                    onEdit={handleOpenDialog}
                    onDelete={handleDeleteClick}
                 />
                )}
             </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
         <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
             <DialogHeader>
                 <DialogTitle>{editingTest ? 'Edit Question' : 'New Question'}</DialogTitle>
             </DialogHeader>
             
             {saveError && <ErrorAlert message={saveError} />}

             <div className="space-y-4 py-4">
                 <div className="grid gap-2">
                     <Label>Question</Label>
                     <Textarea 
                        value={formData.question} 
                        onChange={(e) => setFormData({...formData, question: e.target.value})}
                     />
                 </div>
                 
                 <div className="grid gap-2">
                     <Label>Description</Label>
                     <Input 
                        value={formData.description} 
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                     />
                 </div>

                 <div className="flex gap-4">
                     <div className="w-1/2 grid gap-2">
                         <Label>Type</Label>
                         <Select 
                            value={formData.test_type} 
                            onValueChange={(val) => setFormData({...formData, test_type: val})}
                         >
                             <SelectTrigger><SelectValue /></SelectTrigger>
                             <SelectContent>
                                 <SelectItem value="PreTest">Pre-Test</SelectItem>
                                 <SelectItem value="PostTest">Post-Test</SelectItem>
                             </SelectContent>
                         </Select>
                     </div>
                     <div className="w-1/2 flex items-center gap-2 mt-6">
                         <input 
                            type="checkbox" 
                            id="isActive"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                            className="h-4 w-4"
                         />
                         <Label htmlFor="isActive">Active</Label>
                     </div>
                  </div>

                  <div className="grid gap-2">
                     <Label>Test Image (Optional)</Label>
                     <div className="flex items-center gap-4">
                         {imagePreview ? (
                             <div className="relative w-24 h-24 border rounded overflow-hidden group">
                                 <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                 <button 
                                     onClick={removeImage}
                                     className="absolute top-0 right-0 bg-red-500 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                 >
                                     <X size={12} />
                                 </button>
                             </div>
                         ) : (
                             <div className="w-24 h-24 border-2 border-dashed rounded flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                                 <ImageIcon className="h-8 w-8 mb-1" />
                                 <span className="text-xs">No Image</span>
                             </div>
                         )}
                         
                         <div className="flex-1">
                             <label className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
                                 <Upload className="mr-2 h-4 w-4" /> Upload Image
                                 <input 
                                     type="file" 
                                     className="hidden" 
                                     accept="image/*"
                                     onChange={handleImageChange}
                                 />
                             </label>
                             <p className="text-xs text-gray-500 mt-1">
                                 Supported formats: JPG, PNG, GIF, WebP
                             </p>
                         </div>
                     </div>
                  </div>
                  

                 <div className="space-y-3 mt-4">
                     <Label>Choices (Select correct answer)</Label>
                     {formData.choices.map((choice, idx) => (
                         <div key={idx} className="flex items-center gap-2">
                             <div className="pt-2">
                                <input 
                                    type="radio"
                                    name="correct_choice"
                                    checked={choice.is_correct}
                                    onChange={() => updateChoice(idx, 'is_correct', true)}
                                    className="h-4 w-4 cursor-pointer"
                                />
                             </div>
                             <Input 
                                value={choice.choice_text}
                                onChange={(e) => updateChoice(idx, 'choice_text', e.target.value)}
                                placeholder={`Choice ${idx + 1}`}
                             />
                             <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeChoice(idx)}
                                disabled={formData.choices.length <= 2}
                             >
                                 <X className="h-4 w-4 text-gray-500" />
                             </Button>
                         </div>
                     ))}
                     <Button variant="outline" size="sm" onClick={addChoice} className="mt-2">
                         <Plus className="h-4 w-4 mr-2" /> Add Choice
                     </Button>
                 </div>
             </div>

             <DialogFooter>
                 <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                 <Button onClick={handleSave}>Save</Button>
             </DialogFooter>
         </DialogContent>
      </Dialog>
      
      <DeleteConfirmDialog 
         open={deleteDialogOpen}
         onOpenChange={setDeleteDialogOpen}
         onConfirm={handleDeleteConfirm}
         deleting={deleting}
         itemName="this question"
      />
    </div>
  );
};

export default TestManagement;
