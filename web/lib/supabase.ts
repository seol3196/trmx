import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient as createBrowserSupabaseClient } from '@supabase/ssr';
import { createMiddlewareClient as createMiddlewareSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';

// 환경 변수에서 값을 가져오되, 실패할 경우 하드코딩된 값 사용
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kbnskzykzornnvjoknry.supabase.co';
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtibnNrenlrem9ybm52am9rbnJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTcyMjM1NzEsImV4cCI6MjAzMjc5OTU3MX0.gBEJhDKZgZCIvMBB4mvKHJOv0sYQFwNUOQGBU8cjT-M';

console.log('[Browser] Supabase URL:', supabaseUrl);
console.log('[Browser] Supabase Anon Key 길이:', supabaseAnonKey ? supabaseAnonKey.length : 0);

// 타입 정의
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

// 브라우저 클라이언트 생성 - 쿠키와 localStorage 모두 사용
export const createBrowserClient = () => {
  console.log('[Browser] 클라이언트 생성');
  
  return createBrowserSupabaseClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          if (typeof document !== 'undefined') {
            const value = document.cookie
              .split('; ')
              .find(row => row.startsWith(`${name}=`))
              ?.split('=')[1];
            return value ? decodeURIComponent(value) : undefined;
          }
          return undefined;
        },
        set(name: string, value: string, options: any) {
          if (typeof document !== 'undefined') {
            let cookieString = `${name}=${encodeURIComponent(value)}`;
            
            if (options?.maxAge) {
              cookieString += `; max-age=${options.maxAge}`;
            }
            if (options?.path) {
              cookieString += `; path=${options.path}`;
            }
            if (options?.domain) {
              cookieString += `; domain=${options.domain}`;
            }
            if (options?.secure) {
              cookieString += '; secure';
            }
            if (options?.httpOnly) {
              cookieString += '; httponly';
            }
            if (options?.sameSite) {
              cookieString += `; samesite=${options.sameSite}`;
            }
            
            document.cookie = cookieString;
          }
        },
        remove(name: string, options: any) {
          if (typeof document !== 'undefined') {
            let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            
            if (options?.path) {
              cookieString += `; path=${options.path}`;
            }
            if (options?.domain) {
              cookieString += `; domain=${options.domain}`;
            }
            
            document.cookie = cookieString;
          }
        },
      },
    }
  );
};

// 미들웨어 클라이언트 생성 - Next.js 미들웨어에서 사용
export const createMiddlewareClient = ({ req, res }: { req: NextRequest; res: NextResponse }) => {
  console.log('[Middleware] 클라이언트 생성');
  
  return createMiddlewareSupabaseClient<Database>({
    req,
    res,
  });
};

// 기본 클라이언트 인스턴스 (하위 호환성을 위해 유지)
export const supabase = createBrowserClient();