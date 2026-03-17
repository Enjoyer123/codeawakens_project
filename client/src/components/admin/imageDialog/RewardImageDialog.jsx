import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { Trash2, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useUploadRewardFrame, useDeleteRewardFrame } from '@/services/hooks/useRewards';

const RewardImageDialog = ({
  open,
  onOpenChange,
  selectedReward,
  getImageUrl,
}) => {
  const [imageFile, setImageFile] = useState(null);
  const frameImage = selectedReward?.frame1;

  const { mutateAsync: uploadFrameAsync, isPending: isUploading } = useUploadRewardFrame();
  const { mutateAsync: deleteFrameAsync, isPending: isDeleting } = useDeleteRewardFrame();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('ไฟล์ใหญ่เกิน 2MB');
      e.target.value = '';
      return;
    }
    setImageFile(file);
  };

  const handleUpload = async () => {
    if (imageFile && selectedReward) {
      try {
        await uploadFrameAsync({
          rewardId: selectedReward.reward_id,
          frameNumber: 1,
          file: imageFile
        });
        setImageFile(null);
        const input = document.getElementById('reward-image-input');
        if (input) input.value = '';
      } catch (err) {
        console.error(err);
        toast.error('Failed to upload image');
      }
    }
  };

  const handleDelete = async () => {
    if (selectedReward) {
      try {
        await deleteFrameAsync({
          rewardId: selectedReward.reward_id,
          frameNumber: 1
        });
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete image');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>จัดการรูปภาพ: {selectedReward?.reward_name}</DialogTitle>
          <DialogDescription>อัปโหลดรูปภาพรางวัล</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current Image */}
          {frameImage ? (
            <div className="border rounded-lg p-2 relative group">
              <img
                src={getImageUrl(frameImage)}
                alt="Reward Image"
                className="w-full h-48 object-contain rounded"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader className="h-3 w-3" /> : <Trash2 className="h-3 w-3" />}
              </Button>
              <p className="text-xs text-gray-400 mt-1 truncate">{frameImage}</p>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-6 text-center text-sm text-gray-500">
              ยังไม่มีรูปภาพ
            </div>
          )}

          {/* Upload Section */}
          <div className="space-y-2">
            {frameImage && <p className="text-xs text-gray-500">อัปโหลดรูปใหม่:</p>}
            <Input
              id="reward-image-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
              className="text-xs"
            />
            {imageFile && (
              <Button onClick={handleUpload} disabled={isUploading} className="w-full" size="sm">
                {isUploading ? (
                  <><Loader className="h-4 w-4 mr-2" />กำลังอัปโหลด...</>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" />อัปโหลด</>
                )}
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>ปิด</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RewardImageDialog;
