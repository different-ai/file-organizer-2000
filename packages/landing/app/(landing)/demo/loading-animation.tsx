'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

const LOADING_MESSAGES = [
  "Don't look away! A squirrel might steal your focus!",
  "Concentrating harder than a squirrel on caffeine...",
  "ADHD superpower activated: Hyper-focusing on task generation!",
  "Squirrel-proof task list incoming...",
  "Redirecting all squirrels to your neighbor's yard...",
  "Organizing chaos, one acorn at a time...",
  "Squirrel-level multitasking in progress...",
  "Turning ADHD into 'Attention Deficit Hyperproductivity Disorder'...",
  "Harnessing the power of a thousand squirrel thoughts...",
]

const LoadingAnimation = () => {
  const [message, setMessage] = useState(LOADING_MESSAGES[0])

  useEffect(() => {
    const interval = setInterval(() => {
      setMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)])
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-64">
      <div className="relative w-40 h-40">
        <motion.div
          className="absolute w-full h-full rounded-full border-4 border-purple-500"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 360],
          }}
          transition={{
            duration: 3,
            ease: "easeInOut",
            times: [0, 0.5, 1],
            repeat: Infinity,
          }}
        />
        <motion.div
          className="absolute w-full h-full rounded-full border-4 border-blue-500"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [0, -360],
          }}
          transition={{
            duration: 3,
            ease: "easeInOut",
            times: [0, 0.5, 1],
            repeat: Infinity,
            delay: 0.5,
          }}
        />
        <motion.div
          className="absolute w-full h-full rounded-full border-4 border-green-500"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 360],
          }}
          transition={{
            duration: 3,
            ease: "easeInOut",
            times: [0, 0.5, 1],
            repeat: Infinity,
            delay: 1,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      </div>
      <motion.p
        className="mt-8 text-lg text-center text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        key={message}
      >
        {message}
      </motion.p>
    </div>
  )
}

export default LoadingAnimation