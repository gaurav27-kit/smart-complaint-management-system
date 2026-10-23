import {
  FaClipboardList,
  FaSearch,
  FaTools,
  FaCheckCircle,
  FaArrowRight,
} from "react-icons/fa";

function Statistics() {
  const stages = [
    {
      step: "01",
      name: "Report",
      description: "A citizen submits a complaint.",
      icon: FaClipboardList,
      accentColor: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
      badgeColor: "bg-blue-100/80 text-blue-700",
    },
    {
      step: "02",
      name: "Review",
      description: "The complaint is reviewed and directed for handling.",
      icon: FaSearch,
      accentColor: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-100",
      badgeColor: "bg-indigo-100/80 text-indigo-700",
    },
    {
      step: "03",
      name: "Action",
      description: "The responsible team works on the issue.",
      icon: FaTools,
      accentColor: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-100",
      badgeColor: "bg-amber-100/80 text-amber-700",
    },
    {
      step: "04",
      name: "Resolution",
      description: "The complaint outcome and status are recorded.",
      icon: FaCheckCircle,
      accentColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-100",
      badgeColor: "bg-emerald-100/80 text-emerald-700",
    },
  ];

  return (
    <section
      id="statistics"
      className="py-24 bg-gradient-to-b from-white via-slate-50/70 to-slate-50/40 border-t border-slate-150/60 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold tracking-widest text-blue-600 uppercase bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200/50">
            Lifecycle
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mt-4 mb-4">
            From Report to Resolution
          </h2>
          <p className="text-slate-600 text-base md:text-lg">
            A clear, four-stage journey ensuring civic concerns are tracked with accountability from intake to closure.
          </p>
        </div>

        {/* Simple Horizontal, Responsive Journey */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 relative">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.step}
                className="relative bg-white border border-slate-200/80 rounded-2xl p-7 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`w-12 h-12 rounded-xl ${stage.bgColor} ${stage.borderColor} border flex items-center justify-center ${stage.accentColor} text-xl shadow-xs group-hover:scale-105 transition-transform`}
                      aria-hidden="true"
                    >
                      <Icon />
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${stage.badgeColor}`}
                    >
                      Stage {stage.step}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {stage.name}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {stage.description}
                  </p>
                </div>

                {/* Horizontal Arrow Indicator for Desktop View (except last stage) */}
                {index < stages.length - 1 && (
                  <div
                    className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-slate-200 items-center justify-center text-slate-400 z-20 shadow-xs pointer-events-none"
                    aria-hidden="true"
                  >
                    <FaArrowRight className="text-xs" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Statistics;