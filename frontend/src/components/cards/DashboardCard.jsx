import React from "react";

const DashboardCard = ({
  title,
  value,
  icon: Icon,
  description,
  color = "indigo",
}) => {
  const colorMap = {
    indigo: "bg-indigo-100 text-indigo-600 border-indigo-200",
    green: "bg-green-100 text-green-600 border-green-200",
    yellow: "bg-yellow-100 text-yellow-600 border-yellow-200",
    red: "bg-red-100 text-red-600 border-red-200",
    blue: "bg-blue-100 text-blue-600 border-blue-200",
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 flex items-center justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>

        <h2 className="mt-2 text-3xl font-bold text-gray-900">{value}</h2>

        {description && (
          <p className="mt-2 text-sm text-gray-400">{description}</p>
        )}
      </div>

      {Icon && (
        <div
          className={`w-14 h-14 rounded-xl border flex items-center justify-center ${
            colorMap[color] || colorMap.indigo
          }`}
        >
          <Icon className="w-7 h-7" />
        </div>
      )}
    </div>
  );
};

export default DashboardCard;
