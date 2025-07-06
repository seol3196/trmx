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
    <div className="min-h-screen flex flex-col">
      {/* 상단 네비게이션 바 */}
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">ClickNote</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-blue-600">
                대시보드
              </Link>
              <Link href="/dashboard/cards" className="text-gray-600 hover:text-blue-600">
                카드 기록
              </Link>
              <Link href="/dashboard/records" className="text-gray-600 hover:text-blue-600">
                기록 조회
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      {/* 동기화 상태 표시줄 */}
      <div className="bg-gray-50 border-b">
        <div className="container mx-auto px-4 py-2 flex justify-end">
          <SyncStatus />
        </div>
      </div>
      
      {/* 메인 콘텐츠 */}
      <main className="flex-grow bg-gray-50">
        {children}
      </main>
      
      {/* 푸터 */}
      <footer className="bg-white border-t py-4">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} ClickNote - 교사를 위한 학생 기록 도구
        </div>
      </footer>
    </div>
  );
} 