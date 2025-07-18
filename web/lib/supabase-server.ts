'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// 서버 컴포넌트에서 사용할 Supabase 클라이언트 생성
export const createServerSupabaseClient = () => {
  const cookieStore = cookies();
  const cookieString = cookieStore.toString();
  
  console.log('[Server] 쿠키 문자열:', cookieString);
  
  // 환경 변수에서 값을 가져오되, 실패할 경우 하드코딩된 값 사용
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kbnskzykzornnvjoknry.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtibnNrenlrem9ybm52am9rbnJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTcyMjM1NzEsImV4cCI6MjAzMjc5OTU3MX0.gBEJhDKZgZCIvMBB4mvKHJOv0sYQFwNUOQGBU8cjT-M';
  
  console.log('[Server] Supabase URL:', supabaseUrl);
  console.log('[Server] Supabase Anon Key 길이:', supabaseAnonKey ? supabaseAnonKey.length : 0);
  
  const client = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
        detectSessionInUrl: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          cookie: cookieString
        }
      }
    }
  );
  
  return client;
}; 