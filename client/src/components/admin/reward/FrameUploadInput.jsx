import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

const FrameUploadInput = ({ frameNumber, onUpload, isUploading }) => {
  const [imageFile, setImageFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB
        toast.error('Image file is too large. Max size is 2MB.');
        e.target.value = '';
        return;
      }
      setImageFile(file);
    }
  };

  const handleUpload = () => {
    if (imageFile) {
      onUpload(frameNumber, imageFile);
      setImageFile(null);
      // Reset file input
      const input = document.getElementById(`frame-${frameNumber}-input`);
      if (input) {
        input.value = '';
      }
    }
  };

  return (
    <div className="space-y-2">
      <Input
        id={`frame-${frameNumber}-input`}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading}
        className="text-xs"
      />
      {imageFile && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{imageFile.name}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setImageFile(null)}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      {imageFile && (
        <Button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full"
          size="sm"
        >
          {isUploading ? (
            <>
              <Loader className="h-4 w-4 mr-2" />
              กำลังอัปโหลด...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              อัปโหลด
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default FrameUploadInput;

