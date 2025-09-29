-- Fix farmer personal information security issue
-- The current farmer self-access policy doesn't check organization isolation
-- This could allow farmers to see records with the same email across different organizations

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Farmers can view their own record" ON public.farmers;

-- Create a more secure policy that ensures organization isolation
-- Farmers can only view their own record within their organization
CREATE POLICY "Farmers can view their own record in same organization" 
ON public.farmers 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM auth.users u
    JOIN public.user_roles ur ON u.id = ur.user_id
    WHERE u.id = auth.uid() 
      AND u.email = farmers.email
      AND ur.organization_id = farmers.organization_id
      AND ur.role = 'farmer'
  )
);

-- Restrict profiles table to authenticated users only
-- Currently publicly readable which could expose user information
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Profiles are viewable by authenticated users only" 
ON public.profiles 
FOR SELECT 
USING (auth.role() = 'authenticated');