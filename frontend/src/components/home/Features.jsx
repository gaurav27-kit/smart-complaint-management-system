import {
  FaShieldAlt,
  FaChartLine,
  FaBell,
  FaRobot,
  FaUsers,
  FaClipboardList,
} from "react-icons/fa";

import FeatureCard from "../cards/FeatureCard";
import SectionTitle from "../ui/SectionTitle";

function Features() {

  const features = [

    {
      icon: <FaClipboardList />,
      title: "Complaint Submission",
      description:
        "Submit complaints quickly with image uploads and detailed descriptions.",
    },

    {
      icon: <FaChartLine />,
      title: "Real-Time Tracking",
      description:
        "Monitor complaint status from submission to resolution.",
    },

    {
      icon: <FaShieldAlt />,
      title: "Secure Authentication",
      description:
        "JWT authentication with encrypted passwords keeps accounts safe.",
    },

    {
      icon: <FaBell />,
      title: "Instant Notifications",
      description:
        "Receive updates whenever complaint status changes.",
    },

    {
      icon: <FaRobot />,
      title: "AI Categorization",
      description:
        "Automatically classify complaints using AI.",
    },

    {
      icon: <FaUsers />,
      title: "Admin Dashboard",
      description:
        "Assign, manage, and resolve complaints efficiently.",
    },

  ];

  return (

    <section
      id="features"
      className="py-24 bg-gray-50"
    >

      <div className="max-w-7xl mx-auto px-6">

        <SectionTitle
          title="Everything You Need"
          subtitle="Powerful tools for citizens and administrators."
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

          {features.map((feature, index) => (

            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />

          ))}

        </div>

      </div>

    </section>

  );
}

export default Features;