'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useState, useEffect } from 'react'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import PostHogPageView from "./PostHogPageView"

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000,
      },
    },
  }))

  useEffect(() => {
    posthog.init('phc_f004Gv83AkfXh2WJ9XQ7zqaujgajgiS3YXEYa52Evfp', {
      api_host: "/ingest",
      ui_host: 'https://us.posthog.com',
      capture_pageview: false, // Disable automatic pageview capture, as we capture manually
      capture_pageleave: true, // Enable pageleave capture
    })
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <PHProvider client={posthog}>
          <PostHogPageView />
          {children}
        </PHProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}