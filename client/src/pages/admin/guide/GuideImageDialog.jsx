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
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { Plus, Trash2, X } from 'lucide-react';

const GuideImageDialog = ({
  open,
  onOpenChange,
  selectedGuide,
  imageFile,
  onImageFileChange,
  uploadingImage,
  deletingImageId,
  onAddImage,
  onDeleteImage,
  getImageUrl,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>จัดการรูปภาพ: {selectedGuide?.title}</DialogTitle>
          <DialogDescription>
            อัปโหลดรูปภาพสำหรับคำแนะนำ
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Add Image Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">เพิ่มรูปภาพใหม่</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Image File</label>
                <Input
                  id="guide-image-input"
                  type="file"
                  accept="image/*"
                  onChange={onImageFileChange}
                />
                {imageFile && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-gray-600">{imageFile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const input = document.getElementById('guide-image-input');
                        if (input) {
                          input.value = '';
                          onImageFileChange({ target: { files: [] } });
                        }
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <Button onClick={onAddImage} className="w-full" disabled={uploadingImage || !imageFile}>
                {uploadingImage ? (
                  <>
                    <Loader className="h-4 w-4 mr-2" />
                    กำลังอัปโหลด...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    เพิ่มรูปภาพ
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Images */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">รูปภาพที่มีอยู่</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedGuide?.guide_images && selectedGuide.guide_images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedGuide.guide_images.map((img) => (
                    <div key={img.guide_file_id} className="border rounded-lg p-2 relative group">
                      <img
                        src={getImageUrl(img.path_file)}
                        alt=""
                        className="w-full h-48 object-contain rounded"
                      />
                      <div className="mt-2 text-xs text-gray-500 truncate">
                        {img.path_file}
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onDeleteImage(img.guide_file_id)}
                        disabled={deletingImageId === img.guide_file_id}
                      >
                        {deletingImageId === img.guide_file_id ? (
                          <Loader className="h-3 w-3" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">ยังไม่มีรูปภาพ</p>
              )}
            </CardContent>
          </Card>
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

export default GuideImageDialog;

