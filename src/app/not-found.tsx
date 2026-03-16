"use client"

import { useClerk } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  const { signOut } = useClerk()

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center space-y-4 max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight">Profile not found</h1>
        <p className="text-muted-foreground text-sm">
          Your account is signed in but your portal profile couldn&apos;t be loaded.
          Please contact your admin to make sure your profile has been set up.
        </p>
        <Button
          variant="outline"
          onClick={() => signOut({ redirectUrl: "/login" })}
        >
          Sign out and try again
        </Button>
      </div>
    </div>
  )
}
