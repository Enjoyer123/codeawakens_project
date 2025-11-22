import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const PaginationControls = ({ 
  currentPage, 
  totalPages, 
  totalItems, 
  rowsPerPage, 
  onPageChange 
}) => {
  if (totalPages <= 1) return null;

  const pages = [];

  if (currentPage > 3) {
    pages.push(
      <PaginationItem key={1}>
        <PaginationLink onClick={() => onPageChange(1)} isActive={currentPage === 1}>
          1
        </PaginationLink>
      </PaginationItem>
    );
    if (currentPage > 4) {
      pages.push(
        <PaginationItem key="ellipsis1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
  }

  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  for (let i = start; i <= end; i++) {
    pages.push(
      <PaginationItem key={i}>
        <PaginationLink onClick={() => onPageChange(i)} isActive={currentPage === i}>
          {i}
        </PaginationLink>
      </PaginationItem>
    );
  }

  if (currentPage < totalPages - 2) {
    if (currentPage < totalPages - 3) {
      pages.push(
        <PaginationItem key="ellipsis2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    pages.push(
      <PaginationItem key={totalPages}>
        <PaginationLink onClick={() => onPageChange(totalPages)} isActive={currentPage === totalPages}>
          {totalPages}
        </PaginationLink>
      </PaginationItem>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4 border-t">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
          {pages}
          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <p className="text-sm text-muted-foreground text-center">
        แสดง {((currentPage - 1) * rowsPerPage) + 1}-{Math.min(currentPage * rowsPerPage, totalItems)} จาก {totalItems} รายการ
      </p>
    </div>
  );
};

export default PaginationControls;

