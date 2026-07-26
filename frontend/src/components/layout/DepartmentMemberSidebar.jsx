import { useState } from "react";
import { NavLink } from "react-router-dom";
import Logo from "@/components/common/Logo";
import { BRAND } from "@/constants/brand";
import { FiChevronLeft, FiChevronRight, FiGrid, FiInbox, FiPieChart, FiKey, FiBell } from "react-icons/fi";

const DepartmentMemberSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const linkClass = ({ isActive }) =>
    `flex items-center rounded-lg transition-all duration-200 ${
      isCollapsed ? "justify-center p-3" : "px-4 py-3"
    } ${
      isActive
        ? "bg-blue-600 text-white"
        : "text-gray-300 hover:bg-slate-700 hover:text-white"
    }`;

  return (
    <aside
      className={`min-h-screen bg-slate-900 text-white flex flex-col shadow-lg transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-700 flex flex-col items-center justify-center min-h-[100px]">
        <Logo iconOnly size="h-10" alt={`${BRAND.shortName} Sidebar Icon`} />
        {!isCollapsed && (
          <div className="text-center mt-3 animate-fadeIn">
            <h1 className="text-sm font-bold tracking-wider uppercase text-white">
              {BRAND.shortName}
            </h1>
            <p className="text-[10px] text-gray-400 mt-1 max-w-[200px] leading-tight">
              Member Workspace
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
        <NavLink to="/member" end className={linkClass}>
          <span className="flex items-center gap-3">
            <FiGrid className="text-lg shrink-0" />
            {!isCollapsed && <span className="text-sm truncate">Dashboard</span>}
          </span>
        </NavLink>

        <NavLink to="/member/assigned-complaints" className={linkClass}>
          <span className="flex items-center gap-3">
            <FiInbox className="text-lg shrink-0" />
            {!isCollapsed && <span className="text-sm truncate">Assigned Complaints</span>}
          </span>
        </NavLink>

        <NavLink to="/member/notifications" className={linkClass}>
          <span className="flex items-center gap-3">
            <FiBell className="text-lg shrink-0" />
            {!isCollapsed && <span className="text-sm truncate">Notifications</span>}
          </span>
        </NavLink>

        <NavLink to="/member/workload" className={linkClass}>
          <span className="flex items-center gap-3">
            <FiPieChart className="text-lg shrink-0" />
            {!isCollapsed && <span className="text-sm truncate">My Workload</span>}
          </span>
        </NavLink>

        <NavLink to="/member/change-password" className={linkClass}>
          <span className="flex items-center gap-3">
            <FiKey className="text-lg shrink-0" />
            {!isCollapsed && <span className="text-sm truncate">Change Password</span>}
          </span>
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
