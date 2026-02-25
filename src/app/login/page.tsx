import { SignIn } from "@clerk/nextjs"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Nineteen58</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to the Internal Ops Portal
          </p>
        </div>
        <SignIn
          routing="hash"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-sm border rounded-lg",
            },
          }}
        />
      </div>
    </div>
  )
}
