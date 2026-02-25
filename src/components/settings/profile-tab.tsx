"use client"

import { UserProfile } from "@clerk/nextjs"

export function ProfileTab() {
  return (
    <div className="max-w-3xl">
      <UserProfile
        appearance={{
          elements: {
            rootBox: "w-full",
            cardBox: "shadow-none border rounded-lg w-full",
            navbar: "hidden",
            pageScrollBox: "p-6",
          },
        }}
      />
    </div>
  )
}
