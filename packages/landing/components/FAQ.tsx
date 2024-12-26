import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function FAQ() {
  const faqs = [
    {
      question: "What is File Organizer 2000?",
      answer: "File Organizer 2000 is an open-source plugin that uses AI to automate note organization, featuring AI chat, automatic organization suggestions, and more."
    },
    {
      question: "Is it compatible with Obsidian?",
      answer: "Yes, File Organizer 2000 is designed to work seamlessly with Obsidian, allowing you to organize your notes efficiently."
    },
    {
      question: "Can I use it with my own AI models?",
      answer: "Yes, the self-hosted version allows you to use local LLMs for ultimate privacy and customization."
    }
  ]

  return (
    <section id="faq" className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-semibold mb-12">FAQ</h2>
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="tech-border">
              <AccordionTrigger className="px-6 py-4 text-sm font-semibold hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-sm text-gray-600">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

