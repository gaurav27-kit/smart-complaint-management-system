const Loading = ({ message = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      <p className="mt-4 text-gray-500 font-medium">{message}</p>
    </div>
  );
};

export default Loading;
