'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import syncManager from '../utils/syncManager';
import { subscribeSyncStatus, type SyncStatus } from '../utils/recordsApi';

/**
 * 동기화 상태를 표시하는 컴포넌트
 */
export default function SyncStatus() {
  const [online, setOnline] = useState<boolean>(true);
  const [pendingItems, setPendingItems] = useState<number>(0);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // 동기화 상태 구독
  useEffect(() => {
    // subscribeSyncStatus API를 사용하여 동기화 상태 구독
    const unsubscribe = subscribeSyncStatus((status: SyncStatus) => {
      setOnline(status.online);
      setPendingItems(status.pendingCount);
      if (status.lastSyncedAt) {
        setLastSynced(status.lastSyncedAt);
      }
    });
    
    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      unsubscribe();
    };
  }, []);

  // 수동 동기화 처리
  const handleSync = async () => {
    if (syncing) return;
    
    setSyncing(true);
    try {
      await syncManager.syncNow();
    } catch (error) {
      console.error('수동 동기화 오류:', error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      {/* 온라인/오프라인 상태 */}
      <div className="flex items-center">
        <span 
          className={`inline-block w-2 h-2 rounded-full mr-1 ${
            online ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span>{online ? '온라인' : '오프라인'}</span>
      </div>
      
      {/* 구분선 */}
      <span className="text-gray-300">|</span>
      
      {/* 동기화 상태 */}
      <div className="flex items-center">
        {pendingItems > 0 ? (
          <span className="text-amber-500">
            {pendingItems}개 항목 동기화 대기 중
          </span>
        ) : (
          <span className="text-green-500">
            모든 항목 동기화 완료
          </span>
        )}
      </div>
      
      {/* 마지막 동기화 시간 */}
      {lastSynced && (
        <>
          <span className="text-gray-300">|</span>
          <span className="text-gray-500">
            마지막 동기화: {format(lastSynced, 'HH:mm:ss')}
          </span>
        </>
      )}
      
      {/* 수동 동기화 버튼 */}
      <button
        className={`ml-2 px-2 py-1 rounded text-xs ${
          online
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
        onClick={handleSync}
        disabled={!online || syncing}
      >
        {syncing ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            동기화 중...
          </span>
        ) : (
          '지금 동기화'
        )}
      </button>
    </div>
  );
} 