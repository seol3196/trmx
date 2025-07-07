'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SyncStatus from '../../components/SyncStatus';
import syncManager from '../../utils/syncManager';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 동기화 관리자 초기화
  useEffect(() => {
    syncManager.initialize();
    
    return () => {
      syncManager.cleanup();
    };
  }, []);

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
        <div style={{ width: '100%', padding: '0.5rem 1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <SyncStatus />
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
    </div>
  );
} 