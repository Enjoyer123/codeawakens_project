import ContentLoader from './Loading/ContentLoader';

export const LoadingState = ({ message = 'Loading...' }) => {
  return (
    <ContentLoader message={message} />
  );
};

export const EmptyState = ({
  message = 'ไม่พบข้อมูล',
  searchQuery,
  searchMessage = 'ลองค้นหาด้วยคำอื่น'
}) => {
  return (
    <div className="p-8 text-center">
      <div className="text-lg text-gray-600">
        {searchQuery ? message : 'No items found'}
      </div>
      {searchQuery && (
        <p className="text-sm text-gray-500 mt-2">
          {searchMessage}
        </p>
      )}
    </div>
  );
};
