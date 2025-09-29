-- Fix infinite recursion in user_roles RLS policy by avoiding self-referential subqueries
-- and using a SECURITY DEFINER function instead.

-- Ensure we are operating on the correct schema
SET search_path = public;

-- Drop the recursive policy if it exists
DROP POLICY IF EXISTS "Admins can manage roles in their organization" ON public.user_roles;

-- Recreate the policy using the SECURITY DEFINER function to prevent recursion
CREATE POLICY "Admins can manage roles in their organization"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), user_roles.organization_id, 'admin'))
WITH CHECK (public.has_role(auth.uid(), user_roles.organization_id, 'admin'));
