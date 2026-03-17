import { useState } from 'react';
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
import { toast } from 'sonner';
import { useAddWeaponImage, useDeleteWeaponImage } from '@/services/hooks/useWeapons';

const WeaponImageDialog = ({
  open,
  onOpenChange,
  selectedWeapon,
  getImageUrl,
}) => {
  const [imageForm, setImageForm] = useState({
    type_animation: 'weapon',
    type_file: 'idle',
    frame: 1,
    imageFile: null
  });

  const { mutateAsync: addImageAsync, isPending: isUploading } = useAddWeaponImage();
  const { mutateAsync: deleteImageAsync, isPending: isDeleting } = useDeleteWeaponImage();
  const [deletingId, setDeletingId] = useState(null);

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageForm({ ...imageForm, imageFile: file });
    }
  };

  const handleAddImage = async () => {
    if (!selectedWeapon) return;

    if (!imageForm.imageFile) {
      toast.error('กรุณาเลือกไฟล์รูปภาพ');
      return;
    }

    try {
      await addImageAsync({
        weaponId: selectedWeapon.weapon_id,
        imageFile: imageForm.imageFile,
        typeFile: imageForm.type_file,
        typeAnimation: imageForm.type_animation,
        frame: imageForm.type_animation === 'weapon' ? 1 : imageForm.frame
      });

      // Reset form on success
      setImageForm({
        type_animation: 'weapon',
        type_file: 'idle',
        frame: 1,
        imageFile: null
      });
      // Clear file input
      const fileInput = document.getElementById('weapon-image-upload');
      if (fileInput) fileInput.value = '';
      
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error uploading image');
    }
  };

  const handleDeleteImage = async (fileId) => {
    if (!selectedWeapon) return;
    try {
      setDeletingId(fileId);
      await deleteImageAsync({
        weaponId: selectedWeapon.weapon_id,
        fileId: fileId
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete image');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>จัดการรูปภาพ: {selectedWeapon?.weapon_name}</DialogTitle>
          <DialogDescription>
            เพิ่มรูปภาพอาวุธและเอฟเฟกต์
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
                <label className="text-sm font-medium">Type Animation</label>
                <select
                  value={imageForm.type_animation}
                  onChange={(e) => {
                    const newTypeAnim = e.target.value;
                    const newTypeFile = newTypeAnim === 'weapon' ? 'idle' : 'attack';
                    const newFrame = newTypeAnim === 'weapon' ? 1 : imageForm.frame;
                    setImageForm({
                      ...imageForm,
                      type_animation: newTypeAnim,
                      type_file: newTypeFile,
                      frame: newFrame
                    });
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="weapon">Weapon</option>
                  <option value="effect">Effect</option>
                </select>
              </div>
              {imageForm.type_animation === 'effect' && (
                <div>
                  <label className="text-sm font-medium">Frame</label>
                  <Input
                    type="number"
                    min="1"
                    value={imageForm.frame}
                    onChange={(e) => setImageForm({ ...imageForm, frame: parseInt(e.target.value) || 1 })}
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Image File</label>
                <Input
                  id="weapon-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                />
                {imageForm.imageFile && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-gray-600">{imageForm.imageFile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setImageForm({ ...imageForm, imageFile: null });
                        const fileInput = document.getElementById('weapon-image-upload');
                        if (fileInput) fileInput.value = '';
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <Button onClick={handleAddImage} className="w-full" disabled={isUploading}>
                {isUploading ? (
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

          {/* Existing Images - Grouped by Type */}
          {selectedWeapon?.weapon_images && selectedWeapon.weapon_images.length > 0 ? (
            (() => {
              // Group images by type_file and type_animation
              const groupedImages = selectedWeapon.weapon_images.reduce((acc, img) => {
                const key = `${img.type_file}_${img.type_animation}`;
                if (!acc[key]) {
                  acc[key] = {
                    type_file: img.type_file,
                    type_animation: img.type_animation,
                    images: []
                  };
                }
                acc[key].images.push(img);
                return acc;
              }, {});

              // Sort images within each group by frame
              Object.keys(groupedImages).forEach(key => {
                groupedImages[key].images.sort((a, b) => a.frame - b.frame);
              });

              return (
                <div className="space-y-6">
                  {Object.values(groupedImages).map((group, groupIndex) => (
                    <Card key={`${group.type_file}_${group.type_animation}_${groupIndex}`}>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {group.type_file} - {group.type_animation}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {group.images.map((img) => (
                            <div key={img.file_id} className="border rounded-lg p-2 relative group">
                              <img
                                src={getImageUrl(img.path_file)}
                                alt=""
                                className="w-full h-32 object-contain rounded"
                              />
                              <div className="mt-2 text-xs space-y-1">
                                <div><strong>Frame:</strong> {img.frame}</div>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDeleteImage(img.file_id)}
                                disabled={deletingId === img.file_id || isDeleting}
                              >
                                {deletingId === img.file_id ? (
                                  <Loader className="h-3 w-3" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              );
            })()
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">รูปภาพที่มีอยู่</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 text-center py-4">ยังไม่มีรูปภาพ</p>
              </CardContent>
            </Card>
          )}
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

export default WeaponImageDialog;

