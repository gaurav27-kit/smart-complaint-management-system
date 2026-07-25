import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";

const CTA = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
      <div className="max-w-7xl mx-auto px-6 text-center text-white">

        <h2 className="text-4xl md:text-5xl font-bold">
          Ready to Make Every Complaint Count?
        </h2>

        <p className="mt-5 text-lg text-blue-100 max-w-2xl mx-auto">
          Join SCMS today and experience a faster, smarter, and more transparent
          complaint management system.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">

          <Link
            to="/register"
            className="bg-white text-blue-700 px-8 py-4 rounded-xl font-semibold hover:scale-105 transition duration-300"
          >
            Get Started
          </Link>

          <Link
            to="/login"
            className="border border-white px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-white hover:text-blue-700 transition duration-300"
          >
            Login
            <FaArrowRight />
          </Link>

        </div>

      </div>
    </section>
  );
};

export default CTA;