const Pagination = ({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}) => {
  if (totalPages <= 1) return null;

  const pages: Array<number | string> = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  const baseBtn =
    'px-3 py-1.5 rounded-lg text-sm border transition-colors';
  const activeBtn =
    'bg-blue-600 border-blue-600 text-white font-semibold';
  const inactiveBtn =
    'border-gray-300 text-gray-600 hover:bg-gray-50';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
      <p className="text-sm text-gray-500">Total: {total} records</p>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={`${baseBtn} ${page <= 1 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : inactiveBtn}`}
        >
          Prev
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} className="px-2 text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`${baseBtn} ${p === page ? activeBtn : inactiveBtn}`}
            >
              {p}
            </button>
          )
        )}
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className={`${baseBtn} ${page >= totalPages ? 'border-gray-200 text-gray-300 cursor-not-allowed' : inactiveBtn}`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;