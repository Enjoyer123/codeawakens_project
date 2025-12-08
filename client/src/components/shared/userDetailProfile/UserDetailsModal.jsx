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
        <DialogHeader 
          className="relative p-4 flex flex-row items-center justify-between bg-cover bg-center"
          
        >
       
          <DialogTitle className="relative z-10 text-xl font-bold uppercase flex items-center gap-2">
            <span>{userName || 'Checking...'}</span>
          </DialogTitle>
         
        </DialogHeader>
        
        <div className="flex-1 relative">
           

           <div className="relative z-10 p-6">
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

        <DialogFooter className="p-4">
          <Button 
            onClick={() => onOpenChange(false)}
            className="bg-red-900 hover:bg-red-800 text-red-100 border-2 border-red-950 font-bold uppercase"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsModal;
