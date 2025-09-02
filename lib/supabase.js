import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const signIn = async (emailOrUsername, password) => {
  // Try direct email login first
  let email = emailOrUsername;
  
  // If it doesn't contain @, treat as username
  if (!emailOrUsername.includes('@')) {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('username', emailOrUsername)
      .single();

    if (userError || !userData) {
      return { data: null, error: { message: 'Invalid username' } };
    }
    email = userData.email;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};