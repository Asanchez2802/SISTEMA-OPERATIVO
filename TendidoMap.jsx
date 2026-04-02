export default function KpiCard({ title, value, subtitle, icon: Icon, color = "blue", trend }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    green: "bg-green-50 text-green-600 border-green-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    red: "bg-red-50 text-red-600 border-red-100",
  };
  const iconColors = {
    blue: "bg-blue-100 text-blue-600",
    orange: "bg-orange-100 text-orange-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 flex items-start gap-4 ${colors[color]}`}>
      <div className={`rounded-lg p-3 flex-shrink-0 ${iconColors[color]}`}>
        {Icon && <Icon className="w-6 h-6" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        {trend !== undefined && (
          <p className={`text-xs font-medium mt-1 ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}% vs ayer
          </p>
        )}
      </div>
    </div>
  );
}