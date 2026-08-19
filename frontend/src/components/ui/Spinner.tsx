const Spinner = ({ label }: { label?: string }) => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    {label && <p className="mt-4 text-sm text-gray-500">{label}</p>}
  </div>
);

export default Spinner;