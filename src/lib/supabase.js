import { createClient } from '@supabase/supabase-js';

// Importer les types générés
// Si vous utilisez JavaScript, cette ligne n'est pas nécessaire (commentez-la)
// Si vous utilisez TypeScript, décommentez-la
// import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase env missing');
}

// Client Supabase avec configuration
// Pour TypeScript, utilisez : createClient<Database>(supabaseUrl, supabaseAnonKey, {...})
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

// ===============================
// STORAGE HELPER
// ===============================
export const getFileUrl = (bucket, path) => {
  if (!path) return null;

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data?.publicUrl || null;
};

// ===============================
// UPLOAD HELPER
// ===============================
export const uploadFile = async (bucket, path, file) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);
    
    if (error) throw error;
    return { success: true, data, url: getFileUrl(bucket, path) };
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error: error.message };
  }
};

// ===============================
// DELETE FILE HELPER
// ===============================
export const deleteFile = async (bucket, path) => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false, error: error.message };
  }
};

// ===============================
// SESSION HELPER
// ===============================
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
};

export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) return null;
  return session;
};