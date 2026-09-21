import { db } from "@/db/client";
import { AppShell } from "@/components/app-shell";
import { getSessionUser } from "@/lib/current-user";
import { ProductsClient } from "./products-client";
import { products, deals } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const user = await getSessionUser();

  const [allProducts, allDeals] = await Promise.all([
    db.select().from(products).orderBy(desc(products.createdAt)),
    db.query.deals.findMany({
      columns: { id: true, title: true, value: true, stageId: true },
    }),
  ]);

  return (
    <AppShell title="Products & Solutions" user={user}>
      <ProductsClient initialProducts={allProducts} deals={allDeals} />
    </AppShell>
  );
}

