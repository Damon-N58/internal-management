"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Plus } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PCRModal } from "./pcr-modal"
import type { ProductChangeRequest, PCRStatus } from "@/types"

type Props = { pcrs: ProductChangeRequest[] }

const statusFilters: ("All" | PCRStatus)[] = ["All", "Requested", "In Progress", "Completed"]

const priorityLabel: Record<number, string> = {
  1: "🔴 Critical",
  2: "🟠 High",
  3: "🟡 Medium",
  4: "🟢 Low",
  5: "⚪ Minimal",
}

export function ProductTable({ pcrs }: Props) {
  const [filter, setFilter] = useState<"All" | PCRStatus>("All")
  const [modalOpen, setModalOpen] = useState(false)

  const filtered = filter === "All" ? pcrs : pcrs.filter((p) => p.status === filter)

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as "All" | PCRStatus)}
        >
          <TabsList>
            {statusFilters.map((s) => (
              <TabsTrigger key={s} value={s}>
                {s}
                {s !== "All" && (
                  <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-xs">
                    {pcrs.filter((p) => p.status === s).length}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Request Feature / Issue
        </Button>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Deadline</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground py-8"
                >
                  No items found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((pcr) => (
                <TableRow key={pcr.id}>
                  <TableCell>
                    <StatusBadge status={pcr.issue} />
                  </TableCell>
                  <TableCell className="max-w-[240px]">
                    <span className="text-sm">{pcr.description}</span>
                  </TableCell>
                  <TableCell className="text-sm">{pcr.location}</TableCell>
                  <TableCell className="text-sm font-medium">
                    {priorityLabel[pcr.priority] ?? pcr.priority}
                  </TableCell>
                  <TableCell className="text-sm">{pcr.requested_by}</TableCell>
                  <TableCell className="text-sm">
                    {pcr.assigned_to ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={pcr.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {pcr.deadline
                      ? format(new Date(pcr.deadline), "MMM d, yyyy")
                      : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <PCRModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Card>
  )
}
