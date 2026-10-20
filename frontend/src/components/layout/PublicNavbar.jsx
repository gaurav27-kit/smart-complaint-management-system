import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import Logo from "../common/Logo";

const PublicNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  // Detect scroll position to toggle visual state shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Monitor active section based on scroll viewport intersection
  useEffect(() => {
    const sections = ["home", "features", "workflow", "faq", "feedback", "about", "contact"];
    
    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observerOptions = {
      root: null,
      rootMargin: "-45% 0px -45% 0px", // Trigger active section when section crosses center viewport
      threshold: 0,
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
      }
    });

    return () => {
      sections.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.unobserve(el);
      });
    };
  }, []);

  // Close mobile layout menu if width scales to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Smooth scroll helper linked to layout sections
  const handleScrollToSection = (e, sectionId) => {
    e.preventDefault();
    setIsOpen(false);

    if (sectionId === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setActiveSection("home");
    } else {
      const element = document.getElementById(sectionId);
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
        setActiveSection(sectionId);
      }
    }
  };

  const navItems = [
    { label: "Home", id: "home" },
    { label: "Features", id: "features" },
    { label: "Workflow", id: "workflow" },
    { label: "FAQ", id: "faq" },
    { label: "Feedback", id: "feedback" },
    { label: "About", id: "about" },
    { label: "Contact", id: "contact" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 w-full h-20 z-50 transition-all duration-300 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 ${
        isScrolled ? "shadow-[0_4px_30px_rgba(0,0,0,0.02)]" : ""
      }`}
      aria-label="SCMS Public Navigation"
    >
      <div className="max-w-[90rem] mx-auto px-6 lg:pl-6 lg:pr-12 h-full flex items-center justify-between relative">
        
        {/* Brand Logo & Title Section */}
        <div 
          onClick={(e) => handleScrollToSection(e, "home")}
          className="flex items-center gap-3 cursor-pointer select-none group z-10"
        >
          <Logo
            iconOnly={true}
            size="h-10"
            loading="eager"
            className="transition-transform duration-300 group-hover:scale-105"
          />
          <span className="font-semibold text-slate-900 text-sm sm:text-base lg:text-lg tracking-tight whitespace-nowrap">
            Smart Complaint Management System
          </span>
        </div>

        {/* Center Navigation Links (Hidden on Tablet/Mobile) */}
        <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-8 z-0">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleScrollToSection(e, item.id)}
                className={`relative py-1.5 text-sm font-semibold transition-colors duration-300 group focus-visible:outline-none ${
                  isActive ? "text-blue-600" : "text-slate-600 hover:text-blue-600"
                }`}
              >
                {item.label}
                {/* Underline slide animation */}
                <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ${
                  isActive ? "scale-x-100" : ""
                }`} />
              </a>
            );
          })}
        </div>

        {/* Right Action Buttons */}
        <div className="hidden lg:flex items-center gap-4 z-10">
          <Link
            to="/login"
            className="px-6 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-full shadow-sm hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none transition-all duration-200"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-full shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:bg-blue-700 hover:shadow-[0_6px_20px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 focus-visible:outline-none transition-all duration-200"
          >
            Register
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex lg:hidden items-center z-10">
          <button
            onClick={() => setIsOpen(!isOpen)}
            type="button"
            className="p-2 -mr-2 text-slate-600 hover:text-slate-950 focus-visible:outline-none rounded transition-colors"
            aria-expanded={isOpen}
            aria-label="Toggle Navigation Menu"
          >
            {isOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Slide-down Menu overlay */}
      <div
        className={`absolute top-20 left-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xl lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="px-6 py-8 flex flex-col gap-6">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleScrollToSection(e, item.id)}
                className={`text-base font-semibold transition-colors duration-200 py-1 ${
                  isActive ? "text-blue-600" : "text-slate-600 hover:text-blue-600"
                }`}
              >
                {item.label}
              </a>
            );
          })}
          <div className="h-[1px] bg-slate-200/60 my-1"></div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="w-full text-center py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              onClick={() => setIsOpen(false)}
              className="w-full text-center py-3 text-sm font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700 shadow-sm transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PublicNavbar;

