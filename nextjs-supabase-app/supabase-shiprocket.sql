-- ============================================
-- SHIPROCKET INTEGRATION SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. ORDERS TABLE (Simplified for this integration)
-- This table mimics a typical ecommerce order table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id), -- Optional if guest checkout
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  total_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending', -- pending, paid, processing, shipped, delivered, cancelled
  
  -- Address Information (JSONB for flexibility or separate columns)
  shipping_address JSONB NOT NULL, -- { "name": "", "email": "", "phone": "", "address_1": "", "city": "", "state": "", "pincode": "", "country": "" }
  billing_address JSONB,
  
  -- Order Items (JSONB for simplicity in this demo)
  items JSONB NOT NULL -- [{ "sku": "...", "name": "...", "units": 1, "selling_price": 100 }]
);

-- 2. SHIPMENTS TABLE
-- Stores Shiprocket specific details linked to an order
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Shiprocket Identifiers
  shiprocket_order_id BIGINT,
  shipment_id BIGINT,
  awb_code TEXT,
  courier_company_id TEXT,
  courier_name TEXT,
  
  -- Status and Tracking
  status TEXT, -- Shiprocket status (NEW, PICKUP SCHEDULED, SHIPPED, etc.)
  tracking_url TEXT,
  label_url TEXT,
  manifest_url TEXT,
  pickup_token_number TEXT,
  
  -- Raw response for debugging
  metadata JSONB
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_awb ON public.shipments(awb_code);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- 4. RLS POLICIES (Basic)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own orders
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to view shipments for their orders
CREATE POLICY "Users can view own shipments" ON public.shipments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = shipments.order_id
      AND orders.user_id = auth.uid()
    )
  );
