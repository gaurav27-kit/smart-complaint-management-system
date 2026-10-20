import { useState } from "react";
import { NavLink } from "react-router-dom";
import Logo from "@/components/common/Logo";
import { BRAND } from "@/constants/brand";
import { FiChevronLeft, FiChevronRight, FiGrid, FiInbox, FiPieChart, FiSettings, FiBell } from "react-icons/fi";

const DepartmentMemberSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const linkClass = ({ isActive }) =>
    `group relative flex items-center rounded-xl gap-4 transition-all duration-300 ${
      isCollapsed ? "justify-center p-3" : "px-4 py-3"
    } ${
      isActive
        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    }`;

  return (
    <aside
      className={`min-h-screen bg-slate-900 text-white flex flex-col shadow-lg transition-all duration-300 shrink-0 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Brand Header: Reduced height & simplified */}
      <div className="p-3 border-b border-slate-800 flex flex-col items-center justify-center h-[72px] shrink-0">
        <Logo iconOnly size="h-8" alt="SCMS Sidebar Icon" />
        {!isCollapsed && (
          <span className="text-[11px] font-bold tracking-widest uppercase text-white mt-1 animate-fadeIn">
            SCMS
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
        <NavLink to="/member" end className={linkClass}>
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r" />
              )}
              <span className="flex items-center gap-4 w-full">
                <FiGrid className="text-[20px] shrink-0" />
                {!isCollapsed && <span className="text-sm font-medium truncate">Dashboard</span>}
              </span>
            </>
          )}
        </NavLink>

        <NavLink to="/member/assigned-complaints" className={linkClass}>
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r" />
              )}
              <span className="flex items-center gap-4 w-full">
                <FiInbox className="text-[20px] shrink-0" />
                {!isCollapsed && <span className="text-sm font-medium truncate">Assigned Complaints</span>}
              </span>
            </>
          )}
        </NavLink>

        <NavLink to="/member/notifications" className={linkClass}>
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r" />
              )}
              <span className="flex items-center gap-4 w-full">
                <FiBell className="text-[20px] shrink-0" />
                {!isCollapsed && <span className="text-sm font-medium truncate">Notifications</span>}
              </span>
            </>
          )}
        </NavLink>

        <NavLink to="/member/workload" className={linkClass}>
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r" />
              )}
              <span className="flex items-center gap-4 w-full">
                <FiPieChart className="text-[20px] shrink-0" />
                {!isCollapsed && <span className="text-sm font-medium truncate">My Workload</span>}
              </span>
            </>
          )}
        </NavLink>

        <NavLink to="/member/settings" className={linkClass}>
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r" />
              )}
              <span className="flex items-center gap-4 w-full">
                <FiSettings className="text-[20px] shrink-0" />
                {!isCollapsed && <span className="text-sm font-medium truncate">Settings</span>}
              </span>
            </>
          )}
        </NavLink>
      </nav>

      {/* Collapse Toggle Button */}
      <div className="p-3 border-t border-slate-800 flex justify-center">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <FiChevronRight className="w-4 h-4" /> : <FiChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800 text-center text-[10px] text-gray-500 truncate">
        {isCollapsed ? "©" : `© ${new Date().getFullYear()} ${BRAND.shortName}`}
      </div>
    </aside>
  );
};

export default DepartmentMemberSidebar;

