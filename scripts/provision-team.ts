/**
 * One-time script to create Clerk accounts + seed Supabase profiles
 * for new team members who don't have accounts yet.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/provision-team.ts
 */

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const NEW_MEMBERS = [
  { full_name: "Robyn Broodryk", email: "robyn@nineteen58.co.za", first: "Robyn", last: "Broodryk" },
]

function tempPassword(firstName: string) {
  const safe = firstName.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  return `N58@${safe}2026!`
}

async function clerkFetch(path: string, body: unknown) {
  const res = await fetch(`https://api.clerk.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  return { status: res.status, data: await res.json() }
}

async function supabaseFetch(path: string, body: unknown) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=ignore-duplicates",
    },
    body: JSON.stringify(body),
  })
  return res.status
}

async function main() {
  console.log("Provisioning team members...\n")

  for (const m of NEW_MEMBERS) {
    const pw = tempPassword(m.first)

    // Create Clerk account
    const { status, data } = await clerkFetch("/users", {
      email_address: [m.email],
      password: pw,
      first_name: m.first,
      last_name: m.last,
      public_metadata: { role: "Member" },
      skip_password_checks: true,
    })

    if (status === 200 || status === 201) {
      console.log(`✓ Clerk account created`)
    } else if (data?.errors?.[0]?.code === "form_identifier_exists") {
      console.log(`⚠  Clerk account already exists (skipped)`)
    } else {
      console.log(`✗ Clerk error: ${JSON.stringify(data?.errors ?? data)}`)
    }

    // Seed Supabase profile
    const sbStatus = await supabaseFetch("/profile", {
      id: crypto.randomUUID(),
      email: m.email,
      full_name: m.full_name,
      role: "Member",
      created_at: new Date().toISOString(),
    })

    const sbOk = sbStatus === 200 || sbStatus === 201 || sbStatus === 204
    console.log(`${sbOk ? "✓" : "⚠"} Supabase profile ${sbOk ? "seeded" : `status ${sbStatus}`}`)
    console.log(`  ${m.full_name.padEnd(22)} ${m.email.padEnd(30)} ${pw}`)
    console.log()
  }

  console.log("Done! Share the passwords above with each person directly.")
  console.log("They can change their password after first login via Settings → Profile.")
  console.log("\nRemember: Go to Clerk Dashboard → Restrictions and disable public sign-ups.")
}

main().catch(console.error)
