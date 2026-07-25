import {
  FaRobot,
  FaShieldAlt,
  FaChartLine,
  FaBell,
  FaClipboardCheck,
  FaUserShield,
} from "react-icons/fa";

import SectionTitle from "../ui/SectionTitle";

function WhyChoose() {
  const points = [
    {
      icon: <FaRobot />,
      title: "AI Powered Categorization",
      description: "Automatically categorize complaints for faster resolution.",
    },

    {
      icon: <FaClipboardCheck />,
      title: "Real-Time Tracking",
      description: "Track complaint status from submission to resolution.",
    },

    {
      icon: <FaShieldAlt />,
      title: "Secure Authentication",
      description: "JWT authentication keeps every account secure.",
    },

    {
      icon: <FaUserShield />,
      title: "Smart Admin Dashboard",
      description: "Admins can assign and manage complaints efficiently.",
    },

    {
      icon: <FaBell />,
      title: "Instant Notifications",
      description: "Receive updates whenever complaint status changes.",
    },

    {
      icon: <FaChartLine />,
      title: "Analytics & Reports",
      description:
        "Visual dashboards help organizations analyze complaint trends.",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <SectionTitle
          title="Why Choose SCMS?"
          subtitle="Everything you need for modern complaint management."
        />

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}

          <div className="space-y-8">
            {points.map((item, index) => (
              <div key={index} className="flex gap-5">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl">
                  {item.icon}
                </div>

                <div>
                  <h3 className="text-xl font-semibold">{item.title}</h3>

                  <p className="text-gray-600 mt-2">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right */}

          <div className="flex justify-center">
            <img
              src="https://placehold.co/500x500"
              alt="Why Choose SCMS"
              className="rounded-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default WhyChoose;
