import { useState } from "react";
import FAQCard from "../cards/FAQCard";

function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "How do I track my complaint?",
      answer: "You can track your complaint status from your dashboard after logging in."
    },
    {
      question: "Who can view my complaints?",
      answer: "Only you and the assigned administrators can view your complaints. Your data is kept secure and private."
    },
    {
      question: "Can I upload images with my complaint?",
      answer: "Yes, you can upload up to 3 images to provide visual evidence and help us understand the issue better."
    },
    {
      question: "How long does it typically take to resolve a complaint?",
      answer: "Resolution times vary depending on the complexity of the issue, but our team aims to address all critical complaints within 48 hours."
    },
    {
      question: "Is there a mobile app available?",
      answer: "Our web platform is fully mobile-responsive, so you can easily submit and track complaints from any smartphone browser."
    }
  ];

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
        <div className="space-y-5">
          {faqs.map((faq, index) => (
            <FAQCard
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() =>
                setOpenIndex(openIndex === index ? null : index)
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQ;
