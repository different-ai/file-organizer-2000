import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare, PenTool, Zap } from 'lucide-react'

export default function Features() {
  const features = [
    {
      icon: <MessageSquare className="h-5 w-5" />,
      title: "AI Chat",
      description: "Add multiple files to the AI chat context with @filename1, @filename2 etc. or with #tag"
    },
    {
      icon: <PenTool className="h-5 w-5" />,
      title: "Handwriting Support",
      description: "Easily 'share' your handwritten notes from your phone to get them transcribed and automatically organized inside of Obsidian."
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Automate Organization",
      description: "Automate common organization patterns and save time."
    }
  ]

  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-semibold mb-12">Features</h2>
        <div className="grid gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="tech-border">
              <CardContent className="p-6">
                <div className="flex items-start">
                  <div className="mr-4 mt-1">{feature.icon}</div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 mono">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

