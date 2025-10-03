import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined in environment variables');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function uploadImage(file: File, path: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const fullPath = `${path}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('growth-records')
    .upload(fullPath, file);

  if (uploadError) {
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('growth-records')
    .getPublicUrl(fullPath);

  return publicUrl;
}

export async function deleteImage(url: string): Promise<void> {
  const path = url.split('/').pop();
  if (!path) return;

  const { error } = await supabase.storage
    .from('growth-records')
    .remove([path]);

  if (error) {
    console.error('Error deleting image:', error);
  }
}
