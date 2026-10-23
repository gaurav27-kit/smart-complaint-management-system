import { Users, Building2, HardHat, ChartNoAxesCombined } from "lucide-react";

function WhoWeServe() {
  const roles = [
    {
      title: "Citizens",
      description: "A convenient way to raise civic concerns and stay informed.",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      title: "Administrators",
      description: "A central view for managing complaints and coordinating departments.",
      icon: Building2,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
    },
    {
      title: "Department Teams",
      description: "Tools to review assigned complaints and record progress.",
      icon: HardHat,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
    {
      title: "Department Heads",
      description: "Oversight of departmental complaints and resolution progress.",
      icon: ChartNoAxesCombined,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
  ];

  return (
    <section
      id="who-we-serve"
      className="py-24 bg-gradient-to-b from-white via-slate-50/70 to-slate-50/40 border-t border-slate-150/60 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold tracking-widest text-blue-600 uppercase bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200/50">
            DESIGNED FOR CIVIC SERVICES
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mt-4 mb-4">
            Who We Serve
          </h2>
          <p className="text-slate-600 text-base md:text-lg">
            Connecting citizens and municipal teams through one complaint management platform.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.title}
                className="bg-white border border-slate-200/80 rounded-2xl p-7 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${role.bg} ${role.border} border flex items-center justify-center ${role.color} mb-6 group-hover:scale-105 transition-transform`}
                  aria-hidden="true"
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {role.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  {role.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default WhoWeServe;
