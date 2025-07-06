import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase URL과 ANON 키를 가져옵니다
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kbnskzykzornnvjoknry.supabase.co';
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtibnNrenlrem9ybm52am9rbnJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MjM1NzEsImV4cCI6MjA2NzI5OTU3MX0.nhqiud7ulbcwkc76vEQ9sdKEGFqnP4N__rO-eeMfQXs';

// 싱글톤 인스턴스를 저장할 변수
let supabaseInstance: ReturnType<typeof createClient> | null = null;

// 브라우저 클라이언트 생성 (싱글톤 패턴)
export const createBrowserClient = () => {
  if (supabaseInstance) return supabaseInstance;
  
  // 브라우저 환경인지 확인
  const isBrowser = typeof window !== 'undefined';
  
  supabaseInstance = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    }
  );
  
  return supabaseInstance;
}; 