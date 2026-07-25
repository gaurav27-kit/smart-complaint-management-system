function Card({ icon, title, description }) {
  return (
    <div className="bg-slate-50 rounded-xl p-6 shadow hover:shadow-xl transition">
      <div className="text-5xl">
        {icon}
      </div>

      <h3 className="text-xl font-semibold mt-5">
        {title}
      </h3>

      <p className="text-gray-600 mt-3">
        {description}
      </p>
    </div>
  );
}

export default Card;
