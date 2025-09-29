-- Drop all existing policies on applications
DROP POLICY IF EXISTS "Temporary: Allow all operations for authenticated users" ON public.applications;
DROP POLICY IF EXISTS "Admins and extension officers can manage applications" ON public.applications;
DROP POLICY IF EXISTS "Farmers can view and create applications" ON public.applications;
DROP POLICY IF EXISTS "Farmers can insert applications" ON public.applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON public.applications;

-- Create a function to get the user's organization ID
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT organization_id FROM user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Policy to allow admins and extension officers full access to applications in their organization
CREATE POLICY "Admins and extension officers can manage applications"
ON public.applications
FOR ALL
USING (
  EXISTS (
    SELECT 1 
    FROM user_roles
    WHERE user_id = auth.uid()
    AND organization_id = applications.organization_id
    AND role = ANY(ARRAY['admin'::app_role, 'extension_officer'::app_role])
  )
)
WITH CHECK (
  organization_id = public.get_user_org_id()
  AND EXISTS (
    SELECT 1 
    FROM user_roles
    WHERE user_id = auth.uid()
    AND organization_id = public.get_user_org_id()
    AND role = ANY(ARRAY['admin'::app_role, 'extension_officer'::app_role])
  )
);

-- Policy to allow farmers to view applications in their organization
CREATE POLICY "Farmers can view applications"
ON public.applications
FOR SELECT
USING (
  organization_id = public.get_user_org_id()
);

-- Policy to allow farmers to create applications
CREATE POLICY "Farmers can create applications"
ON public.applications
FOR INSERT
WITH CHECK (
  organization_id = public.get_user_org_id()
  AND farmer_id = auth.uid()
);

-- Policy to allow users to update their own applications
CREATE POLICY "Users can update their own applications"
ON public.applications
FOR UPDATE
USING (
  organization_id = public.get_user_org_id()
  AND (
    -- Either the user is an admin/extension officer
    EXISTS (
      SELECT 1 
      FROM user_roles
      WHERE user_id = auth.uid()
      AND organization_id = public.get_user_org_id()
      AND role = ANY(ARRAY['admin'::app_role, 'extension_officer'::app_role])
    )
    -- Or the user is the farmer who created the application
    OR farmer_id = auth.uid()
  )
)
WITH CHECK (
  organization_id = public.get_user_org_id()
);
