-- Create organization for the user if it doesn't exist
DO $$
DECLARE
    org_id UUID;
BEGIN
    -- Check if organization exists, if not create it
    SELECT id INTO org_id FROM organizations WHERE email = 'tnege@wcccgroup.us' LIMIT 1;
    
    IF org_id IS NULL THEN
        INSERT INTO organizations (name, email) 
        VALUES ('Demo Organization', 'tnege@wcccgroup.us') 
        RETURNING id INTO org_id;
    END IF;
    
    -- Insert user role if it doesn't exist
    INSERT INTO user_roles (user_id, organization_id, role)
    VALUES ('6a050491-7afc-400f-ac08-c27054dca462', org_id, 'admin')
    ON CONFLICT (id) DO NOTHING;
END $$;