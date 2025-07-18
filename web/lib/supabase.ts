import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient as createBrowserSupabaseClient } from '@supabase/ssr';
import { createMiddlewareClient as createMiddlewareSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';

// 환경 변수에서 Supabase URL과 ANON 키를 가져옵니다
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다. NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인해주세요.');
}

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
  return createMiddlewareSupabaseClient<Database>({
    req,
    res,
  });
};

// 기본 클라이언트 인스턴스 (하위 호환성을 위해 유지)
export const supabase = createBrowserClient();