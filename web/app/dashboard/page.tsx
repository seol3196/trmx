'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';

export default function Dashboard() {
  const { user, signOut, isLoading } = useAuth();
  const [userName, setUserName] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    if (user) {
      // 사용자 이름은 메타데이터에서 가져옴
      setUserName(user.user_metadata?.name || '사용자');
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 네비게이션 바 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">ClickNote</h1>
            </div>
            <div className="flex items-center">
              <span className="mr-4 text-sm text-gray-600">
                안녕하세요, {userName}님
              </span>
              <button
                onClick={handleSignOut}
                className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">대시보드</h2>
          <p className="text-gray-600">
            여기에 대시보드 내용이 표시됩니다. 환영합니다, {userName}님!
          </p>
        </div>
      </main>
    </div>
  );
} 