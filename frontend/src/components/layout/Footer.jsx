import { Link } from "react-router-dom";
import { FaLinkedin, FaGithub } from "react-icons/fa";
import { FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import { BRAND } from "@/constants/brand";

const Footer = () => {
  const handleScroll = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      {/* 2px Blue Gradient Line connecting CTA and Footer */}
      <div className="h-[2px] bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 w-full"></div>
      
      <footer className="bg-slate-950 text-slate-400 pt-16 pb-8">
        <div className="w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-20 xl:px-24 2xl:px-28 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 text-center md:text-left">
          {/* Column 1: SCMS Branding */}
          <div className="space-y-4">
            <h3 className="text-white text-xl font-semibold tracking-tight">SCMS</h3>
            <p className="text-sm leading-relaxed text-slate-400">
              Helping citizens report, track, and resolve complaints efficiently with complete transparency.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-white text-base font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="#hero"
                  onClick={(e) => handleScroll(e, "hero")}
                  className="inline-block transform hover:translate-x-1 transition-all duration-200 text-slate-300 hover:text-blue-400 cursor-pointer"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  onClick={(e) => handleScroll(e, "features")}
                  className="inline-block transform hover:translate-x-1 transition-all duration-200 text-slate-300 hover:text-blue-400 cursor-pointer"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#workflow"
                  onClick={(e) => handleScroll(e, "workflow")}
                  className="inline-block transform hover:translate-x-1 transition-all duration-200 text-slate-300 hover:text-blue-400 cursor-pointer"
                >
                  Workflow
                </a>
              </li>
              <li>
                <a
                  href="#why-choose"
                  onClick={(e) => handleScroll(e, "why-choose")}
                  className="inline-block transform hover:translate-x-1 transition-all duration-200 text-slate-300 hover:text-blue-400 cursor-pointer"
                >
                  Why Choose Us
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  onClick={(e) => handleScroll(e, "faq")}
                  className="inline-block transform hover:translate-x-1 transition-all duration-200 text-slate-300 hover:text-blue-400 cursor-pointer"
                >
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="#feedback"
                  onClick={(e) => handleScroll(e, "feedback")}
                  className="inline-block transform hover:translate-x-1 transition-all duration-200 text-slate-300 hover:text-blue-400 cursor-pointer"
                >
                  Feedback
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  onClick={(e) => handleScroll(e, "contact")}
                  className="inline-block transform hover:translate-x-1 transition-all duration-200 text-slate-300 hover:text-blue-400 cursor-pointer"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h3 className="text-white text-base font-semibold mb-4">Resources</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="#"
                  className="inline-block transform hover:translate-x-1 transition-all duration-200 text-slate-300 hover:text-blue-400 cursor-pointer"
                >
                  User Guide
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  onClick={(e) => handleScroll(e, "faq")}
                  className="inline-block transform hover:translate-x-1 transition-all duration-200 text-slate-300 hover:text-blue-400 cursor-pointer"
                >
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="inline-block transform hover:translate-x-1 transition-all duration-200 text-slate-300 hover:text-blue-400 cursor-pointer"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="inline-block transform hover:translate-x-1 transition-all duration-200 text-slate-300 hover:text-blue-400 cursor-pointer"
                >
                  Terms & Conditions
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Socials */}
          <div className="space-y-4">
            <h3 className="text-white text-base font-semibold">Contact</h3>
            <div className="space-y-5 text-sm">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <FiMail className="text-blue-400 w-5 h-5 shrink-0" />
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Email</p>
                  <a href="mailto:support@scms.com" className="inline-block transform hover:translate-x-1 transition-all duration-200 text-slate-300 hover:text-blue-400 cursor-pointer">
                    support@scms.com
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <FiPhone className="text-blue-400 w-5 h-5 shrink-0" />
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Phone</p>
                  <p className="text-slate-300 font-medium">+91 XXXXX XXXXX</p>
                </div>
              </div>
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <FiMapPin className="text-blue-400 w-5 h-5 shrink-0" />
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Location</p>
                  <p className="text-slate-300">India</p>
                </div>
              </div>
            </div>

            {/* Social Icons */}
            <div className="flex gap-4 justify-center md:justify-start pt-2">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-blue-400 hover:-translate-y-1 text-xl transition-all duration-200 transform"
                aria-label="LinkedIn"
              >
                <FaLinkedin />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-blue-400 hover:-translate-y-1 text-xl transition-all duration-200 transform"
                aria-label="GitHub"
              >
                <FaGithub />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="border-t border-slate-800 mt-12 pt-6 text-center text-sm space-y-1">
          <p className="text-slate-500 font-semibold">
            © {new Date().getFullYear()} {BRAND.appName}.
          </p>
          <p className="text-xs text-slate-500">
            Built for transparent, efficient, and citizen-centric complaint management.
          </p>
        </div>
      </footer>
    </>
  );
};

export default Footer;