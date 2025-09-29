-- Fix security issues with farmers and organizations tables RLS policies

-- Drop existing overly permissive farmers SELECT policy
DROP POLICY "Users can access farmers in their organization" ON public.farmers;

-- Create more restrictive policies for farmers table
-- Farmers can only see their own record (if they have a user account)
CREATE POLICY "Farmers can view their own record" ON public.farmers
  FOR SELECT USING (
    -- Allow if user is the farmer (matching by email or other identifier)
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = farmers.email
    )
  );

-- Extension officers and admins can view all farmers in their organization
CREATE POLICY "Extension officers and admins can view farmers" ON public.farmers
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'extension_officer')
    )
  );

-- For organizations table, limit what regular users can see
-- Drop existing policy and recreate with field restrictions
DROP POLICY "Users can view their organization" ON public.organizations;

-- Create a view for organization public info (non-sensitive fields)
CREATE OR REPLACE VIEW public.organization_public_info AS
SELECT 
  id,
  name,
  subscription_plan,
  subscription_status,
  created_at
FROM public.organizations;

-- Enable RLS on the view
ALTER VIEW public.organization_public_info SET (security_invoker = true);

-- Allow organization members to see basic org info
CREATE POLICY "Users can view basic org info" ON public.organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM public.user_roles 
      WHERE user_id = auth.uid()
    )
  );

-- But restrict sensitive fields to admins only through application logic
-- We'll handle this in the frontend by creating separate queries

-- Add additional security function to check farmer access
CREATE OR REPLACE FUNCTION public.can_access_farmer_data(farmer_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Allow if user is admin or extension officer in the farmer's organization
  SELECT EXISTS (
    SELECT 1 
    FROM public.farmers f
    JOIN public.user_roles ur ON f.organization_id = ur.organization_id
    WHERE f.id = farmer_uuid
      AND ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'extension_officer')
  )
  OR
  -- Allow if user is the farmer themselves
  EXISTS (
    SELECT 1 
    FROM public.farmers f
    JOIN auth.users u ON u.email = f.email
    WHERE f.id = farmer_uuid
      AND u.id = auth.uid()
  );
$$;