-- Assign user role to existing organization
INSERT INTO user_roles (user_id, organization_id, role)
SELECT 
  '6a050491-7afc-400f-ac08-c27054dca462' as user_id,
  id as organization_id,
  'admin' as role
FROM organizations 
WHERE email = 'tnege@wcccgroup.us';