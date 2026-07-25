import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FiPlusCircle,
  FiList,
  FiArrowRight,
} from "react-icons/fi";

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: "Create Complaint",
      description: "Report a new issue quickly.",
      icon: FiPlusCircle,
      path: "/dashboard/create-complaint",
      primary: true,
    },
    {
      title: "My Complaints",
      description: "View and manage your submitted complaints.",
      icon: FiList,
      path: "/dashboard/my-complaints",
      primary: false,
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-5">
        Quick Actions
      </h2>

      <div className="space-y-4">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.title}
              onClick={() => navigate(action.path)}
              className={`w-full rounded-xl p-5 flex items-center justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                action.primary
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    action.primary
                      ? "bg-white/20"
                      : "bg-indigo-100 text-indigo-600"
                  }`}
                >
                  <Icon className="text-xl" />
                </div>

                <div className="text-left">
                  <h3 className="font-semibold">
                    {action.title}
                  </h3>

                  <p
                    className={`text-sm ${
                      action.primary
                        ? "text-indigo-100"
                        : "text-gray-500"
                    }`}
                  >
                    {action.description}
                  </p>
                </div>
              </div>

              <FiArrowRight
                className={`text-xl ${
                  action.primary
                    ? "text-white"
                    : "text-gray-400"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;