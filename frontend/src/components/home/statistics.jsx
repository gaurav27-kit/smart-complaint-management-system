import {
  FaUsers,
  FaClipboardList,
  FaBuilding,
  FaSmile,
} from "react-icons/fa";

import StatCard from "../cards/StatCard";
import SectionTitle from "../ui/SectionTitle";

function Statistics() {

  const stats = [

    {
      icon: <FaUsers />,
      number: "5,000+",
      label: "Registered Users",
    },

    {
      icon: <FaClipboardList />,
      number: "12,000+",
      label: "Complaints Submitted",
    },

    {
      icon: <FaBuilding />,
      number: "250+",
      label: "Organizations",
    },

    {
      icon: <FaSmile />,
      number: "98%",
      label: "User Satisfaction",
    },

  ];

  return (

    <section
      id="statistics"
      className="py-24 bg-gradient-to-r from-blue-50 to-slate-100"
    >

      <div className="max-w-7xl mx-auto px-6">

        <SectionTitle
          title="Our Impact"
          subtitle="Numbers that reflect trust and efficiency."
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">

          {stats.map((item, index) => (

            <StatCard
              key={index}
              icon={item.icon}
              number={item.number}
              label={item.label}
            />

          ))}

        </div>

      </div>

    </section>

  );
}

export default Statistics;