'use client'

import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'

export function GitHubStats() {
  const [stars, setStars] = useState(0)
  const [targetStars, setTargetStars] = useState(0)

  useEffect(() => {
    const fetchStars = async () => {
      try {
        const response = await fetch('https://api.github.com/repos/different-ai/file-organizer-2000')
        const data = await response.json()
        setTargetStars(data.stargazers_count)
      } catch (error) {
        console.error('Error fetching GitHub stars:', error)
      }
    }

    fetchStars()
  }, [])

  useEffect(() => {
    if (targetStars === 0) return

    const timer = setInterval(() => {
      setStars(prev => {
        if (prev >= targetStars) {
          clearInterval(timer)
          return targetStars
        }
        return prev + Math.ceil((targetStars - prev) / 10)
      })
    }, 50)

    return () => clearInterval(timer)
  }, [targetStars])

  return (
    <a
      href="https://github.com/different-ai/file-organizer-2000"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 bg-[rgba(158,84,255,0.15)] text-[rgb(163,85,255)] rounded-md hover:bg-[rgba(158,84,255,0.25)] transition-colors"
    >
      <Star className="h-4 w-4" />
      <span className="font-mono">{stars}</span>
      <span className="text-sm">support open source</span>
      <span className="sr-only">GitHub stars</span>
    </a>
  )
}

