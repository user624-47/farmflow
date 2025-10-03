import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to verify crop access
async function verifyCropAccess(userId: string, cropId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('crop_access')
    .select('user_id')
    .eq('user_id', userId)
    .eq('crop_id', cropId)
    .single();

  if (error || !data) return false;
  return true;
}

// Helper functions for database operations
async function getRecord(recordId: string, userId: string) {
  const { data, error } = await supabase
    .from('growth_records')
    .select('*, stage:growth_stages(*)')
    .eq('id', recordId)
    .single();

  if (error) throw error;
  return data;
}

async function getCropRecords(cropId: string, userId: string) {
  const { data, error } = await supabase
    .from('growth_records')
    .select('*, stage:growth_stages(*)')
    .eq('crop_id', cropId);

  if (error) throw error;
  return data || [];
}

async function createRecord(recordData: any, userId: string) {
  const newRecord = {
    ...recordData,
    created_by: userId,
    updated_by: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('growth_records')
    .insert(newRecord)
    .select('*, stage:growth_stages(*)')
    .single();

  if (error) throw error;
  return data;
}

async function updateRecord(recordId: string, updateData: any, userId: string) {
  const { data: existingRecord } = await supabase
    .from('growth_records')
    .select('created_by')
    .eq('id', recordId)
    .single();

  if (!existingRecord) {
    throw new Error('Record not found');
  }

  const updatedRecord = {
    ...updateData,
    updated_by: userId,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('growth_records')
    .update(updatedRecord)
    .eq('id', recordId)
    .select('*, stage:growth_stages(*)')
    .single();

  if (error) throw error;
  return data;
}

async function deleteRecord(recordId: string, userId: string) {
  const { data: existingRecord } = await supabase
    .from('growth_records')
    .select('created_by')
    .eq('id', recordId)
    .single();

  if (!existingRecord) {
    throw new Error('Record not found');
  }

  const { error } = await supabase
    .from('growth_records')
    .delete()
    .eq('id', recordId);

  if (error) throw error;
  return { success: true };
}

// GET /api/growth/records - Get all records for a crop or a single record
router.get('/', async (req, res) => {
  try {
    const { cropId, id: recordId } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (recordId) {
      const record = await getRecord(recordId as string, userId);
      if (!record) {
        return res.status(404).json({ error: 'Record not found' });
      }
      return res.json(record);
    } else if (cropId) {
      const hasAccess = await verifyCropAccess(userId, cropId as string);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
      const records = await getCropRecords(cropId as string, userId);
      return res.json(records);
    } else {
      return res.status(400).json({ error: 'Missing cropId or id parameter' });
    }
  } catch (error) {
    console.error('GET Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: errorMessage });
  }
});

// POST /api/growth/records - Create a new record
router.post('/', async (req, res) => {
  try {
    const { cropId } = req.query;
    const userId = req.user?.id;
    
    if (!cropId) {
      return res.status(400).json({ error: 'cropId is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasAccess = await verifyCropAccess(userId, cropId as string);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const recordData = req.body;
    const newRecord = await createRecord(recordData, userId);
    
    return res.status(201).json(newRecord);
  } catch (error) {
    console.error('POST Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: errorMessage });
  }
});

// PUT /api/growth/records/:id - Update a record
router.put('/:id', async (req, res) => {
  try {
    const recordId = req.params.id;
    const userId = req.user?.id;

    if (!recordId) {
      return res.status(400).json({ error: 'Record ID is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const updateData = req.body;
    const updatedRecord = await updateRecord(recordId, updateData, userId);
    
    return res.json(updatedRecord);
  } catch (error) {
    console.error('PUT Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: errorMessage });
  }
});

// DELETE /api/growth/records/:id - Delete a record
router.delete('/:id', async (req, res) => {
  try {
    const recordId = req.params.id;
    const userId = req.user?.id;

    if (!recordId) {
      return res.status(400).json({ error: 'Record ID is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await deleteRecord(recordId, userId);
    return res.status(204).send();
  } catch (error) {
    console.error('DELETE Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: errorMessage });
  }
});

export default router;
