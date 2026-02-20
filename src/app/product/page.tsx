import { supabase } from "@/lib/supabase"
import { ProductTable } from "@/components/product/product-table"

export default async function ProductPage() {
  const { data: pcrs } = await supabase
    .from("product_change_request")
    .select()
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Product Roadmap</h2>
        <p className="text-muted-foreground">Feature requests and issue tracking</p>
      </div>
      <ProductTable pcrs={pcrs ?? []} />
    </div>
  )
}
