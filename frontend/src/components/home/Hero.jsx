import { Link } from "react-router-dom";
import {
  FaUserShield,
  FaCheckCircle,
  FaBell,
  FaShieldAlt,
  FaRoute,
  FaClipboardList,
  FaChartPie,
  FaEnvelope,
  FaBuilding,
  FaTasks,
  FaUserCog,
} from "react-icons/fa";

function Hero() {
  const workflowSteps = [
    {
      number: "01",
      title: "Complaint Submitted",
      description: "Citizen submits a complaint with location, category, description, and supporting evidence.",
      icon: FaClipboardList,
      color: "bg-blue-50/80 border-blue-200/50 text-blue-600",
      numberColor: "text-blue-500",
    },
    {
      number: "02",
      title: "Complaint Verified",
      description: "The complaint is reviewed and validated before further processing.",
      icon: FaShieldAlt,
      color: "bg-purple-50/80 border-purple-200/50 text-purple-600",
      numberColor: "text-purple-500",
    },
    {
      number: "03",
      title: "Department Assigned",
      description: "The complaint is assigned to the appropriate department for handling.",
      icon: FaBuilding,
      color: "bg-orange-50/80 border-orange-200/50 text-orange-600",
      numberColor: "text-orange-500",
    },
    {
      number: "04",
      title: "Field Officer Assigned",
      description: "The Department Head assigns the complaint to a field officer.",
      icon: FaUserCog,
      color: "bg-teal-50/80 border-teal-200/50 text-teal-600",
      numberColor: "text-teal-500",
    },
    {
      number: "05",
      title: "Resolution in Progress",
      description: "The assigned officer updates the complaint status and uploads proof of work.",
      icon: FaTasks,
      color: "bg-blue-50/80 border-blue-200/50 text-blue-600",
      numberColor: "text-blue-500",
    },
    {
      number: "06",
      title: "Citizen Notified",
      description: "The citizen receives notifications about progress and status changes.",
      icon: FaBell,
      color: "bg-purple-50/80 border-purple-200/50 text-purple-600",
      numberColor: "text-purple-500",
    },
    {
      number: "07",
      title: "Complaint Closed",
      description: "The complaint is successfully resolved and officially closed.",
      icon: FaCheckCircle,
      color: "bg-green-50/80 border-green-200/50 text-green-600",
      numberColor: "text-green-500",
    },
  ];

  const handleScrollToFeatures = (e) => {
    e.preventDefault();
    const element = document.getElementById("features");
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <section id="home" className="relative bg-gradient-to-b from-slate-50 via-white to-slate-50/50 py-28 md:py-40 overflow-hidden">
      {/* Glow Effects */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(1deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-12px) scale(1.02); }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 7s ease-in-out infinite;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Subtle Glowing Circles */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[120px] opacity-15"></div>
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-[120px] opacity-15"></div>
      </div>

      <div className="max-w-[90rem] mx-auto px-6 relative z-10">
        
        {/* CENTERED HERO CONTENT SECTION */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-20 animate-fade-in">
          
          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
            Smart Complaint <br />
            Management System
            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Digitizing Municipal Resolution
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg text-slate-600 leading-relaxed mb-10 max-w-3xl">
            A secure digital platform that empowers citizens to report civic issues, enables administrators to manage complaints efficiently, allows department heads to coordinate field officers, and provides complete transparency throughout the complaint lifecycle.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Link
              to="/register"
              aria-label="Register a new citizen account and report a complaint"
              className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-full shadow-lg shadow-blue-600/25 hover:bg-blue-700 hover:shadow-blue-600/35 hover:-translate-y-0.5 transition-all duration-200 text-center"
            >
              Report a Complaint
            </Link>
            <a
              href="#features"
              onClick={handleScrollToFeatures}
              aria-label="Scroll down to explore system features"
              className="px-8 py-4 bg-white text-slate-700 font-semibold rounded-full border border-slate-200 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-0.5 transition-all duration-200 text-center"
            >
              Explore Features
            </a>
          </div>

          {/* Trust Badges Chips */}
          <div className="w-full">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              Core Capabilities
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { text: "Role-Based Access", icon: <FaUserShield /> },
                { text: "Automatic Routing", icon: <FaRoute /> },
                { text: "Complaint Tracking", icon: <FaClipboardList /> },
                { text: "Analytics Dashboard", icon: <FaChartPie /> },
                { text: "Email Notifications", icon: <FaEnvelope /> },
              ].map((badge, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3.5 py-2 bg-slate-100/80 border border-slate-200/40 rounded-full text-xs font-semibold text-slate-700 shadow-sm"
                >
                  <span className="text-blue-600" aria-hidden="true">{badge.icon}</span>
                  <span>{badge.text}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* WORKFLOW SECTION: Full Width Below Hero Content */}
        <div id="workflow" className="w-full max-w-[1700px] mx-auto animate-fade-in mt-24 lg:mt-28" style={{ animationDelay: '0.15s' }}>
          
          {/* Outer Container with Premium Glassmorphism */}
          <div className="w-full bg-slate-50/40 backdrop-blur-xl border border-slate-200/50 rounded-[36px] shadow-xl p-10 md:p-14 relative overflow-visible font-sans">
            
            {/* Decorative background glow inside the container */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-400/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-400/10 rounded-full blur-2xl pointer-events-none"></div>

            {/* Title Section */}
            <div className="text-center mb-16 relative z-10">
              <h2 className="text-2xl md:text-4xl font-extrabold text-slate-800 tracking-tight flex items-center justify-center gap-2.5">
                <span className="bg-blue-600 text-white p-1.5 rounded-lg text-xs leading-none" aria-hidden="true">
                  <FaClipboardList className="w-3.5 h-3.5" />
                </span>
                Complaint Resolution Workflow
              </h2>
              <p className="text-sm md:text-base text-slate-500 font-medium mt-3 max-w-2xl mx-auto">
                Follow the complete journey of a complaint from submission to successful resolution.
              </p>
              <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mx-auto mt-3.5"></div>
            </div>

            {/* Grid and Connectors Wrapper */}
            <div className="relative">
              
              {/* Desktop Connectors (visible only on lg screens - 7 columns) */}
              <div className="hidden lg:block absolute inset-0 pointer-events-none z-0">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none">
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#cbd5e1" />
                    </marker>
                  </defs>
                  
                  {/* Thin solid connectors between columns */}
                  <path d="M 12.6 50 L 15.9 50" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrow)" />
                  <path d="M 26.9 50 L 30.2 50" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrow)" />
                  <path d="M 41.2 50 L 44.5 50" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrow)" />
                  <path d="M 55.5 50 L 58.8 50" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrow)" />
                  <path d="M 69.8 50 L 73.1 50" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrow)" />
                  <path d="M 84.1 50 L 87.4 50" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrow)" />
                </svg>
              </div>

              {/* Tablet Connectors (visible only on md screens, hidden on lg - 4 columns) */}
              <div className="hidden md:block lg:hidden absolute inset-0 pointer-events-none z-0">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none">
                  <defs>
                    <marker id="arrow-tablet" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#cbd5e1" />
                    </marker>
                  </defs>
                  
                  {/* Step 1 -> 2 (Horizontal) */}
                  <path d="M 43 12.5 L 57 12.5" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrow-tablet)" />

                  {/* Step 2 -> 3 (Orthogonal Loop) */}
                  <path d="M 75 20.5 L 75 25 L 25 25 L 25 29.5" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrow-tablet)" />

                  {/* Step 3 -> 4 (Horizontal) */}
                  <path d="M 43 37.5 L 57 37.5" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrow-tablet)" />

                  {/* Step 4 -> 5 (Orthogonal Loop) */}
                  {/* Thin solid vertical elbow connector from Field Officer Assigned to Resolution in Progress */}
                  <path d="M 75 45.5 L 75 50 L 25 50 L 25 54.5" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrow-tablet)" />

                  {/* Step 5 -> 6 (Horizontal) */}
                  <path d="M 43 62.5 L 57 62.5" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrow-tablet)" />

                  {/* Step 6 -> 7 (Orthogonal Loop) */}
                  <path d="M 75 70.5 L 75 75 L 25 75 L 25 79.5" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrow-tablet)" />
                </svg>
              </div>

              {/* DESKTOP VIEW: 7 Columns in one clean horizontal workflow */}
              <div className="hidden lg:grid grid-cols-7 gap-x-6 relative z-10">
                {workflowSteps.map((step, idx) => {
                  const StepIcon = step.icon;
                  return (
                    <div key={idx} className="relative bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] hover:-translate-y-[6px] transition-all duration-300 flex flex-col justify-between lg:h-[340px] h-full group">
                      <div>
                        <div className="flex items-center justify-between w-full mb-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-inner ${step.color}`}>
                            <StepIcon className="w-5 h-5" />
                          </div>
                          <span className={`text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full ${step.color.split(' ')[0]} ${step.numberColor}`}>
                            STEP {step.number}
                          </span>
                        </div>
                        <h4 className="text-sm lg:text-base font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                          {step.title}
                        </h4>
                      </div>
                      <p className="text-[11px] lg:text-xs text-slate-500 leading-relaxed font-medium mt-3">
                        {step.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* TABLET VIEW: 2 Rows (visible only on md:block and lg:hidden) */}
              <div className="hidden md:grid lg:hidden grid-cols-4 auto-rows-fr gap-x-8 gap-y-12 max-w-5xl mx-auto relative z-10">
                {/* Row 1 (Steps 1, 2, 3, 4) */}
                {workflowSteps.slice(0, 4).map((step, idx) => {
                  const StepIcon = step.icon;
                  return (
                    <div key={idx} className="relative bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] hover:-translate-y-[6px] transition-all duration-300 flex flex-col justify-between md:h-[340px] h-full group">
                      <div>
                        <div className="flex items-center justify-between w-full mb-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-inner ${step.color}`}>
                            <StepIcon className="w-5 h-5" />
                          </div>
                          <span className={`text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full ${step.color.split(' ')[0]} ${step.numberColor}`}>
                            STEP {step.number}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                          {step.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium mt-3">
                        {step.description}
                      </p>
                    </div>
                  );
                })}

                {/* Row 2 (Steps 5, 6, 7) */}
                {workflowSteps.slice(4, 7).map((step, idx) => {
                  const StepIcon = step.icon;
                  return (
                    <div key={idx} className="relative bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] hover:-translate-y-[6px] transition-all duration-300 flex flex-col justify-between md:h-[340px] h-full group">
                      <div>
                        <div className="flex items-center justify-between w-full mb-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-inner ${step.color}`}>
                            <StepIcon className="w-5 h-5" />
                          </div>
                          <span className={`text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full ${step.color.split(' ')[0]} ${step.numberColor}`}>
                            STEP {step.number}
                          </span>
                        </div>
                        <h4 className="text-sm lg:text-base font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                          {step.title}
                        </h4>
                      </div>
                      <p className="text-[11px] lg:text-xs text-slate-500 leading-relaxed font-medium mt-3">
                        {step.description}
                      </p>
                    </div>
                  );
                })}
                {/* Empty cell to keep grid alignment */}
                <div className="opacity-0 pointer-events-none"></div>
              </div>

              {/* MOBILE VIEW: Vertical Stack with Timeline Line (visible on < md screens) */}
              <div className="block md:hidden relative pl-6 space-y-6">
                {/* Vertical Timeline Track */}
                <div className="absolute left-[24px] top-2 bottom-2 w-0.5 bg-slate-200 rounded-full"></div>

                {workflowSteps.map((step, idx) => {
                  const StepIcon = step.icon;
                  return (
                    <div key={idx} className="relative bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-x-[4px] transition-all duration-300 flex flex-col items-start group pl-12">
                      {/* Bullet Icon positioned exactly over the timeline */}
                      <div className={`absolute -left-[20px] top-4.5 w-10 h-10 rounded-full border shadow-md flex items-center justify-center bg-white z-10 transition-transform group-hover:scale-105 ${step.color}`}>
                        <StepIcon className="w-4 h-4" />
                      </div>
                      
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className={`text-xs font-black tracking-widest ${step.numberColor}`}>
                          STEP {step.number}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mb-0.5 group-hover:text-blue-600 transition-colors">
                        {step.title}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium mt-2">
                        {step.description}
                      </p>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>
        </div>


      </div>
    </section>
  );
}

export default Hero;
