import { Link } from "react-router-dom";
import heroImage from "../../assets/images/hero-dashboard.svg"; 
import StatCard from "../cards/StatCard";

function Hero() {
  return (
    <section className="bg-gradient-to-b from-slate-50 to-white py-24 overflow-hidden relative">
      {/* Background decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col items-center text-center">
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
          Report Smarter. <br />
          Track Faster. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Resolve Better.
          </span>
        </h1>

        <p className="mt-4 text-xl text-slate-600 max-w-2xl mb-10">
          The ultimate intelligent platform built to streamline complaints for citizens and empower administrators.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link
            to="/register"
            className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-full shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all duration-200"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="px-8 py-4 bg-white text-slate-700 font-semibold rounded-full border border-slate-200 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-0.5 transition-all duration-200"
          >
            Learn More
          </Link>
        </div>

        {/* Dashboard Image */}
        <div className="w-full max-w-5xl relative perspective-1000">
          <img 
            src={heroImage} 
            alt="SCMS Dashboard" 
            className="w-full h-auto drop-shadow-2xl hover:scale-[1.01] transition-transform duration-500"
          />
        </div>

      </div>

      {/* Statistics */}
      <div className="max-w-6xl mx-auto mt-24 px-6 grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
        <StatCard number="5000+" label="Users" />
        <StatCard number="12000+" label="Complaints" />
        <StatCard number="250+" label="Organizations" />
        <StatCard number="98%" label="Resolution Rate" />
      </div>
    </section>
  );
}

export default Hero;
