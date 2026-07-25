import { FiFolder } from "react-icons/fi";

const EmptyState = ({ 
  title = "No complaints found", 
  message = "You haven't submitted any complaints yet.", 
  actionLabel, 
  onAction 
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-white border border-dashed border-gray-300 rounded-lg py-12">
      <div className="p-3 bg-gray-50 rounded-full text-gray-400 mb-4">
        <FiFolder className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-gray-500 max-w-sm mb-6">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
