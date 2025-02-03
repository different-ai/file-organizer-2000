declare module 'posthog-js' {
  const posthog: any;
  export default posthog;
}

declare module 'posthog-js/react' {
  import { ReactNode } from 'react';
  
  export function PostHogProvider({ children, client }: { children: ReactNode; client: any }): JSX.Element;
  export function usePostHog(): any;
} 