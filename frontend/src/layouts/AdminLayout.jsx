import { Outlet } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";

const AdminLayout = () => {
  return (
    <DashboardLayout isAdmin>
      <Outlet />
    </DashboardLayout>
  );
};

export default AdminLayout;