'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// 서버 컴포넌트에서 사용할 Supabase 클라이언트 생성
export const createServerSupabaseClient = () => {
  const cookieStore = cookies();
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        detectSessionInUrl: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          cookie: cookieStore.toString()
        }
      }
    }
  );
}; 