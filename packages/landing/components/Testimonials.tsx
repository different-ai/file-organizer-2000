import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Testimonials() {
  const testimonials = [
    {
      name: "Lautaro Losio",
      handle: "@LautaroLosio",
      content: "This is really awesome! I had a similar idea of managing files and titles using AI, but you took it to the next level. This is the best path that all of this AI nonsense can take and truly be useful. Great work!"
    },
    {
      name: "farmhappens",
      handle: "u/farmhappens",
      content: "This is an incredible plugin and i am finding so many uses for it. Thanks for making this - and making it open source and self hosted!"
    },
    {
      name: "Mali Rasko",
      handle: "@MaliRasko",
      content: "I tried a lot of Voice Memos-to-Obsidian workflows and this one is the best so far. Keep up :)"
    }
  ]

  return (
    <section className="py-20 px-6 bg-white">
      <h2 className="text-3xl font-semibold text-center mb-12">What People Are Saying</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {testimonials.map((testimonial, index) => (
          <Card key={index} className="software-border">
            <CardHeader>
              <CardTitle>{testimonial.name}</CardTitle>
              <p className="text-sm text-gray-500">{testimonial.handle}</p>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{testimonial.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

