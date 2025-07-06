import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase URL과 ANON 키를 가져옵니다
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kbnskzyzkornvjoknry.supabase.co';
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtibnNrenlrem9ybm52am9rbnJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MjM1NzEsImV4cCI6MjA2NzI5OTU3MX0.nhqiud7ulbcwkc76vEQ9sdKEGFqnP4N__rO-eeMfQXs';
// 서비스 롤 키는 서버 측에서만 사용해야 합니다
export const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtibnNrenlrem9ybm52am9rbnJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTcyMzU3MSwiZXhwIjoyMDY3Mjk5NTcxfQ.qov51H7Hdx73j47kGQwaZRPakePSu-6sGFaVPwEArSo';

// 싱글톤 인스턴스를 저장할 변수
let supabaseInstance: ReturnType<typeof createClient> | null = null;
let supabaseServerInstance: ReturnType<typeof createClient> | null = null;

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

// 서버 클라이언트 생성 (싱글톤 패턴) - 서비스 롤 키 사용
export const createServerClient = () => {
  if (supabaseServerInstance) return supabaseServerInstance;
  
  supabaseServerInstance = createClient(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
  
  return supabaseServerInstance;
}; 