import { prisma } from "@/lib/prisma"
import { ProductTable } from "@/components/product/product-table"

export default async function ProductPage() {
  const pcrs = await prisma.productChangeRequest.findMany({
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Product Roadmap</h2>
        <p className="text-muted-foreground">Feature requests and issue tracking</p>
      </div>
      <ProductTable pcrs={pcrs} />
    </div>
  )
}
