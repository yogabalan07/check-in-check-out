export const StatusBadge = ({ status }: { status: string }) => {
  const checkedIn = status === 'CHECKED_IN';
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${
        checkedIn ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
      }`}
    >
      {checkedIn ? 'CHECKED IN' : 'CHECKED OUT'}
    </span>
  );
};

export const FlagBadges = ({
  isLate,
  isEarlyCheckout,
}: {
  isLate?: boolean;
  isEarlyCheckout?: boolean;
}) => (
  <div className="flex flex-wrap gap-1">
    {isLate && (
      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
        LATE
      </span>
    )}
    {isEarlyCheckout && (
      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
        EARLY OUT
      </span>
    )}
    {!isLate && !isEarlyCheckout && (
      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
        ON TIME
      </span>
    )}
  </div>
);