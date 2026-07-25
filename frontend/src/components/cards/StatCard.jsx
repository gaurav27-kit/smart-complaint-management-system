function StatCard({
  icon,
  number,
  label,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-8 text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">

      <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center text-3xl text-blue-600">

        {icon}

      </div>

      <h2 className="text-4xl font-bold mt-6 text-gray-900">
        {number}
      </h2>

      <p className="text-gray-500 mt-3">
        {label}
      </p>

    </div>
  );
}

export default StatCard;