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
import FrameUploadInput from '@/components/admin/reward/FrameUploadInput';

const LevelCategoryImageDialog = ({
    open,
    onOpenChange,
    selectedCategory,
    uploading,
    deleting,
    onUpload,
    onDelete,
    getImageUrl,
}) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>จัดการรูปภาพพื้นหลัง: {selectedCategory?.category_name}</DialogTitle>
                    <DialogDescription>
                        อัปโหลดรูปภาพพื้นหลังสำหรับหมวดหมู่ (จะแสดงในหน้าเลือกด่าน)
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Background Image</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {selectedCategory?.background_image ? (
                                <div className="space-y-2">
                                    <div className="border rounded-lg p-2 relative group">
                                        <img
                                            src={getImageUrl(selectedCategory.background_image)}
                                            alt="Category Background"
                                            className="w-full h-48 object-contain rounded"
                                        />
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={onDelete}
                                            disabled={deleting}
                                        >
                                            {deleting ? (
                                                <Loader className="h-3 w-3" />
                                            ) : (
                                                <Trash2 className="h-3 w-3" />
                                            )}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-gray-500">{selectedCategory.background_image}</p>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                                    <p className="text-sm text-gray-500 mb-2">ยังไม่มีรูปภาพ</p>
                                    <FrameUploadInput
                                        frameNumber={1}
                                        onUpload={(frameNum, file) => onUpload(file)}
                                        isUploading={uploading}
                                    />
                                </div>
                            )}
                            {selectedCategory?.background_image && (
                                <div>
                                    <p className="text-xs text-gray-500 mb-2">อัปโหลดรูปใหม่ (แทนที่รูปเดิม):</p>
                                    <FrameUploadInput
                                        frameNumber={1}
                                        onUpload={(frameNum, file) => onUpload(file)}
                                        isUploading={uploading}
                                    />
                                </div>
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

export default LevelCategoryImageDialog;
