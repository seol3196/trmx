'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const redirectTo = searchParams?.get('next') || '/dashboard';
        const supabase = createBrowserClient();
        
        console.log('콜백 처리 시작');
        console.log('현재 URL:', window.location.href);
        
        // URL에서 코드 파라미터 확인
        const code = searchParams?.get('code');
        console.log('인증 코드:', code);
        
        if (code) {
          // 코드가 있으면 세션 교환 시도
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          console.log('코드 교환 결과:', { data, error });
          
          if (error) {
            console.error('인증 코드 교환 오류:', error);
            setTimeout(() => router.push('/auth/login'), 2000);
            return;
          }
        }
        
        // 세션 확인
        const { data, error } = await supabase.auth.getSession();
        
        console.log('세션 데이터:', data);
        console.log('세션 오류:', error);
        
        if (data?.session) {
          console.log('세션 존재:', {
            user: data.session.user.email,
            expires_at: data.session.expires_at
          });
          
          // 쿠키 확인
          console.log('브라우저 쿠키:', document.cookie);
          
          // 세션이 있으면 성공
          console.log('로그인 성공, 리디렉션 준비');
          
          // 약간의 지연 후 리디렉션
          setTimeout(() => {
            console.log('리디렉션 실행:', redirectTo);
            router.push(redirectTo);
          }, 2000);
        } else {
          console.log('세션이 없음, 로그인 페이지로 이동');
          setTimeout(() => router.push('/auth/login'), 2000);
        }
      } catch (error) {
        console.error('콜백 처리 오류:', error);
        setTimeout(() => router.push('/auth/login'), 2000);
      }
    };
    
    handleCallback();
  }, [router, searchParams]);
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">로그인 처리 중...</h2>
        <p className="text-gray-600">잠시만 기다려주세요.</p>
      </div>
    </div>
  );
}