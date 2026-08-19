const ErrorState = ({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) => (
  <div className="py-16 text-center">
    <p className="text-red-600 mb-4">{message || 'Something went wrong.'}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
      >
        Retry
      </button>
    )}
  </div>
);

export default ErrorState;