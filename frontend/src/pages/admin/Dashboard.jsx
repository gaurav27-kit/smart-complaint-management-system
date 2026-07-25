import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  FileText,
  Clock,
  Loader,
  CheckCircle,
} from "lucide-react";

import { getDashboardStats } from "../../services/adminService";
import Logo from "@/components/common/Logo";

const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await getDashboardStats();
      setDashboard(res.dashboard);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader className="animate-spin w-10 h-10 text-blue-600" />
      </div>
    );
  }

  const cards = [
    {
      title: "Total Users",
      value: dashboard.totalUsers,
      icon: <Users size={28} />,
      color: "bg-blue-500",
    },
    {
      title: "Total Complaints",
      value: dashboard.totalComplaints,
      icon: <FileText size={28} />,
      color: "bg-indigo-500",
    },
    {
      title: "Pending",
      value: dashboard.pending,
      icon: <Clock size={28} />,
      color: "bg-yellow-500",
    },
    {
      title: "Resolved",
      value: dashboard.resolved,
      icon: <CheckCircle size={28} />,
      color: "bg-green-500",
    },
  ];

  return (
    <div className="p-6">

      <div className="flex items-center gap-3 mb-8">
        <Logo iconOnly size="h-9" />
        <h1 className="text-3xl font-bold">
          Admin Dashboard
        </h1>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">

        {cards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-md p-6 flex justify-between items-center"
          >
            <div>
              <p className="text-gray-500">{card.title}</p>

              <h2 className="text-3xl font-bold mt-2">
                {card.value}
              </h2>
            </div>

            <div
              className={`${card.color} text-white p-4 rounded-full`}
            >
              {card.icon}
            </div>
          </div>
        ))}

      </div>

      <div className="mt-10 bg-white rounded-xl shadow-md p-6">

        <h2 className="text-xl font-semibold mb-5">
          Quick Actions
        </h2>

        <div className="flex gap-4 flex-wrap">

          <Link
            to="/admin/complaints"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg"
          >
            Manage Complaints
          </Link>

          <Link
            to="/admin/analytics"
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg"
          >
            View Analytics
          </Link>

        </div>

      </div>

    </div>
  );
};

export default Dashboard;