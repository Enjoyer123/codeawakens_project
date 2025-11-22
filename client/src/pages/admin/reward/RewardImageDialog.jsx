import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { Trash2 } from 'lucide-react';
import FrameUploadInput from './FrameUploadInput';

const RewardImageDialog = ({
  open,
  onOpenChange,
  selectedReward,
  uploadingFrame,
  deletingFrame,
  onUploadFrame,
  onDeleteFrame,
  getImageUrl,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>จัดการรูปภาพ: {selectedReward?.reward_name}</DialogTitle>
          <DialogDescription>
            อัปโหลดรูปภาพสำหรับ Frame 1-5 (สูงสุด 5 รูป)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {[1, 2, 3, 4, 5].map((frameNum) => {
            const frameKey = `frame${frameNum}`;
            const frameImage = selectedReward?.[frameKey];
            const isUploading = uploadingFrame === frameNum;
            const isDeleting = deletingFrame === frameNum;

            return (
              <Card key={frameNum}>
                <CardHeader>
                  <CardTitle className="text-lg">Frame {frameNum}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {frameImage ? (
                    <div className="space-y-2">
                      <div className="border rounded-lg p-2 relative group">
                        <img
                          src={getImageUrl(frameImage)}
                          alt={`Frame ${frameNum}`}
                          className="w-full h-48 object-contain rounded"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => onDeleteFrame(frameNum)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <Loader className="h-3 w-3" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">{frameImage}</p>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-500 mb-2">ยังไม่มีรูปภาพ</p>
                      <FrameUploadInput
                        frameNumber={frameNum}
                        onUpload={onUploadFrame}
                        isUploading={isUploading}
                      />
                    </div>
                  )}
                  {frameImage && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">อัปโหลดรูปใหม่:</p>
                      <FrameUploadInput
                        frameNumber={frameNum}
                        onUpload={onUploadFrame}
                        isUploading={isUploading}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ปิด
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RewardImageDialog;

