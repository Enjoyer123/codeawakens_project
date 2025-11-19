import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import UserDetailsContent from './UserDetailsContent';

const UserDetailsModal = ({ open, onOpenChange, userId, userName, allowEdit = false, onUpdateSuccess }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            ข้อมูลผู้ใช้: {userName || 'Loading...'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-6">
          {userId ? (
            <UserDetailsContent
              userId={userId}
              allowEdit={allowEdit}
              onUpdateSuccess={onUpdateSuccess}
            />
          ) : (
            <div className="p-6">
              <p>ไม่พบข้อมูล</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>ปิด</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsModal;
