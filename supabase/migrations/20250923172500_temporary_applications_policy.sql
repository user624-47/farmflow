-- Drop all existing policies on applications
DROP POLICY IF EXISTS "Admins and extension officers can manage applications" ON public.applications;
DROP POLICY IF EXISTS "Farmers can view and create applications" ON public.applications;
DROP POLICY IF EXISTS "Farmers can insert applications" ON public.applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON public.applications;

-- Temporary policy to allow all operations for authenticated users (for debugging)
CREATE POLICY "Temporary: Allow all operations for authenticated users"
ON public.applications
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- For reference, here's the policy you should use in production:
/*
-- Production policy (commented out for now)
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

CREATE POLICY "Farmers can view applications"
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
  AND farmer_id = auth.uid()
);
*/
