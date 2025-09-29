-- First, let's get your organization ID or create one if needed
INSERT INTO organizations (name, email)
VALUES ('Demo Organization', 'tnege@wcccgroup.us')
ON CONFLICT (email) DO NOTHING
RETURNING id;

-- Insert user role as admin
INSERT INTO user_roles (user_id, organization_id, role)
SELECT 
  '6a050491-7afc-400f-ac08-c27054dca462' as user_id,
  id as organization_id,
  'admin' as role
FROM organizations 
WHERE email = 'tnege@wcccgroup.us'
ON CONFLICT (user_id, organization_id, role) DO NOTHING;