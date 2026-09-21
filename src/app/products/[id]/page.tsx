import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { eq, desc } from "drizzle-orm";
import { products, deals, productDocuments } from "@/db/schema";
import { AppShell } from "@/components/app-shell";
import { getSessionUser } from "@/lib/current-user";
import { ProductDetailClient } from "./product-detail-client";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;
  const user = await getSessionUser();

  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      documents: {
        orderBy: [desc(productDocuments.createdAt)],
      },
      deals: {
        with: {
          stage: true,
          account: true,
        },
        orderBy: [desc(deals.createdAt)],
      },
    },
  });

  if (!product) {
    notFound();
  }

  // Also fetch all deals that can be assigned to this product
  const availableDeals = await db.query.deals.findMany({
    with: {
      account: true,
      stage: true,
    },
    orderBy: [desc(deals.createdAt)],
  });

  return (
    <AppShell title={product.name} user={user}>
      <ProductDetailClient
        initialProduct={product}
        availableDeals={availableDeals}
      />
    </AppShell>
  );
}

