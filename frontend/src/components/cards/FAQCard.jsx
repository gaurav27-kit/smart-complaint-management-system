import { FaChevronDown, FaChevronUp } from "react-icons/fa";

function FAQCard({
  question,
  answer,
  isOpen,
  onClick,
}) {
  return (
    <div className="border rounded-xl overflow-hidden bg-white shadow-sm">

      <button
        onClick={onClick}
        className="w-full flex justify-between items-center p-5 text-left hover:bg-gray-50 transition"
      >
        <span className="font-semibold">
          {question}
        </span>

        {isOpen ? (
          <FaChevronUp />
        ) : (
          <FaChevronDown />
        )}
      </button>

      {isOpen && (
        <div className="px-5 pb-5 text-gray-600">
          {answer}
        </div>
      )}

    </div>
  );
}

export default FAQCard;