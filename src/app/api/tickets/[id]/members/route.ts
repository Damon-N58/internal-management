import { NextResponse } from "next/server"
import { getTicketMembers } from "@/actions/tickets"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const members = await getTicketMembers(id)
  const flat = members.map((m) => ({
    user_id: m.user_id,
    full_name: m.profile?.full_name ?? null,
    email: m.profile?.email ?? "",
  }))
  return NextResponse.json(flat)
}
