import whyChooseImage from "../../assets/images/why-choose.svg";

function WhyChoose() {
  return (
    <section id="why-choose" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Us</h2>
        <p className="text-gray-600 mb-8">Discover the benefits of using our smart complaint system.</p>
        <div className="mt-8 flex justify-center">
          <img
            src={whyChooseImage}
            alt="Why Choose SCMS"
            className="w-full max-w-lg rounded-xl shadow-sm"
          />
        </div>
      </div>
    </section>
  );
}

export default WhyChoose;
