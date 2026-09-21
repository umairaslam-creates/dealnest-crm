"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { products, deals, productDocuments } from "@/db/schema";
import { createId } from "@paralleldrive/cuid2";

export async function createProductAction(formData: FormData) {
  const name = formData.get("name") as string;
  const sku = formData.get("sku") as string;
  const category = formData.get("category") as string;
  const description = (formData.get("description") as string) || "";
  const price = parseFloat((formData.get("price") as string) || "0");
  const currency = (formData.get("currency") as string) || "SAR";
  const status = (formData.get("status") as string) || "ACTIVE";
  const features = (formData.get("features") as string) || "";
  const imageUrl = (formData.get("imageUrl") as string) || "";

  if (!name || !sku || !category) {
    throw new Error("Name, SKU, and Category are required");
  }

  const newId = "prod_" + createId();

  await db.insert(products).values({
    id: newId,
    name,
    sku,
    category,
    description,
    price,
    currency,
    status,
    features,
    imageUrl: imageUrl || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath("/products");
  revalidatePath("/");
  return { success: true, id: newId };
}

export async function updateProductAction(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const sku = formData.get("sku") as string;
  const category = formData.get("category") as string;
  const description = (formData.get("description") as string) || "";
  const price = parseFloat((formData.get("price") as string) || "0");
  const currency = (formData.get("currency") as string) || "SAR";
  const status = (formData.get("status") as string) || "ACTIVE";
  const features = (formData.get("features") as string) || "";
  const imageUrl = formData.get("imageUrl") as string | null;

  const updateData: Record<string, any> = {
    name,
    sku,
    category,
    description,
    price,
    currency,
    status,
    features,
    updatedAt: new Date(),
  };

  if (imageUrl !== null && imageUrl !== undefined) {
    updateData.imageUrl = imageUrl || null;
  }

  await db
    .update(products)
    .set(updateData)
    .where(eq(products.id, id));

  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  revalidatePath("/");
  return { success: true };
}

export async function quickUpdateProductImageAction(productId: string, imageUrl: string) {
  await db
    .update(products)
    .set({
      imageUrl: imageUrl || null,
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId));

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  return { success: true };
}

export async function deleteProductAction(id: string) {
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/products");
  revalidatePath("/");
  return { success: true };
}

// ---------- Deal Assignment Actions ----------

export async function assignDealToProductAction(productId: string, dealId: string) {
  await db
    .update(deals)
    .set({
      productId,
      updatedAt: new Date(),
    })
    .where(eq(deals.id, dealId));

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  revalidatePath("/deals");
  return { success: true };
}

export async function removeDealFromProductAction(dealId: string, productId?: string) {
  await db
    .update(deals)
    .set({
      productId: null,
      updatedAt: new Date(),
    })
    .where(eq(deals.id, dealId));

  if (productId) {
    revalidatePath(`/products/${productId}`);
  }
  revalidatePath("/products");
  revalidatePath("/deals");
  return { success: true };
}

// ---------- Product Document Actions ----------

export async function addProductDocumentAction(
  productId: string,
  title: string,
  fileType: string,
  fileUrl: string,
  fileSize?: string
) {
  if (!productId || !title || !fileUrl) {
    throw new Error("Missing required document details");
  }

  const docId = "doc_" + createId();

  await db.insert(productDocuments).values({
    id: docId,
    productId,
    title,
    fileType: fileType || "doc",
    fileUrl,
    fileSize: fileSize || null,
    createdAt: new Date(),
  });

  revalidatePath(`/products/${productId}`);
  return { success: true, id: docId };
}

export async function deleteProductDocumentAction(documentId: string, productId: string) {
  await db.delete(productDocuments).where(eq(productDocuments.id, documentId));
  revalidatePath(`/products/${productId}`);
  return { success: true };
}
