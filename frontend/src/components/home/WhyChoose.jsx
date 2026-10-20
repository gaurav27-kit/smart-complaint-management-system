import {
  FaBolt,
  FaEye,
  FaHandshake,
  FaShieldAlt,
  FaUsers,
  FaChartLine,
} from "react-icons/fa";

function WhyChoose() {
  const cards = [
    {
      icon: FaBolt,
      title: "Faster Complaint Resolution",
      description:
        "Automated workflows and structured complaint handling help departments resolve issues faster while improving service efficiency.",
    },
    {
      icon: FaEye,
      title: "Complete Transparency",
      description:
        "Track every complaint from submission to closure with real-time status updates and a complete activity timeline.",
    },
    {
      icon: FaHandshake,
      title: "Better Accountability",
      description:
        "Every complaint is assigned, monitored, and recorded, ensuring clear responsibility throughout the resolution process.",
    },
    {
      icon: FaShieldAlt,
      title: "Secure Platform",
      description:
        "JWT authentication, encrypted credentials, and role-based access control protect user data and system operations.",
    },
    {
      icon: FaUsers,
      title: "Citizen-Centric Experience",
      description:
        "A simple interface, live complaint tracking, and instant notifications provide a better experience for every citizen.",
    },
    {
      icon: FaChartLine,
      title: "Data-Driven Decisions",
      description:
        "Interactive dashboards and analytics help administrators monitor performance, identify trends, and improve public service delivery.",
    },
  ];

  return (
    <section id="about" className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-[700px] mx-auto pt-[80px] pb-[60px]">
          <h2 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Why Choose Smart Complaint Management System?
          </h2>
          <p className="text-slate-600 text-lg">
            Discover how SCMS enhances transparency, accountability, security, and efficiency for citizens and government departments.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <article
                key={index}
                tabIndex={0}
                className="group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm transition-all duration-300 hover:-translate-y-[6px] hover:shadow-lg hover:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 flex flex-col h-full"
              >
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-[#2563EB] transition-all duration-300 mb-6 shrink-0">
                  <IconComponent className="text-2xl" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors duration-300 mb-3">
                  {card.title}
                </h3>
                <p className="text-slate-600 leading-7 flex-grow">
                  {card.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default WhyChoose;


