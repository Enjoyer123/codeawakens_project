import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * Shared AlertDialog - for info/warning messages that need OK confirmation.
 * Usage: pair with useAlertDialog() hook.
 *
 * For simple toast notifications (non-blocking), use sonner's toast() instead.
 */
const AlertDialog = ({
  open,
  onOpenChange,
  title,
  message,
  confirmLabel = 'ตกลง',
  cancelLabel = 'ยกเลิก',
  showCancel = false,
  onConfirm,
  onCancel
}) => {
  const handleConfirm = () => {
    onOpenChange(false);
    if (onConfirm) onConfirm();
  };

  const handleCancel = () => {
    onOpenChange(false);
    if (onCancel) onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {message && (
          <DialogDescription className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
            {message}
          </DialogDescription>
        )}
        <DialogFooter className="flex space-x-2 sm:justify-end">
          {showCancel && (
            <Button variant="outline" onClick={handleCancel}>
              {cancelLabel}
            </Button>
          )}
          <Button onClick={handleConfirm}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AlertDialog;
