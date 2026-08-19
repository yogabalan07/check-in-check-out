const StatCard = ({
  label,
  value,
  color,
  textColor,
}: {
  label: string;
  value: number;
  color: string;
  textColor: string;
}) => (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-3`}>
      <span className="text-white font-bold text-sm">{value}</span>
    </div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
  </div>
);

export default StatCard;