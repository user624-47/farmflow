-- Fix farmers SELECT policy to avoid referencing auth.users directly
-- This prevents "permission denied for table users" errors during policy evaluation

DROP POLICY IF EXISTS "Farmers can view their own record in same organization" ON public.farmers;

CREATE POLICY "Farmers can view their own record"
ON public.farmers
FOR SELECT
USING (public.can_access_farmer_data(id));