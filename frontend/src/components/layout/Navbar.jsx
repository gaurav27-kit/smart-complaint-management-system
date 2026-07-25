import { useAuth } from "../../context/AuthContext";
import { FiMenu, FiBell, FiSearch } from "react-icons/fi";
import Logo from "@/components/common/Logo";
import { BRAND } from "@/constants/brand";

const Navbar = () => {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 h-16 shrink-0 flex items-center justify-between px-4 sm:px-6 z-10 shadow-sm">
      <div className="flex items-center flex-1 gap-4">
        <button className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
          <FiMenu className="w-6 h-6" />
        </button>
        
        {/* Responsive Brand Header Section */}
        <div className="flex items-center">
          {/* Desktop: Full Logo + Project Name */}
          <div className="hidden md:flex items-center gap-3">
            <Logo size="h-7" loading="eager" />
            <span className="text-gray-400 font-light">|</span>
            <span className="font-semibold text-gray-800 text-sm hidden lg:inline tracking-wide">
              {BRAND.appName}
            </span>
            <span className="font-semibold text-gray-800 text-sm inline lg:hidden tracking-wide">
              {BRAND.shortName}
            </span>
          </div>

          {/* Mobile: Icon Logo only */}
          <div className="flex md:hidden items-center">
            <Logo iconOnly size="h-8" loading="eager" />
          </div>
        </div>
        
        {/* Optional Search Bar for Enterprise Feel */}
        <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500 transition-all w-64">
          <FiSearch className="text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-transparent border-none focus:outline-none text-sm ml-2 w-full text-gray-700 placeholder-gray-400"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-3 sm:space-x-5">
        <button className="p-2 text-gray-400 hover:text-indigo-600 relative transition-colors rounded-full hover:bg-gray-50">
          <FiBell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
        </button>
        
        <div className="flex items-center space-x-3 border-l pl-4 sm:pl-5 border-gray-200">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-semibold text-gray-900 leading-none">
              {user?.fullName || "Guest User"}
            </span>
            <span className="text-xs text-indigo-600 font-medium capitalize mt-1">
              {user?.role || "user"}
            </span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white">
            {user?.fullName?.charAt(0).toUpperCase() || "U"}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
