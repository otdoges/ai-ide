import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// User management functions
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error fetching user:', error.message);
    return null;
  }
  return user;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
};

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw new Error(error.message);
  }
  
  return true;
};

// Project management functions
export const getUserProjects = async (userId: string) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId);
    
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
};

export const createProject = async (projectData: { 
  name: string; 
  description?: string;
  user_id: string;
}) => {
  const { data, error } = await supabase
    .from('projects')
    .insert(projectData)
    .select()
    .single();
    
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
};

// Settings management
export const getUserSettings = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (error && error.code !== 'PGRST116') { // PGRST116 is 'No rows returned' error
    throw new Error(error.message);
  }
  
  return data || { user_id: userId, theme: 'vs-dark', font_size: 14 };
};

export const updateUserSettings = async (userId: string, settings: {
  theme?: string;
  font_size?: number;
  keyboard_shortcuts?: Record<string, string>;
}) => {
  const { data: existingSettings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (existingSettings) {
    // Update existing settings
    const { data, error } = await supabase
      .from('user_settings')
      .update(settings)
      .eq('user_id', userId)
      .select()
      .single();
      
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  } else {
    // Create new settings
    const { data, error } = await supabase
      .from('user_settings')
      .insert({ user_id: userId, ...settings })
      .select()
      .single();
      
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  }
}; 