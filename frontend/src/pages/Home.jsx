import Navbar from "../components/layout/Navbar";
import Hero from "../components/home/Hero";
import Features from "../components/home/Features";
import Statistics from "../components/home/Statistics";
import WhyChoose from "../components/home/WhyChoose";
import Testimonials from "../components/home/Testimonials";
import FAQ from "../components/home/FAQ";
import CTA from "../components/home/CTA";
import Footer from "../components/layout/Footer";
function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <WhyChoose />
      <Statistics />
      <Testimonials/>
      <FAQ/>
      <CTA/>
      <Footer/>
    </>
  );
}

export default Home;