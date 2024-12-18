// app/posthog.js
import { PostHog } from 'posthog-node'

export default function PostHogClient() {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        return null
    }
    const posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        flushAt: 1,
        flushInterval: 0
    })
    return posthogClient
}
