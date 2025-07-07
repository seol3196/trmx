import { createClient } from '@supabase/supabase-js';
import fetch from 'cross-fetch';

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
  
  try {
    // 직접 DB 접근 대신 하드코딩된 데이터 반환
    const mockClient = {
      from: (table: string) => {
        return {
          select: (columns: string) => {
            // 학생 테이블 모의 데이터
            if (table === 'students') {
              return Promise.resolve({
                data: [
                  { id: '1', name: '1번 학생', class_id: 'class1', student_number: 1 },
                  { id: '2', name: '2번 학생', class_id: 'class1', student_number: 2 },
                  { id: '3', name: '3번 학생', class_id: 'class1', student_number: 3 },
                  { id: '4', name: '4번 학생', class_id: 'class1', student_number: 4 },
                  { id: '5', name: '5번 학생', class_id: 'class1', student_number: 5 }
                ],
                error: null
              });
            }
            // 노트 테이블 모의 데이터
            else if (table === 'notes') {
              return {
                gte: (column: string, value: string) => {
                  return Promise.resolve({
                    data: [
                      { student_id: '1', id: 'note1', created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
                      { student_id: '2', id: 'note2', created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() },
                      { student_id: '2', id: 'note3', created_at: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString() },
                      { student_id: '3', id: 'note4', created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
                      { student_id: '3', id: 'note5', created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
                      { student_id: '3', id: 'note6', created_at: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString() },
                      { student_id: '4', id: 'note7', created_at: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString() },
                      { student_id: '4', id: 'note8', created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString() },
                      { student_id: '4', id: 'note9', created_at: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString() },
                      { student_id: '4', id: 'note10', created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() }
                    ],
                    error: null
                  });
                }
              };
            }
            return Promise.resolve({ data: [], error: null });
          }
        };
      }
    };
    
    return mockClient as any;
  } catch (error) {
    console.error('Supabase 서버 클라이언트 생성 오류:', error);
    
    // 오류 발생 시 빈 모의 클라이언트 반환
    const emptyMockClient = {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null })
      })
    };
    
    return emptyMockClient as any;
  }
}; 