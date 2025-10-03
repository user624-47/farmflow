import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

type GrowthRecord = {
  id: string;
  crop_id: string;
  stage_id: string;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  images: string[];
  health_score: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  stage?: {
    id: string;
    name: string;
    description: string | null;
    duration_days: number;
    organization_id: string;
    created_at: string;
    updated_at: string;
  };
};

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get the session from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { method, query } = req;
    const { cropId, recordId } = query;

    // Create a Supabase client with the user's token
    const userSupabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    switch (method) {
      case 'GET':
        if (recordId) {
          // Get single record
          return handleGetRecord(res, userSupabase, recordId as string, user.id);
        } else if (cropId) {
          // Get all records for a crop
          return handleGetCropRecords(res, userSupabase, cropId as string, user.id);
        } else {
          return res.status(400).json({ error: 'Missing required parameters' });
        }
      
      case 'POST':
        if (!cropId) {
          return res.status(400).json({ error: 'Crop ID is required' });
        }
        return handleCreateRecord(req, res, userSupabase, cropId as string, user.id);
      
      case 'PUT':
        if (!recordId) {
          return res.status(400).json({ error: 'Record ID is required' });
        }
        return handleUpdateRecord(req, res, userSupabase, recordId as string, user.id);
      
      case 'DELETE':
        if (!recordId) {
          return res.status(400).json({ error: 'Record ID is required' });
        }
        return handleDeleteRecord(res, userSupabase, recordId as string, user.id);
      
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Error in growth records API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Handler functions
async function handleGetRecord(
  res: NextApiResponse,
  supabase: any,
  recordId: string,
  userId: string
) {
  const { data: record, error } = await supabase
    .from('growth_records')
    .select('*, stage:growth_stages(*)')
    .eq('id', recordId)
    .single();

  if (error) {
    return res.status(404).json({ error: 'Record not found' });
  }

  // Verify user has access to this record's crop
  const hasAccess = await verifyCropAccess(supabase, userId, record.crop_id);
  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied' });
  }

  return res.status(200).json(record);
}

async function handleGetCropRecords(
  res: NextApiResponse,
  supabase: any,
  cropId: string,
  userId: string
) {
  // Verify user has access to this crop
  const hasAccess = await verifyCropAccess(supabase, userId, cropId);
  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { data: records, error } = await supabase
    .from('growth_records')
    .select('*, stage:growth_stages(*)')
    .eq('crop_id', cropId)
    .order('start_date', { ascending: false });

  if (error) {
    throw error;
  }

  return res.status(200).json(records);
}

async function handleCreateRecord(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  cropId: string,
  userId: string
) {
  // Verify user has access to this crop
  const hasAccess = await verifyCropAccess(supabase, userId, cropId);
  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const recordData = req.body as Omit<GrowthRecord, 'id' | 'created_at' | 'updated_at' | 'created_by'>;

  const { data: record, error } = await supabase
    .from('growth_records')
    .insert([{ ...recordData, crop_id: cropId, created_by: userId }])
    .select('*, stage:growth_stages(*)')
    .single();

  if (error) {
    throw error;
  }

  return res.status(201).json(record);
}

async function handleUpdateRecord(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  recordId: string,
  userId: string
) {
  // Get the current record to verify access
  const { data: existingRecord, error: fetchError } = await supabase
    .from('growth_records')
    .select('crop_id')
    .eq('id', recordId)
    .single();

  if (fetchError) {
    return res.status(404).json({ error: 'Record not found' });
  }

  // Verify user has access to this record's crop
  const hasAccess = await verifyCropAccess(supabase, userId, existingRecord.crop_id);
  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const updates = req.body as Partial<GrowthRecord>;
  
  // Prevent changing these fields
  delete updates.id;
  delete updates.created_at;
  delete updates.updated_at;
  delete updates.created_by;
  delete updates.crop_id; // Don't allow changing the crop

  const { data: record, error } = await supabase
    .from('growth_records')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', recordId)
    .select('*, stage:growth_stages(*)')
    .single();

  if (error) {
    throw error;
  }

  return res.status(200).json(record);
}

async function handleDeleteRecord(
  res: NextApiResponse,
  supabase: any,
  recordId: string,
  userId: string
) {
  // Get the current record to verify access
  const { data: existingRecord, error: fetchError } = await supabase
    .from('growth_records')
    .select('crop_id')
    .eq('id', recordId)
    .single();

  if (fetchError) {
    return res.status(404).json({ error: 'Record not found' });
  }

  // Verify user has access to this record's crop
  const hasAccess = await verifyCropAccess(supabase, userId, existingRecord.crop_id);
  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { error } = await supabase
    .from('growth_records')
    .delete()
    .eq('id', recordId);

  if (error) {
    throw error;
  }

  return res.status(204).end();
}

async function verifyCropAccess(
  supabase: any,
  userId: string,
  cropId: string
): Promise<boolean> {
  // Check if the user has access to the crop
  const { data: crop, error } = await supabase
    .from('crops')
    .select('farm_id')
    .eq('id', cropId)
    .single();

  if (error || !crop) {
    return false;
  }

  // Check if the user has access to the farm that owns this crop
  const { data: farm, error: farmError } = await supabase
    .from('farms')
    .select('organization_id')
    .eq('id', crop.farm_id)
    .single();

  if (farmError || !farm) {
    return false;
  }

  // Check if the user is a member of the organization that owns the farm
  const { data: member, error: memberError } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', farm.organization_id)
    .single();

  return !memberError && !!member;
}
