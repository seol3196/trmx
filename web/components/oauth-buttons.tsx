'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import { Provider } from '@supabase/supabase-js';

/**
 * OAuth 버튼 컴포넌트 속성 인터페이스
 */
interface OAuthButtonsProps {
  /** 로그인 성공 후 리디렉션할 경로 */
  redirectTo?: string;
  /** 버튼 크기 변형 */
  size?: 'sm' | 'md' | 'lg';
  /** 버튼 라벨 커스터마이징 */
  label?: string;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * OAuth 인증 오류 타입 정의
 */
type AuthError = {
  message: string;
  provider: Provider | null;
};

/**
 * 표준화된 오류 메시지
 */
const AUTH_ERRORS = {
  GOOGLE_AUTH_CANCELLED: '구글 로그인이 취소되었습니다.',
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  SESSION_ERROR: '세션 생성 중 오류가 발생했습니다.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
};

/**
 * OAuth 버튼 컴포넌트
 * 구글 로그인 기능을 제공하는 버튼 컴포넌트입니다.
 */
export function OAuthButtons({ 
  redirectTo = '/dashboard',
  size = 'md',
  label = 'Google로 계속하기',
  className = ''
}: OAuthButtonsProps) {
  // 상태 관리
  const [isLoading, setIsLoading] = useState<Provider | null>(null);
  const [error, setError] = useState<AuthError | null>(null);
  
  // Supabase 클라이언트 생성
  const supabase = createBrowserClient();
  
  // 컴포넌트 마운트 시 로컬 스토리지 확인
  useEffect(() => {
    // 디버깅용: 로컬 스토리지의 모든 키 확인
    console.log('로컬 스토리지 키 목록:', Object.keys(localStorage));
    
    // code_verifier가 있는지 확인
    const codeVerifier = localStorage.getItem('supabase.auth.code_verifier');
    console.log('기존 코드 검증기 존재 여부:', !!codeVerifier);
  }, []);

  /**
   * OAuth 로그인 처리 함수
   */
  const handleOAuthSignIn = async (provider: Provider) => {
    // 이전 오류 초기화 및 로딩 상태 설정
    setError(null);
    setIsLoading(provider);
    
    try {
      // 기존 코드 검증기 제거 (새로운 인증 시도를 위해)
      localStorage.removeItem('supabase.auth.code_verifier');
      console.log('기존 코드 검증기 제거됨');
      
      // OAuth 로그인 요청
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          // 콜백 URL을 통해 인증 후 리디렉션 처리
          redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
          // 추가 OAuth 옵션
          queryParams: {
            access_type: 'offline', // 리프레시 토큰 요청
            prompt: 'consent',      // 항상 동의 화면 표시
          }
        },
      });
      
      // 오류 발생 시 예외 처리
      if (error) throw error;
      
      // 디버깅: 응답 데이터 확인
      console.log('OAuth 요청 결과:', data);
      
      // 리디렉션 전에 코드 검증기가 저장되었는지 확인
      setTimeout(() => {
        const codeVerifier = localStorage.getItem('supabase.auth.code_verifier');
        console.log('리디렉션 전 코드 검증기 존재 여부:', !!codeVerifier);
      }, 500);
      
    } catch (error: any) {
      console.error(`${provider} 로그인 오류:`, error);
      
      // 오류 유형에 따른 사용자 친화적 메시지 설정
      let errorMessage = AUTH_ERRORS.UNKNOWN_ERROR;
      
      if (error.message?.includes('network')) {
        errorMessage = AUTH_ERRORS.NETWORK_ERROR;
      } else if (error.message?.includes('cancelled')) {
        errorMessage = AUTH_ERRORS.GOOGLE_AUTH_CANCELLED;
      } else if (error.message?.includes('session')) {
        errorMessage = AUTH_ERRORS.SESSION_ERROR;
      }
      
      setError({ message: errorMessage, provider });
      
    } finally {
      // 로딩 상태 해제
      setIsLoading(null);
    }
  };

  // 버튼 크기에 따른 스타일 클래스
  const sizeClasses = {
    sm: 'py-1.5 px-3 text-xs',
    md: 'py-2 px-4 text-sm',
    lg: 'py-2.5 px-5 text-base'
  };

  return (
    <div className={`flex flex-col gap-4 w-full ${className}`}>
      {/* 구분선 */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
            간편 로그인
          </span>
        </div>
      </div>

      {/* 구글 로그인 버튼 */}
      <button
        onClick={() => handleOAuthSignIn('google')}
        disabled={isLoading !== null}
        aria-label="구글 계정으로 로그인"
        aria-busy={isLoading === 'google'}
        aria-live="polite"
        className={`
          flex items-center justify-center w-full 
          ${sizeClasses[size]} 
          border border-gray-300 dark:border-gray-700 
          rounded-md shadow-sm 
          bg-white dark:bg-gray-800 
          text-gray-700 dark:text-gray-200 
          font-medium 
          transition-colors duration-200
          hover:bg-gray-50 dark:hover:bg-gray-700
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          disabled:opacity-70 disabled:cursor-not-allowed
        `}
      >
        {/* 구글 아이콘 */}
        <svg
          className={`${size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} mr-2`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        
        {/* 버튼 텍스트 (로딩 상태에 따라 변경) */}
        {isLoading === 'google' ? (
          <span className="flex items-center">
            <svg 
              className={`animate-spin -ml-1 mr-2 ${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'}`} 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              ></circle>
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            로그인 중...
          </span>
        ) : label}
      </button>
      
      {/* 오류 메시지 표시 */}
      {error && (
        <div 
          className="mt-2 text-sm text-red-600 dark:text-red-400"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center">
            <svg 
              className="h-4 w-4 mr-1" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor"
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                clipRule="evenodd" 
              />
            </svg>
            {error.message}
          </div>
          <button 
            onClick={() => setError(null)} 
            className="mt-1 text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
            aria-label="오류 메시지 닫기"
          >
            다시 시도하기
          </button>
        </div>
      )}
    </div>
  );
}