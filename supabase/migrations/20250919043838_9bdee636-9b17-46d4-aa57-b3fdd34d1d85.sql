-- Create or replace trigger to ensure profiles row is created on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Secure function to create an organization and assign current user as admin
CREATE OR REPLACE FUNCTION public.setup_organization_with_admin(org_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_user_email text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- If the user already has a role, reuse that organization
  SELECT organization_id INTO v_org_id
  FROM public.user_roles
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_org_id IS NOT NULL THEN
    RETURN v_org_id;
  END IF;

  -- Derive user email for organization contact
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

  -- Create organization
  INSERT INTO public.organizations (name, email)
  VALUES (COALESCE(NULLIF(trim(org_name), ''), 'My Organization'), v_user_email)
  RETURNING id INTO v_org_id;

  -- Assign admin role to current user
  INSERT INTO public.user_roles (user_id, organization_id, role)
  VALUES (v_user_id, v_org_id, 'admin'::app_role);

  RETURN v_org_id;
END;
$$;

-- Allow authenticated users to execute the bootstrap function
GRANT EXECUTE ON FUNCTION public.setup_organization_with_admin(text) TO authenticated;