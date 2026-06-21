const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  await client.query(
    'ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS uq_cart_items_cart_product',
  );
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS cart_items_cart_product_variant_unique
      ON public.cart_items ("cartId", "productId", color, storage)
  `);

  console.log('Cart variant migration applied successfully');
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
