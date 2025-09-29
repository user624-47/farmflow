-- First create an organization
INSERT INTO organizations (name, email) 
VALUES ('Demo Organization', 'tnege@wcccgroup.us');

-- Get the organization ID
WITH org_data AS (
  SELECT id FROM organizations WHERE email = 'tnege@wcccgroup.us'
)
INSERT INTO user_roles (user_id, organization_id, role)
SELECT '6a050491-7afc-400f-ac08-c27054dca462', id, 'admin'
FROM org_data;