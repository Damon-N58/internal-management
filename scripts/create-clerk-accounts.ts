/**
 * One-time script to create Clerk accounts for all N58 team members.
 * Run with: npx tsx scripts/create-clerk-accounts.ts
 *
 * Requires CLERK_SECRET_KEY in .env.local
 */

import { readFileSync } from "fs"
import { resolve } from "path"

// Load .env.local without any external dependencies
try {
  const envPath = resolve(process.cwd(), ".env.local")
  const lines = readFileSync(envPath, "utf-8").split("\n")
  for (const line of lines) {
    const match = line.match(/^([^#=\s][^=]*)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const val = match[2].trim().replace(/^["']|["']$/g, "")
      if (!process.env[key]) process.env[key] = val
    }
  }
} catch { /* .env.local not present */ }

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY
if (!CLERK_SECRET_KEY) {
  console.error("CLERK_SECRET_KEY not found in .env.local")
  process.exit(1)
}

const TEAM = [
  { firstName: "Danielle", lastName: "Nineteen58", email: "dani@nineteen58.co.za" },
  { firstName: "Damon",    lastName: "Carle",       email: "damon@nineteen58.co.za" },
  { firstName: "Dominic",  lastName: "le Sueur",    email: "dom@nineteen58.co.za" },
  { firstName: "Dreas",    lastName: "Vermaak",     email: "dreas@nineteen58.co.za" },
  { firstName: "Erin",     lastName: "Duffy",       email: "erin@nineteen58.co.za" },
  { firstName: "Jan",      lastName: "Dreyer",      email: "jan@nineteen58.co.za" },
  { firstName: "James",    lastName: "MacRobert",   email: "james@nineteen58.co.za" },
  { firstName: "Oliver",   lastName: "Rowe",        email: "oliver@nineteen58.co.za" },
  { firstName: "Renzo",    lastName: "Zanetti",     email: "renzo@nineteen58.co.za" },
  { firstName: "Sebastian",lastName: "Mcintosh",    email: "seb@nineteen58.co.za" },
]

function tempPassword(firstName: string): string {
  return `N58@${firstName}2026!`
}

async function createUser(member: typeof TEAM[0]) {
  const password = tempPassword(member.firstName)

  const res = await fetch("https://api.clerk.com/v1/users", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email_address: [member.email],
      first_name: member.firstName,
      last_name: member.lastName,
      password,
      skip_password_checks: false,
    }),
  })

  const body = await res.json()

  if (res.ok) {
    return { status: "created", email: member.email, password }
  }

  // Clerk error code for duplicate email
  const isDuplicate = body.errors?.some((e: { code: string }) => e.code === "form_identifier_exists")
  if (isDuplicate) {
    return { status: "exists", email: member.email, password: "(already has account)" }
  }

  return { status: "error", email: member.email, password: "", error: JSON.stringify(body.errors) }
}

async function main() {
  console.log("\n=== Creating N58 Clerk Accounts ===\n")

  const results = []
  for (const member of TEAM) {
    process.stdout.write(`${member.email} ... `)
    const result = await createUser(member)
    console.log(result.status)
    results.push(result)
  }

  console.log("\n=== Credentials to send ===\n")
  console.log("URL: https://your-app.vercel.app/login\n")
  for (const r of results) {
    if (r.status === "created") {
      console.log(`${r.email}  |  ${r.password}`)
    } else if (r.status === "exists") {
      console.log(`${r.email}  |  Account already exists — ask them to use Forgot Password if needed`)
    } else {
      console.log(`${r.email}  |  ERROR: ${r.error}`)
    }
  }
  console.log("")
}

main().catch(console.error)
