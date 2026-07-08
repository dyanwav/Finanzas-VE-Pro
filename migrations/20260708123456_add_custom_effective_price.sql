-- Add custom_effective_price to products
ALTER TABLE products ADD COLUMN custom_effective_price numeric DEFAULT NULL;
