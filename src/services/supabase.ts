import { createClient } from '@supabase/supabase-js';

// Resolutor dinámico de URLs y claves anónimas para doble modo e integración offline-first
const getSupabaseConfig = () => {
  if (typeof window === 'undefined') {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xbtrryflwesqdwqfbqtr.supabase.co",
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_SqVtyvgm3npF4jldXXB7CQ_v44V9B8N"
    };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 
              window.localStorage.getItem('SUPABASE_URL') || 
              "https://xbtrryflwesqdwqfbqtr.supabase.co";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                  window.localStorage.getItem('SUPABASE_ANON_KEY') || 
                  "sb_publishable_SqVtyvgm3npF4jldXXB7CQ_v44V9B8N";
  
  return { url, anonKey };
};

const config = getSupabaseConfig();

export const supabaseClient = createClient(config.url, config.anonKey);

export const getSupabaseRawConfig = () => config;
