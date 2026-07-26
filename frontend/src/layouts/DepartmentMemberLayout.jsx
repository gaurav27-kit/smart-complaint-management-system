import { Outlet } from "react-router-dom";
import DepartmentMemberSidebar from "../components/layout/DepartmentMemberSidebar";
import Navbar from "../components/layout/Navbar";

const DepartmentMemberLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <DepartmentMemberSidebar />

      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="p-6 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DepartmentMemberLayout;
