'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const steps = [
  {
    title: 'Connect Your Email',
    description: 'Securely link your email account with hypr.',
    shape: 'envelope'
  },
  {
    title: 'Let hypr Work',
    description: 'Our AI scans your inbox to identify tasks.',
    shape: 'brain'
  },
  {
    title: 'View Your Tasks',
    description: 'See your tasks organized in a simple to-do list.',
    shape: 'list'
  },
  {
    title: 'Stay Productive',
    description: 'Tackle tasks one at a time, with ease.',
    shape: 'checkmark'
  }
]

const AbstractShape = ({ shape, className }: { shape: string; className?: string }) => {
  const baseClass = "w-24 h-24 relative"
  const shapeClass = `${baseClass} ${className}`

  const renderShape = () => {
    switch (shape) {
      case 'envelope':
        return (
          <div className={shapeClass}>
            <div className="absolute inset-0 bg-purple-200 transform rotate-3 skew-y-3" />
            <div className="absolute top-1/4 left-1/6 right-1/6 h-1/2 bg-purple-300 transform -skew-y-6" />
            <div className="absolute top-1/4 left-1/6 w-2/3 h-1/2 bg-purple-100 transform skew-y-12" />
          </div>
        )
      case 'brain':
        return (
          <div className={shapeClass}>
            <div className="absolute inset-0 bg-purple-200 rounded-full" />
            <div className="absolute top-1/4 left-1/4 right-1/4 bottom-1/4 bg-purple-300 rounded-full transform rotate-45" />
            <div className="absolute top-1/3 left-1/3 right-1/3 bottom-1/3 bg-purple-100 rounded-full" />
          </div>
        )
      case 'checkmark':
        return (
          <div className={shapeClass}>
            <div className="absolute inset-0 bg-purple-200 rounded-full" />
            <div className="absolute bottom-1/4 left-1/4 w-1/2 h-1/2 bg-purple-300 transform rotate-45" />
            <div className="absolute top-1/4 right-1/4 w-1/4 h-1/2 bg-purple-100 transform -rotate-45" />
          </div>
        )
      case 'list':
        return (
          <div className={shapeClass}>
            <div className="absolute inset-0 bg-purple-200 rounded-lg" />
            <div className="absolute top-1/4 left-1/4 right-1/4 h-1/6 bg-purple-300 rounded" />
            <div className="absolute top-1/2 left-1/4 right-1/4 h-1/6 bg-purple-100 rounded" />
            <div className="absolute bottom-1/4 left-1/4 right-1/4 h-1/6 bg-purple-300 rounded" />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="relative">
      {renderShape()}
      <div className="absolute inset-0 bg-purple-100 opacity-20 blur-xl" />
    </div>
  )
}

export default function HowItWorks() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <section className="bg-[#070707] text-white py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold mb-12 text-center">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="flex flex-col items-center relative"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <motion.div
                className="relative mb-6"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
              >
                <AbstractShape shape={step.shape} className="transform hover:scale-110 transition-transform duration-300" />
                <div className="absolute -top-2 -left-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-lg font-bold">
                  {index + 1}
                </div>
              </motion.div>
              <h3 className="text-xl font-semibold mb-2 text-center">{step.title}</h3>
              <p className="text-gray-400 text-sm text-center max-w-[200px]">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}