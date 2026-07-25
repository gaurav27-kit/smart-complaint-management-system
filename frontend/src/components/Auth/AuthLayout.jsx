const AuthLayout = ({ title, subtitle, children }) => {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-md p-8">

        <h1 className="text-3xl font-bold text-center text-slate-800">
          {title}
        </h1>

        <p className="text-center text-gray-500 mt-2 mb-8">
          {subtitle}
        </p>

        {children}

      </div>
    </div>
  );
};

export default AuthLayout;