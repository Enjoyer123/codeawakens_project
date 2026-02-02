import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

const BackgroundImageUpload = ({ onImageChange, backgroundImageUrl }) => {
  const fileInputRef = useRef(null);

  const handleBackgroundImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error("Image file is too large. Max size is 2MB.");
        e.target.value = ''; // Reset input
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        onImageChange(file, event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-3">Upload Background Image</h3>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleBackgroundImageChange}
        className="hidden"
      />
      <Button
        variant="outline"
        className="w-full h-24 flex flex-col items-center justify-center"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-6 w-6 mb-2" />
        <span>Upload Background</span>
      </Button>
      {backgroundImageUrl && (
        <div className="mt-3 p-2 bg-green-50 rounded text-sm text-green-700">
          ✓ Background image uploaded and displayed on canvas
        </div>
      )}
    </div>
  );
};

export default BackgroundImageUpload;

