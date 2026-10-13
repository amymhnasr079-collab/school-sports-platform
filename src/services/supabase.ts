import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables configuration for Supabase (supported in Netlify and locally)
const supabaseUrl: string | undefined =
  import.meta.env.VITE_SUPABASE_URL ||
  (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : undefined);

const supabaseAnonKey: string | undefined =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : undefined);

export const SUPABASE_BUCKET =
  import.meta.env.VITE_SUPABASE_BUCKET || 'school_media';

/**
 * Check if Supabase is properly configured via environment variables
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseUrl.trim() !== '' &&
    supabaseUrl.startsWith('https://') &&
    supabaseAnonKey &&
    supabaseAnonKey.trim() !== ''
  );
}

/**
 * Singleton Supabase client instance
 */
let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseClientInstance) {
    try {
      supabaseClientInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return supabaseClientInstance;
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadToSupabaseStorage(
  file: File,
  storagePath: string
): Promise<{ success: boolean; publicUrl: string; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      publicUrl: '',
      error: 'Supabase client is not configured.',
    };
  }

  try {
    const { error: uploadError } = await client.storage
      .from(SUPABASE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'application/octet-stream',
      });

    if (uploadError) {
      console.warn('Supabase storage upload error:', uploadError);
      return { success: false, publicUrl: '', error: uploadError.message };
    }

    // Get public URL
    const { data } = client.storage.from(SUPABASE_BUCKET).getPublicUrl(storagePath);
    const publicUrl = data?.publicUrl || '';

    return {
      success: true,
      publicUrl,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Exception during Supabase upload:', message);
    return { success: false, publicUrl: '', error: message };
  }
}

/**
 * Download a file Blob from Supabase Storage
 */
export async function fetchBlobFromSupabaseStorage(
  storagePath: string
): Promise<Blob | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.storage
      .from(SUPABASE_BUCKET)
      .download(storagePath);

    if (error || !data) {
      console.warn('Supabase storage download error:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.warn('Exception during Supabase download:', err);
    return null;
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFromSupabaseStorage(
  storagePath: string
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.storage
      .from(SUPABASE_BUCKET)
      .remove([storagePath]);

    if (error) {
      console.warn('Supabase storage delete error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Exception during Supabase delete:', err);
    return false;
  }
}
