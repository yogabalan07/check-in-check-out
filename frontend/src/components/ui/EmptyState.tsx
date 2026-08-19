const EmptyState = ({ message }: { message?: string }) => (
  <div className="py-16 text-center">
    <p className="text-gray-500">{message || 'No data found.'}</p>
  </div>
);

export default EmptyState;