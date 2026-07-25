import { useState } from "react";

import SectionTitle from "../ui/SectionTitle";
import FAQCard from "../cards/FAQCard";

function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: "How do I submit a complaint?",
      answer:
        "Log in, click 'Report Complaint', fill in the details, and submit the form.",
    },
    {
      question: "Can I track my complaint?",
      answer: "Yes. You can monitor the complaint status from your dashboard.",
    },
    {
      question: "Can I upload images as proof?",
      answer: "Yes. You can attach images to support your complaint.",
    },
    {
      question: "Who can view my complaint?",
      answer:
        "Only authorized administrators and the complaint owner can access it.",
    },
    {
      question: "Will I receive notifications?",
      answer: "Yes. You'll be notified whenever the complaint status changes.",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <SectionTitle
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about SCMS."
        />

        <div className="space-y-5">
          {faqs.map((faq, index) => (
            <FAQCard
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQ;
