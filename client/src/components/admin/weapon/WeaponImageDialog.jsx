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

const WeaponImageDialog = ({
  open,
  onOpenChange,
  selectedWeapon,
  imageForm,
  onImageFormChange,
  uploadingImage,
  deletingImageId,
  onAddImage,
  onDeleteImage,
  getImageUrl,
}) => {
  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onImageFormChange({ ...imageForm, imageFile: file });
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
                    onImageFormChange({
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
                    onChange={(e) => onImageFormChange({ ...imageForm, frame: parseInt(e.target.value) || 1 })}
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Image File</label>
                <Input
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
                      onClick={() => onImageFormChange({ ...imageForm, imageFile: null })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <Button onClick={onAddImage} className="w-full" disabled={uploadingImage}>
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
                                onClick={() => onDeleteImage(img.file_id)}
                                disabled={deletingImageId === img.file_id}
                              >
                                {deletingImageId === img.file_id ? (
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

