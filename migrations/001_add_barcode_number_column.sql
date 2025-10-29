-- Add barcodeNumber column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS barcodeNumber TEXT;