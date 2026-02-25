import { NextResponse } from "next/server"
import { getTicketComments } from "@/actions/tickets"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const comments = await getTicketComments(id)
  return NextResponse.json(comments)
}
