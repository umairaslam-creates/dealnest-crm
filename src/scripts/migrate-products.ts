import "dotenv/config";
import postgres from "postgres";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const sql = postgres(connectionString, { max: 1 });

  console.log("Running migrations for products & deals...");

  // 1. Ensure product_id column exists on deals
  await sql`
    ALTER TABLE deals 
    ADD COLUMN IF NOT EXISTS product_id text REFERENCES products(id);
  `;
  console.log("Checked/added deals.product_id");

  // 2. Ensure product_documents table exists
  await sql`
    CREATE TABLE IF NOT EXISTS product_documents (
      id text PRIMARY KEY,
      product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      title text NOT NULL,
      file_type text NOT NULL,
      file_url text NOT NULL,
      file_size text,
      created_at timestamp NOT NULL DEFAULT NOW()
    );
  `;
  console.log("Checked/created product_documents table");

  // 3. Populate product images for existing sample products
  await sql`
    UPDATE products 
    SET image_url = 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1200&q=80'
    WHERE id = 'prod_pos_x990';
  `;

  await sql`
    UPDATE products 
    SET image_url = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80'
    WHERE id = 'prod_gateway_api';
  `;

  await sql`
    UPDATE products 
    SET image_url = 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80'
    WHERE id = 'prod_corp_cards';
  `;

  await sql`
    UPDATE products 
    SET image_url = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'
    WHERE id = 'prod_merchant_billing';
  `;

  await sql`
    UPDATE products 
    SET image_url = 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80'
    WHERE id = 'prod_escrow_engine';
  `;

  await sql`
    UPDATE products 
    SET image_url = 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80'
    WHERE id = 'prod_softpos_qr';
  `;

  // 4. Assign sample deals to products
  const productsList = await sql`SELECT id, sku FROM products LIMIT 5`;
  const dealsList = await sql`SELECT id FROM deals LIMIT 10`;

  if (productsList.length > 0 && dealsList.length > 0) {
    // Assign first deal to product 1, second deal to product 1, third deal to product 2, etc.
    if (dealsList[0]) {
      await sql`UPDATE deals SET product_id = ${productsList[0].id} WHERE id = ${dealsList[0].id}`;
    }
    if (dealsList[1]) {
      await sql`UPDATE deals SET product_id = ${productsList[0].id} WHERE id = ${dealsList[1].id}`;
    }
    if (productsList[1] && dealsList[2]) {
      await sql`UPDATE deals SET product_id = ${productsList[1].id} WHERE id = ${dealsList[2].id}`;
    }
    if (productsList[1] && dealsList[3]) {
      await sql`UPDATE deals SET product_id = ${productsList[1].id} WHERE id = ${dealsList[3].id}`;
    }
    if (productsList[2] && dealsList[4]) {
      await sql`UPDATE deals SET product_id = ${productsList[2].id} WHERE id = ${dealsList[4].id}`;
    }
    console.log("Assigned sample deals to products");
  }

  // 5. Add sample documents for products if none exist
  const existingDocs = await sql`SELECT COUNT(*)::int as count FROM product_documents`;
  if (existingDocs[0].count === 0 && productsList.length > 0) {
    const posProd = productsList.find((p: any) => p.sku === "MYTM-POS-X9") || productsList[0];
    const apiProd = productsList.find((p: any) => p.sku === "MYTM-API-GW") || productsList[1] || productsList[0];

    await sql`
      INSERT INTO product_documents (id, product_id, title, file_type, file_url, file_size)
      VALUES 
        ('doc_pos_spec', ${posProd.id}, 'MYTM Smart POS X-990 Hardware Specs & EMV L3 Cert.pdf', 'pdf', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '2.4 MB'),
        ('doc_pos_guide', ${posProd.id}, 'Merchant Quickstart Deployment Guide.pdf', 'pdf', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '1.1 MB'),
        ('doc_api_doc', ${apiProd.id}, 'MYTM Payment Gateway REST API Specification v3.2.pdf', 'pdf', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '4.8 MB'),
        ('doc_api_webhook', ${apiProd.id}, 'Webhook Security & HMAC Signature Verification Guide.pdf', 'pdf', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '850 KB');
    `;
    console.log("Seeded sample product documents");
  }

  console.log("Migration completed successfully!");
  await sql.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
