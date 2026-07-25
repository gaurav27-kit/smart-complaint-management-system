import SectionTitle from "../ui/SectionTitle";
import TestimonialCard from "../cards/TestimonialCard";

function Testimonials() {

  const testimonials = [

    {
      name: "Siddharth Chavan",
      role: "Municipal Officer",
      message:
        "The complaint tracking system is fast, reliable, and easy to use.",
    },

    {
      name: "Yash Lad",
      role: "Administrator",
      message:
        "Managing complaints has become much easier with the admin dashboard.",
    },

    {
      name: "Rohit Mithari",
      role: "Citizen",
      message:
        "I can track every complaint without visiting government offices.",
    },

  ];

  return (

    <section id="testimonials" className="py-24 bg-gray-50">

      <div className="max-w-7xl mx-auto px-6">

        <SectionTitle
          title="What Our Users Say"
          subtitle="Trusted by citizens and organizations."
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

          {testimonials.map((item, index) => (

            <TestimonialCard
              key={index}
              name={item.name}
              role={item.role}
              message={item.message}
            />

          ))}

        </div>

      </div>

    </section>

  );

}

export default Testimonials;