import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function Pricing() {
  const plans = [
    {
      name: "Self-hosted",
      price: "Free",
      description: "For the tech-savvy with programming skills",
      features: [
        "Ultimate privacy",
        "Requires credits for external OpenAI API",
        "Use local LLMs"
      ],
      buttonText: "Get the plugin"
    },
    {
      name: "Hobby Plan",
      price: "$119/year",
      description: "7-day free trial",
      features: [
        "No external AI subscription needed",
        "Seamless no-sweat setup",
        "~1000 files per month",
        "300 min audio transcription p/m",
        "30 days money-back guarantee"
      ],
      buttonText: "Start Free Trial"
    },
    {
      name: "Lifetime Access",
      price: "$200",
      description: "One-time payment",
      features: [
        "Requires your own openAI api key",
        "Privacy-focused",
        "Quick guided setup",
        "Unlimited usage",
        "Lifetime updates",
        "Early access features",
        "Premium customer support",
        "Onboarding call with the founder (optional)",
        "30 days money-back guarantee"
      ],
      buttonText: "I'm in"
    }
  ]

  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-semibold mb-12">Pricing</h2>
        <div className="grid gap-6">
          {plans.map((plan, index) => (
            <Card key={index} className="tech-border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mono">{plan.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                    <ul className="space-y-2 text-sm text-gray-600">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center">
                          <span className="mr-2">→</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold mb-4">{plan.price}</p>
                    <Button 
                      className="mono text-sm"
                      variant="outline"
                      onClick={() => window.location.href = 'https://app.fileorganizer2000.com'}
                    >
                      {plan.buttonText} →
                    </Button>
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

