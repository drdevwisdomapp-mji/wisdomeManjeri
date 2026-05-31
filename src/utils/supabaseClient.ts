import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables from Vite configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log helpful configuration warnings if values are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase environment variables are missing! ' +
    'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a .env file. ' +
    'Falling back to placeholder credentials for UI rendering.'
  );
}

// Fallbacks allow the app to boot up and render even without variables
const fallbackUrl = 'https://placeholder-project-id.supabase.co';
const fallbackKey = 'placeholder-anon-key-string-for-local-boot';

export const supabase = createClient(
  supabaseUrl || fallbackUrl,
  supabaseAnonKey || fallbackKey
);

/**
 * Helper to upload files directly to the public 'event-flyers' bucket in Supabase Storage.
 * Handles duplicate checking and returns the public URL.
 */
export async function uploadEventFlyer(file: File): Promise<string | null> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase is not configured yet. Set env variables to enable flyer uploading.');
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `flyers/${fileName}`;

    // Upload to the 'event-flyers' bucket
    const { error: uploadError } = await supabase.storage
      .from('event-flyers')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    // Generate public URL
    const { data } = supabase.storage
      .from('event-flyers')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading image to Supabase:', error);
    return null;
  }
}
