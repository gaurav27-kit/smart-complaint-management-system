import { Outlet } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";

const UserLayout = () => {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

export default UserLayout;