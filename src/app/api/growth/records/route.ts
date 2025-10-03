import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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

// Initialize Supabase with SSR
function createSupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookies().set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookies().set({ name, value: '', ...options });
        },
      },
    }
  );
}

// GET /api/growth/records?cropId=xxx
// GET /api/growth/records?recordId=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const recordId = searchParams.get('recordId');
  const cropId = searchParams.get('cropId');
  
  const supabase = createSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    if (recordId) {
      return await getRecord(recordId, supabase, session.user.id);
    } else if (cropId) {
      return await getRecordsForCrop(cropId, supabase, session.user.id);
    } else {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in growth records API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/growth/records
export async function POST(request: Request) {
  const supabase = createSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    const recordData = await request.json() as Omit<GrowthRecord, 'id' | 'created_at' | 'updated_at' | 'created_by'>;
    
    if (!recordData.crop_id) {
      return NextResponse.json(
        { error: 'Crop ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this crop
    const hasAccess = await verifyCropAccess(supabase, session.user.id, recordData.crop_id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const { data: record, error } = await supabase
      .from('growth_records')
      .insert([{ ...recordData, created_by: session.user.id }])
      .select('*, stage:growth_stages(*)')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating growth record:', error);
    return NextResponse.json(
      { error: 'Failed to create growth record' },
      { status: 500 }
    );
  }
}

// PUT /api/growth/records?recordId=xxx
export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const recordId = searchParams.get('recordId');
  
  if (!recordId) {
    return NextResponse.json(
      { error: 'Record ID is required' },
      { status: 400 }
    );
  }

  const supabase = createSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    // Get the current record to verify access
    const { data: existingRecord, error: fetchError } = await supabase
      .from('growth_records')
      .select('crop_id')
      .eq('id', recordId)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this record's crop
    const hasAccess = await verifyCropAccess(supabase, session.user.id, existingRecord.crop_id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const updates = await request.json() as Partial<GrowthRecord>;
    
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

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error updating growth record:', error);
    return NextResponse.json(
      { error: 'Failed to update growth record' },
      { status: 500 }
    );
  }
}

// DELETE /api/growth/records?recordId=xxx
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const recordId = searchParams.get('recordId');
  
  if (!recordId) {
    return NextResponse.json(
      { error: 'Record ID is required' },
      { status: 400 }
    );
  }

  const supabase = createSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    // Get the current record to verify access
    const { data: existingRecord, error: fetchError } = await supabase
      .from('growth_records')
      .select('crop_id')
      .eq('id', recordId)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this record's crop
    const hasAccess = await verifyCropAccess(supabase, session.user.id, existingRecord.crop_id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('growth_records')
      .delete()
      .eq('id', recordId);

    if (error) {
      throw error;
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting growth record:', error);
    return NextResponse.json(
      { error: 'Failed to delete growth record' },
      { status: 500 }
    );
  }
}

// Helper functions
async function getRecord(recordId: string, supabase: any, userId: string) {
  const { data: record, error } = await supabase
    .from('growth_records')
    .select('*, stage:growth_stages(*)')
    .eq('id', recordId)
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Record not found' },
      { status: 404 }
    );
  }

  // Verify user has access to this record's crop
  const hasAccess = await verifyCropAccess(supabase, userId, record.crop_id);
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }

  return NextResponse.json(record);
}

async function getRecordsForCrop(cropId: string, supabase: any, userId: string) {
  // Verify user has access to this crop
  const hasAccess = await verifyCropAccess(supabase, userId, cropId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }

  const { data: records, error } = await supabase
    .from('growth_records')
    .select('*, stage:growth_stages(*)')
    .eq('crop_id', cropId)
    .order('start_date', { ascending: false });

  if (error) {
    throw error;
  }

  return NextResponse.json(records);
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
