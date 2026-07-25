import { FaStar } from "react-icons/fa";

function TestimonialCard({
  name,
  role,
  message,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-8 hover:shadow-xl transition duration-300">

      <div className="flex text-yellow-400 mb-4">
        <FaStar />
        <FaStar />
        <FaStar />
        <FaStar />
        <FaStar />
      </div>

      <p className="text-gray-600 italic">
        "{message}"
      </p>

      <div className="mt-6">
        <h3 className="font-bold text-lg">
          {name}
        </h3>

        <p className="text-gray-500 text-sm">
          {role}
        </p>
      </div>

    </div>
  );
}

export default TestimonialCard;