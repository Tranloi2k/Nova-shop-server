-- Cart item variants (color / storage)
ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS color character varying(128) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS storage character varying(128) NOT NULL DEFAULT '';

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS color character varying(128) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS storage character varying(128) NOT NULL DEFAULT '';

-- Replace legacy unique (cartId, productId) with variant-aware uniqueness
ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS uq_cart_items_cart_product;

CREATE UNIQUE INDEX IF NOT EXISTS cart_items_cart_product_variant_unique
  ON public.cart_items ("cartId", "productId", color, storage);
