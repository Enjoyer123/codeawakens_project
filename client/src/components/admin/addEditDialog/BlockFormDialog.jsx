import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import FormInput from '@/components/admin/formFields/FormInput';
import FormSelect from '@/components/admin/formFields/FormSelect';
import FormCheckbox from '@/components/admin/formFields/FormCheckbox';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { getImageUrl } from '@/utils/imageUtils';

// TanStack hooks for mutations (since BlockFormDialog handles save now)
import { useCreateBlock, useUpdateBlock, useUploadBlockImage } from '@/services/hooks/useBlocks';

const blockCategories = [
  { value: 'movement', label: 'Movement' },
  { value: 'logic', label: 'Logic' },
  { value: 'conditions', label: 'Conditions' },
  { value: 'loops', label: 'Loops' },
  { value: 'functions', label: 'Functions' },
  { value: 'variables', label: 'Variables' },
  { value: 'operators', label: 'Operators' },
];

const BlockFormDialog = ({
  open,
  onOpenChange,
  editingBlock, // Now used as initial data seed
}) => {
  // Mutations
  const { mutateAsync: updateBlockAsync } = useUpdateBlock();
  const { mutateAsync: createBlockAsync } = useCreateBlock();
  const { mutateAsync: uploadImageAsync } = useUploadBlockImage();

  // Internal Form State
  const [formData, setFormData] = useState({
    block_key: '',
    block_name: '',
    description: '',
    category: 'movement',
    is_available: true,
    syntax_example: '',
    block_image: '',
  });

  // Internal Image State
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Sync state when dialog opens or editingBlock changes
  useEffect(() => {
    if (open) {
      setError(null);
      if (editingBlock) {
        setFormData({
          block_key: editingBlock.block_key,
          block_name: editingBlock.block_name,
          description: editingBlock.description || '',
          category: editingBlock.category,
          is_available: editingBlock.is_available,
          syntax_example: editingBlock.syntax_example || '',
          block_image: editingBlock.block_image || '',
        });
        setSelectedImage(null);
        setImagePreview(editingBlock.block_image ? getImageUrl(editingBlock.block_image) : null);
      } else {
        // Reset if opening for "add" (though blocks disable add currently)
        setFormData({
          block_key: '',
          block_name: '',
          description: '',
          category: 'movement',
          is_available: true,
          syntax_example: '',
          block_image: '',
        });
        setSelectedImage(null);
        setImagePreview(null);
      }
    }
  }, [open, editingBlock]);

  // Image Handlers
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, block_image: '' }));
  };
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveClick = async () => {
    // Client-side validation
    setError(null);
    if (!formData.block_key?.trim()) {
      setError('กรุณากรอก Block Key');
      return;
    }
    if (!formData.block_name?.trim()) {
      setError('กรุณากรอก Block Name');
      return;
    }
    if (!formData.category) {
      setError('กรุณาเลือก Category');
      return;
    }

    try {
      setSaving(true);
      
      const cleanedData = {
        ...formData,
        block_key: formData.block_key.trim(),
        block_name: formData.block_name.trim(),
        description: formData.description?.trim() || null,
        syntax_example: formData.syntax_example?.trim() || null,
      };

      if (editingBlock) {
        // Handle image upload if a new one is selected
        let imagePath = formData.block_image; 
        if (selectedImage) {
          const uploadResult = await uploadImageAsync(selectedImage);
          imagePath = uploadResult.path;
        }

        await updateBlockAsync({
          blockId: editingBlock.block_id,
          blockData: { ...cleanedData, block_image: imagePath }
        });
        
        onOpenChange(false);
      } else {
        let imagePath = formData.block_image; 
        if (selectedImage) {
          const uploadResult = await uploadImageAsync(selectedImage);
          imagePath = uploadResult.path;
        }

        await createBlockAsync({ ...cleanedData, block_image: imagePath });
        onOpenChange(false);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'บันทึกบล็อกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const dialogTitle = editingBlock ? 'แก้ไขบล็อก' : 'เพิ่มบล็อกใหม่';
  const dialogDescription = editingBlock
    ? 'แก้ไขข้อมูลบล็อก'
    : 'กรอกข้อมูลบล็อกใหม่';

  const dialogContentClassName = 'max-w-2xl max-h-[90vh] overflow-y-auto';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogContentClassName}>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm border border-red-200">
            {error}
          </div>
        )}

        <div className="space-y-4 py-4">
          <FormInput
            label="Block Key"
            name="block_key"
            value={formData.block_key}
            onChange={(e) => handleChange('block_key', e.target.value)}
            placeholder="เช่น move_forward"
            required
            disabled={!!editingBlock}
          />
          <FormInput
            label="Block Name"
            name="block_name"
            value={formData.block_name}
            onChange={(e) => handleChange('block_name', e.target.value)}
            placeholder="เช่น moveForward"
            required
          />
          <FormInput
            label="Description"
            name="description"
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="คำอธิบายบล็อก"
          />
          <FormSelect
            label="Category"
            name="category"
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            options={blockCategories}
            required
          />

          <FormInput
            label="Syntax Example"
            name="syntax_example"
            value={formData.syntax_example || ''}
            onChange={(e) => handleChange('syntax_example', e.target.value)}
            placeholder="เช่น moveForward()"
          />
          <FormCheckbox
            label="Available"
            name="is_available"
            checked={formData.is_available}
            onChange={(e) => handleChange('is_available', e.target.checked)}
          />

          {/* Block Image Upload */}
          <div className="grid gap-2">
            <Label>Block Image (Optional)</Label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative w-24 h-24 border rounded overflow-hidden group">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={handleImageRemove}
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
                  <Upload className="h-4 w-4 mr-2" />
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button onClick={handleSaveClick} disabled={saving}>
            {editingBlock ? 'บันทึกการแก้ไข' : 'เพิ่มบล็อก'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BlockFormDialog;

