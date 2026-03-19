-- Custom types for subscription management
CREATE TYPE public.pricing_type AS ENUM ('one_time', 'recurring');
CREATE TYPE public.pricing_plan_interval AS ENUM ('day', 'week', 'month', 'year');
CREATE TYPE public.subscription_status AS ENUM ('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused');

-- Products table
CREATE TABLE public.products (
  id text PRIMARY KEY,
  active boolean,
  name text,
  description text,
  image text,
  metadata jsonb
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access." ON public.products FOR SELECT USING (true);

-- Prices table
CREATE TABLE public.prices (
  id text PRIMARY KEY,
  product_id text REFERENCES public.products,
  active boolean,
  description text,
  unit_amount bigint,
  currency text CHECK (char_length(currency) = 3),
  type public.pricing_type,
  interval public.pricing_plan_interval,
  interval_count integer,
  metadata jsonb
);
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access." ON public.prices FOR SELECT USING (true);

-- Customers table (maps auth.users.id to stripe_customer_id)
CREATE TABLE public.customers (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  stripe_customer_id text
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
-- No direct public access to customers table for users typically, but they might need to see their own?
-- Usually, we just use it in Edge Functions (service role).

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  status public.subscription_status,
  metadata jsonb,
  price_id text REFERENCES public.prices,
  quantity integer,
  cancel_at_period_end boolean,
  created timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  current_period_start timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  current_period_end timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  ended_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  cancel_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  canceled_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  trial_start timestamp with time zone DEFAULT timezone('utc'::text, now()),
  trial_end timestamp with time zone DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Can only view own subscription data." ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
