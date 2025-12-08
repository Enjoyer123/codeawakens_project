import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';

const AdminPageHeader = ({ 
  title, 
  subtitle, 
  onAddClick, 
  addButtonText = 'เพิ่ม',
  showBackButton = true,
  backPath = '/admin',
  rightContent,
  className = '',
  titleClassName = '',
  subtitleClassName = ''
}) => {
  const navigate = useNavigate();

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 mb-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(backPath)}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className={`text-3xl font-bold text-gray-800 ${titleClassName}`}>{title}</h1>
            {subtitle && <p className={`text-gray-600 mt-1 ${subtitleClassName}`}>{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {rightContent}
          {onAddClick && (
            <Button onClick={onAddClick}>
              <Plus className="h-4 w-4 mr-2" />
              {addButtonText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPageHeader;