-- Fix the user_roles policy to use correct has_role function parameters
-- The has_role function expects (_user_id uuid, _organization_id uuid, _role app_role)

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Admins can manage roles in their organization" ON public.user_roles;

-- Create correct policy with proper function parameters
CREATE POLICY "Admins can manage roles in their organization"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), organization_id, 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), organization_id, 'admin'::app_role));