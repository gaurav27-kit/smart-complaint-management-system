import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const DashboardLayout = ({ children, isAdmin = false }) => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar isAdmin={isAdmin} />

      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="p-6 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;