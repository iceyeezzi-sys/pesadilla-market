-- Row Level Security (RLS) Template for PostgreSQL/Supabase

-- 1. Enable RLS on tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 2. Create policies for 'profiles'
-- Users can only read their own profile
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- 3. Create policies for 'orders'
-- Users can only view their own orders
CREATE POLICY "Users can view own orders" 
ON orders FOR SELECT 
USING (auth.uid() = user_id);

-- Users can only create their own orders
CREATE POLICY "Users can create own orders" 
ON orders FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Restrict everything else by default
-- (By enabling RLS without other policies, everything else is denied)
