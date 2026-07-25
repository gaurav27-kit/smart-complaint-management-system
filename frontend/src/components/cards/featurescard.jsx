function FeatureCard({
  icon,
  title,
  description,
}) {
  return (
    <div className="group bg-white rounded-2xl p-8 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">

      <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 text-3xl group-hover:bg-blue-600 group-hover:text-white transition">

        {icon}

      </div>

      <h3 className="mt-6 text-2xl font-bold">

        {title}

      </h3>

      <p className="mt-4 text-gray-600">

        {description}

      </p>

      <button className="mt-6 text-blue-600 font-semibold hover:underline">

        Learn More →

      </button>

    </div>
  );
}

export default FeatureCard;