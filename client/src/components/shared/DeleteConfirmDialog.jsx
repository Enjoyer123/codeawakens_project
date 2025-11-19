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

const DeleteConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  itemName,
  title = 'ยืนยันการลบ',
  description,
  deleting = false,
  confirmText = 'ลบ',
  cancelText = 'ยกเลิก',
}) => {
  const defaultDescription = description || (
    <>
      คุณแน่ใจหรือไม่ว่าต้องการลบ <strong>{itemName}</strong>?
      <br />
      <br />
      การกระทำนี้ไม่สามารถยกเลิกได้
    </>
  );

  const handleCancel = () => {
    if (!deleting) {
      onOpenChange(false);
    }
  };

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {defaultDescription}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={deleting}>
            {cancelText}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Loader size="sm" className="mr-2" />
                กำลังลบ...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                {confirmText}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmDialog;

