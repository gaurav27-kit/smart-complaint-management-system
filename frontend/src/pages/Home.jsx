import PublicNavbar from "../components/layout/PublicNavbar";
import Hero from "../components/home/Hero";
import Features from "../components/home/Features";
import WhoWeServe from "../components/home/WhoWeServe";
import WhyChoose from "../components/home/WhyChoose";
import Testimonials from "../components/home/Testimonials";
import FAQ from "../components/home/FAQ";
import CTA from "../components/home/CTA";
import Footer from "../components/layout/Footer";
function Home() {
  return (
    <>
      <PublicNavbar />
      <Hero />
      <Features />
      <WhyChoose />
      <WhoWeServe />
      <Testimonials/>
      <FAQ/>
      <CTA/>
      <Footer/>
    </>
  );
}

export default Home;