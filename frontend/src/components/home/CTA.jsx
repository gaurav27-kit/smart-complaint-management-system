import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const CTA = () => {
  const { user } = useAuth();

  const getDestinationPath = () => {
    if (user) {
      if (user.role === "admin") return "/admin";
      if (user.role === "department_member") return "/member";
      return "/dashboard/create-complaint";
    }
    return "/register";
  };

  return (
    <section id="contact" className="py-14 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700">
      <div className="max-w-7xl mx-auto px-6 text-center text-white space-y-5">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
          Ready to Make Every Complaint Count?
        </h2>

        <p className="text-base md:text-lg text-white/85 max-w-[650px] mx-auto leading-relaxed">
          Empowering citizens and authorities with a smarter, faster, and more transparent complaint management platform.
        </p>

        <div className="pt-2">
          <Link
            to={getDestinationPath()}
            state={!user ? { redirectTo: "/dashboard/create-complaint" } : undefined}
            className="inline-block bg-white text-blue-600 px-8 py-3.5 rounded-full font-bold shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
          >
            Report a Complaint
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTA;