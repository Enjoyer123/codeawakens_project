import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const SearchInput = ({ 
  value, 
  onChange, 
  placeholder = 'ค้นหา...',
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-4 mb-6 ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-10"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
};

export default SearchInput;

