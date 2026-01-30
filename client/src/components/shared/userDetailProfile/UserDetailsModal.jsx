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
      <DialogContent className="max-w-5xl max-auto flex flex-col p-0">
        
        
        <div className="flex-1 relative">
           

           <div className="relative z-10 p-8">
            {userId ? (
              <UserDetailsContent
                userId={userId}
                allowEdit={allowEdit}
                onUpdateSuccess={onUpdateSuccess}
              />
            ) : (
              <div className="p-6 text-center text-slate-500">
                <p>ไม่พบข้อมูล</p>
              </div>
            )}
          </div>
        </div>

     
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsModal;
