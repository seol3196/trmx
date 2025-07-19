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
        console.log('리디렉션 대상:', redirectTo);
        
        // 로컬 스토리지의 모든 키 확인 (디버깅용)
        console.log('로컬 스토리지 키 목록:', Object.keys(localStorage));
        
        // URL에서 코드 파라미터 확인
        const code = searchParams?.get('code');
        console.log('인증 코드:', code);
        
        if (code) {
          try {
            // 세션 교환 전에 로컬 스토리지에 code_verifier가 있는지 확인
            const codeVerifier = localStorage.getItem('supabase.auth.code_verifier');
            console.log('코드 검증기 존재 여부:', !!codeVerifier);
            console.log('코드 검증기 값 길이:', codeVerifier ? codeVerifier.length : 0);
            
            if (!codeVerifier) {
              console.error('코드 검증기가 없습니다. 로그인 페이지로 리디렉션합니다.');
              
              // 다시 로그인 시도를 위해 로컬 스토리지 초기화
              localStorage.removeItem('supabase.auth.code_verifier');
              localStorage.removeItem('supabase.auth.code_challenge');
              
              setTimeout(() => router.push('/auth/login'), 2000);
              return;
            }
            
            console.log('코드 교환 시도 중...');
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            console.log('코드 교환 결과:', { data, error });
            
            if (error) {
              console.error('인증 코드 교환 오류:', error);
              console.error('오류 세부 정보:', error.message, error.status);
              
              // 다시 로그인 시도를 위해 로컬 스토리지 초기화
              localStorage.removeItem('supabase.auth.code_verifier');
              localStorage.removeItem('supabase.auth.code_challenge');
              
              setTimeout(() => router.push('/auth/login'), 2000);
              return;
            }
            
            // 성공적으로 교환되었다면 리디렉션
            console.log('인증 성공, 리디렉션 준비');
            
            // 세션이 제대로 설정되었는지 확인
            const { data: sessionData } = await supabase.auth.getSession();
            console.log('세션 확인:', sessionData?.session ? '있음' : '없음');
            
            if (sessionData?.session) {
              console.log('사용자 정보:', {
                id: sessionData.session.user.id,
                email: sessionData.session.user.email,
                expires_at: sessionData.session.expires_at
              });
              
              // 직접 URL로 이동 (Next.js router 대신)
              console.log(`${redirectTo}로 이동합니다.`);
              window.location.href = redirectTo;
            } else {
              console.error('세션이 생성되지 않았습니다.');
              setTimeout(() => router.push('/auth/login'), 2000);
            }
            return;
          } catch (exchangeError) {
            console.error('코드 교환 중 예외 발생:', exchangeError);
            setTimeout(() => router.push('/auth/login'), 2000);
            return;
          }
        }
        
        // 코드가 없거나 교환에 실패한 경우 세션 확인
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
          
          // 직접 URL로 이동 (Next.js router 대신)
          console.log(`${redirectTo}로 이동합니다.`);
          window.location.href = redirectTo;
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