import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[--text-normal]">Welcome Back</h1>
          <p className="text-[--text-muted] mt-2">Sign in to continue to your dashboard</p>
        </div>
        
        <SignIn
          appearance={{
            elements: {
              formButtonPrimary: 
                "bg-[--interactive-accent] hover:bg-[--interactive-accent-hover] text-[--text-on-accent]",
              card: "bg-[--background-primary] shadow-lg",
              headerTitle: "text-[--text-normal]",
              headerSubtitle: "text-[--text-muted]",
              socialButtonsBlockButton: "text-[--text-normal] border-[--background-modifier-border]",
              formFieldInput: "bg-[--background-primary-alt] border-[--background-modifier-border] text-[--text-normal]",
              footerActionLink: "text-[--text-accent] hover:text-[--text-accent-hover]",
            },
          }}
          path="/sign-in"
        />
      </div>
    </div>
  );
} 