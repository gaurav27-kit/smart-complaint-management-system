import { useEffect, useState } from "react";
import DashboardStats from "../../components/dashboard/DashboardStats";
import RecentComplaints from "../../components/dashboard/RecentComplaints";
import QuickActions from "../../components/dashboard/QuickActions";
import { getComplaints } from "../../services/complaintService";
import Logo from "@/components/common/Logo";

const Dashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const response = await getComplaints();

        const complaintsData = response.complaints || [];

        setComplaints(complaintsData.slice(0, 5));

        const calculatedStats = complaintsData.reduce(
          (acc, complaint) => {
            acc.total += 1;
            const status = complaint.status?.toLowerCase();
            if (status === "pending") acc.pending += 1;
            else if (status === "in_progress" || status === "in progress") acc.inProgress += 1;
            else if (status === "resolved") acc.resolved += 1;
            return acc;
          },
          { total: 0, pending: 0, inProgress: 0, resolved: 0 }
        );
        setStats(calculatedStats);
      } catch (error) {
        console.error("Dashboard Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-80">
        <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Logo iconOnly size="h-9" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Welcome back! Here's an overview of your complaints.
          </p>
        </div>
      </div>

      {/* Statistics */}
      <DashboardStats stats={stats} />

      {/* Bottom Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Complaints */}
        <div className="xl:col-span-2">
          <RecentComplaints complaints={complaints} />
        </div>

        {/* Quick Actions */}
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;