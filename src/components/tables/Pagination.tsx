type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const pagesAroundCurrent = Array.from(
    { length: Math.min(3, totalPages) },
    (_, i) => i + Math.max(currentPage - 1, 1)
  );

  return (
    <div className="flex items-center">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="mr-3 inline-flex h-8 items-center justify-center rounded-[6px] bg-transparent px-2.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
      >
        Previous
      </button>
      <div className="flex items-center gap-1">
        {currentPage > 3 && <span className="px-2 text-xs text-gray-400">...</span>}
        {pagesAroundCurrent.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-xs font-medium transition-colors ${
              currentPage === page
                ? "bg-brand-50/70 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 font-semibold"
                : "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
            }`}
          >
            {page}
          </button>
        ))}
        {currentPage < totalPages - 2 && <span className="px-2 text-xs text-gray-400">...</span>}
      </div>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="ml-3 inline-flex h-8 items-center justify-center rounded-[6px] bg-transparent px-2.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
