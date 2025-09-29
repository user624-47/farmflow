-- Drop existing policies
DROP POLICY IF EXISTS "Extension officers and admins can manage applications" ON public.applications;
DROP POLICY IF EXISTS "Users can access applications in their organization" ON public.applications;

-- Create new policies
-- Allow admins and extension officers full access to applications in their organization
CREATE POLICY "Admins and extension officers can manage applications"
ON public.applications
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.organization_id = applications.organization_id
    AND user_roles.role = ANY(ARRAY['admin'::app_role, 'extension_officer'::app_role])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.organization_id = applications.organization_id
    AND user_roles.role = ANY(ARRAY['admin'::app_role, 'extension_officer'::app_role])
  )
);

-- Allow farmers to view and create applications in their organization
CREATE POLICY "Farmers can view and create applications"
ON public.applications
FOR SELECT
USING (
  organization_id IN (
    SELECT user_roles.organization_id
    FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Farmers can insert applications"
ON public.applications
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT user_roles.organization_id
    FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.organization_id = organization_id
    AND user_roles.role = 'farmer'::app_role
  )
);

-- Allow users to update their own applications
CREATE POLICY "Users can update their own applications"
ON public.applications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.organization_id = applications.organization_id
  )
  AND (
    -- Either the user is an admin/extension officer
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.organization_id = applications.organization_id
      AND user_roles.role = ANY(ARRAY['admin'::app_role, 'extension_officer'::app_role])
    )
    -- Or the user is a farmer and it's their application
    OR (
      farmer_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.organization_id = applications.organization_id
        AND user_roles.role = 'farmer'::app_role
      )
    )
  )
);
