'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SyncStatus from '../../components/SyncStatus';
import syncManager from '../../utils/syncManager';
import { useAuth } from '../../components/auth-provider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 동기화 관리자 초기화
  useEffect(() => {
    syncManager.initialize();
    
    return () => {
      syncManager.cleanup();
    };
  }, []);

  // 로그아웃 처리
  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      await signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('로그아웃 오류:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 상단 네비게이션 바 */}
      <nav style={{ backgroundColor: 'white', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}>
        <div style={{ width: '100%', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', height: '4rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2563eb' }}>ClickNote</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link href="/dashboard" style={{ color: '#4b5563', textDecoration: 'none' }}>
                대시보드
              </Link>
              <Link href="/dashboard/cards" style={{ color: '#4b5563', textDecoration: 'none' }}>
                카드 기록
              </Link>
              <Link href="/dashboard/records" style={{ color: '#4b5563', textDecoration: 'none' }}>
                기록 조회
              </Link>
              <Link href="/dashboard/card-management" style={{ color: '#4b5563', textDecoration: 'none' }}>
                카드 관리
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      {/* 동기화 상태 표시줄 */}
      <div style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ width: '100%', padding: '0.5rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* 사용자 정보 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ 
              width: '2rem', 
              height: '2rem', 
              borderRadius: '50%', 
              backgroundColor: '#4f46e5', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {user?.email || '사용자'}
            </span>
          </div>
          
          {/* 동기화 상태와 로그아웃 버튼 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <SyncStatus />
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#6b7280',
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                cursor: isLoggingOut ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isLoggingOut ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!isLoggingOut) {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#9ca3af';
                  e.currentTarget.style.color = '#374151';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoggingOut) {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.color = '#6b7280';
                }
              }}
            >
              {isLoggingOut ? (
                <>
                  <svg 
                    style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      style={{ opacity: 0.25 }} 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      style={{ opacity: 0.75 }} 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  로그아웃 중...
                </>
              ) : (
                <>
                  <svg 
                    style={{ width: '1rem', height: '1rem' }} 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                    />
                  </svg>
                  로그아웃
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* 메인 콘텐츠 */}
      <main style={{ flexGrow: 1, backgroundColor: '#f9fafb' }}>
        {children}
      </main>
      
      {/* 푸터 */}
      <footer style={{ backgroundColor: 'white', borderTop: '1px solid #e5e7eb', padding: '1rem 0' }}>
        <div style={{ width: '100%', padding: '0 1.5rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
          &copy; {new Date().getFullYear()} ClickNote - 교사를 위한 학생 기록 도구
        </div>
      </footer>
      
      {/* 스피너 애니메이션을 위한 CSS */}
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}