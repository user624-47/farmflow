import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Extend the Request type to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}

import path from 'path';

const router = Router();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to verify user has access to the organization
async function verifyOrganizationAccess(userId: string, organizationId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('id')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .single();

  return !error && !!data;
}

// GET /api/growth/stages - Get all growth stages for a crop type
router.get('/', async (req: Request, res: Response) => {
  try {
    const { cropTypeId } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user's organization
    const { data: orgMember, error: orgError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userId)
      .single();
    
    if (orgError || !orgMember) {
      return res.status(403).json({ error: 'Not a member of any organization' });
    }

    // Build the query
    let query = supabase
      .from('growth_stages')
      .select('*')
      .eq('organization_id', orgMember.organization_id);

    // Filter by crop type if provided
    if (cropTypeId) {
      query = query.eq('crop_type_id', cropTypeId);
    }

    // Execute the query
    const { data, error } = await query.order('order', { ascending: true });

    if (error) throw error;

    return res.json(data || []);
  } catch (error) {
    console.error('Error fetching growth stages:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: errorMessage });
  }
});

// GET /api/growth/stages/:id - Get a single growth stage by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get the growth stage
    const { data: stage, error } = await supabase
      .from('growth_stages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return res.status(404).json({ error: 'Growth stage not found' });
      }
      throw error;
    }

    // Verify user has access to the organization
    const hasAccess = await verifyOrganizationAccess(userId, stage.organization_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.json(stage);
  } catch (error) {
    console.error('Error fetching growth stage:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: errorMessage });
  }
});

// POST /api/growth/stages - Create a new growth stage
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { organization_id, ...stageData } = req.body;

    // Verify user has access to the organization
    const hasAccess = organization_id ? 
      await verifyOrganizationAccess(userId, organization_id) : false;
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create the growth stage
    const { data, error } = await supabase
      .from('growth_stages')
      .insert([{
        ...stageData,
        organization_id,
        created_by: userId,
        updated_by: userId,
      }])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json(data);
  } catch (error) {
    console.error('Error creating growth stage:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: errorMessage });
  }
});

// PUT /api/growth/stages/:id - Update a growth stage
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get the existing growth stage
    const { data: existingStage, error: fetchError } = await supabase
      .from('growth_stages')
      .select('organization_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Growth stage not found' });
      }
      throw fetchError;
    }

    // Verify user has access to the organization
    const hasAccess = await verifyOrganizationAccess(userId, existingStage.organization_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Prevent changing the organization_id
    const { organization_id, ...updates } = req.body;

    // Update the growth stage
    const { data, error } = await supabase
      .from('growth_stages')
      .update({
        ...updates,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.json(data);
  } catch (error) {
    console.error('Error updating growth stage:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: errorMessage });
  }
});

// DELETE /api/growth/stages/:id - Delete a growth stage
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get the existing growth stage
    const { data: existingStage, error: fetchError } = await supabase
      .from('growth_stages')
      .select('organization_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Growth stage not found' });
      }
      throw fetchError;
    }

    // Verify user has access to the organization
    const hasAccess = await verifyOrganizationAccess(userId, existingStage.organization_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete the growth stage
    const { error } = await supabase
      .from('growth_stages')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting growth stage:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: errorMessage });
  }
});

export default router;
