import React from "react";
import DashboardCard from "../cards/DashboardCard";
import {
  FiInbox,
  FiClock,
  FiActivity,
  FiCheckCircle,
} from "react-icons/fi";

const DashboardStats = ({ stats }) => {
  const {
    total = 0,
    pending = 0,
    inProgress = 0,
    resolved = 0,
  } = stats || {};

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      <DashboardCard
        title="Total Complaints"
        value={total}
        icon={FiInbox}
        color="indigo"
        description="All complaints submitted"
      />

      <DashboardCard
        title="Pending"
        value={pending}
        icon={FiClock}
        color="yellow"
        description="Waiting for action"
      />

      <DashboardCard
        title="In Progress"
        value={inProgress}
        icon={FiActivity}
        color="blue"
        description="Currently being resolved"
      />

      <DashboardCard
        title="Resolved"
        value={resolved}
        icon={FiCheckCircle}
        color="green"
        description="Successfully completed"
      />
    </div>
  );
};

export default DashboardStats;