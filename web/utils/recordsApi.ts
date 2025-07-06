import { createBrowserClient } from '../lib/supabase';
import * as indexedDB from './indexedDB';

// 네트워크 상태 확인
export const isOnline = () => {
  return typeof navigator !== 'undefined' && navigator.onLine;
};

// 동기화 상태 타입 정의
export interface SyncStatus {
  online: boolean;
  pendingCount: number;
  lastSyncedAt: Date | null;
}

// 카드 기록 타입 정의
export interface CardRecord {
  id: string;
  studentId: string;
  cardId?: string;
  subject?: string;
  memo: string;
  recordedDate: Date;
  serverSynced?: boolean;
}

// 동기화 상태 구독자 목록
const syncStatusSubscribers: ((status: SyncStatus) => void)[] = [];

// 동기화 상태 구독
export const subscribeSyncStatus = (callback: (status: SyncStatus) => void) => {
  syncStatusSubscribers.push(callback);
  
  // 현재 상태 즉시 전달
  const currentStatus: SyncStatus = {
    online: isOnline(),
    pendingCount: 0,
    lastSyncedAt: null
  };
  
  // 동기화 큐에서 대기 중인 항목 수 가져오기
  indexedDB.getSyncQueue().then(queue => {
    currentStatus.pendingCount = queue.length;
    callback(currentStatus);
  });
  
  // 구독 취소 함수 반환
  return () => {
    const index = syncStatusSubscribers.indexOf(callback);
    if (index > -1) {
      syncStatusSubscribers.splice(index, 1);
    }
  };
};

// 동기화 상태 업데이트 및 알림
const notifySyncStatusChange = async () => {
  const queue = await indexedDB.getSyncQueue();
  const status: SyncStatus = {
    online: isOnline(),
    pendingCount: queue.length,
    lastSyncedAt: new Date()
  };
  
  // 모든 구독자에게 알림
  syncStatusSubscribers.forEach(callback => callback(status));
};

// 기록 저장 - 온라인/오프라인 모두 지원
export const saveRecord = async (record: CardRecord): Promise<string> => {
  // 로컬 저장소에 저장
  const recordId = await indexedDB.saveRecord(record);
  
  // 온라인 상태일 때 서버에도 저장
  if (isOnline()) {
    try {
      await saveRecordToServer({...record, id: recordId});
      await indexedDB.updateRecordSyncStatus(recordId, true);
    } catch (error) {
      console.error('서버 저장 오류:', error);
      // 동기화 큐에 추가
      await indexedDB.addToSyncQueue({
        operation: 'create',
        data: {...record, id: recordId},
        timestamp: Date.now()
      });
    }
  } else {
    // 오프라인 상태일 때 동기화 큐에 추가
    await indexedDB.addToSyncQueue({
      operation: 'create',
      data: {...record, id: recordId},
      timestamp: Date.now()
    });
  }
  
  // 동기화 상태 업데이트
  await notifySyncStatusChange();
  
  return recordId;
};

// 서버에 기록 저장
export const saveRecordToServer = async (record: CardRecord): Promise<void> => {
  const supabase = createBrowserClient();
  
  // 서버에 저장
  const { error } = await supabase
    .from('notes')
    .insert({
      id: record.id,
      student_id: record.studentId,
      card_id: record.cardId || null,
      content: record.memo,
      recorded_date: new Date(record.recordedDate).toISOString().split('T')[0],
      created_by: (await supabase.auth.getUser()).data.user?.id || ''
    });
  
  if (error) {
    console.error('Supabase 저장 오류:', error);
    throw error;
  }
};

// 서버에서 기록 삭제
export const deleteRecordFromServer = async (recordId: string): Promise<void> => {
  const supabase = createBrowserClient();
  
  // 서버에서 삭제
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', recordId);
  
  if (error) {
    console.error('Supabase 삭제 오류:', error);
    throw error;
  }
};

// 기록 가져오기 - 온라인/오프라인 모두 지원
export const getRecords = async (): Promise<CardRecord[]> => {
  // 로컬 저장소에서 가져오기
  const localRecords = await indexedDB.getRecords();
  
  // 온라인 상태일 때 서버에서도 가져오기
  if (isOnline()) {
    try {
      const supabase = createBrowserClient();
      
      // 서버에서 기록 가져오기
      const { data: serverRecords, error } = await supabase
        .from('notes')
        .select('*')
        .order('recorded_date', { ascending: false });
      
      if (error) {
        console.error('Supabase 조회 오류:', error);
        return localRecords;
      }
      
      // 서버 데이터를 로컬 형식으로 변환
      const formattedServerRecords: CardRecord[] = (serverRecords || []).map(record => ({
        id: record.id as string,
        studentId: record.student_id as string,
        cardId: record.card_id ? String(record.card_id) : undefined,
        subject: record.subject as string | undefined,
        memo: record.memo as string,
        recordedDate: new Date(record.recorded_date as string | number),
        serverSynced: true
      }));
      
      // 로컬 데이터와 병합 (서버 데이터 우선)
      const mergedRecords = mergeRecords(localRecords, formattedServerRecords);
      
      // 로컬 저장소 업데이트
      for (const record of mergedRecords) {
        await indexedDB.saveRecord(record);
      }
      
      return mergedRecords;
    } catch (error) {
      console.error('서버 데이터 가져오기 오류:', error);
      return localRecords;
    }
  }
  
  return localRecords;
};

// 로컬 및 서버 기록 병합
const mergeRecords = (
  localRecords: CardRecord[],
  serverRecords: CardRecord[]
): CardRecord[] => {
  const recordMap = new Map<string, CardRecord>();
  
  // 로컬 기록 추가
  localRecords.forEach(record => {
    recordMap.set(record.id, record);
  });
  
  // 서버 기록으로 덮어쓰기 (서버 데이터 우선)
  serverRecords.forEach(record => {
    recordMap.set(record.id, {
      ...record,
      serverSynced: true
    });
  });
  
  return Array.from(recordMap.values());
};

// 기록 삭제 - 온라인/오프라인 모두 지원
export const deleteRecord = async (recordId: string): Promise<void> => {
  // 로컬 저장소에서 삭제
  await indexedDB.deleteRecord(recordId);
  
  // 온라인 상태일 때 서버에서도 삭제
  if (isOnline()) {
    try {
      await deleteRecordFromServer(recordId);
    } catch (error) {
      console.error('서버 삭제 오류:', error);
      // 동기화 큐에 추가
      await indexedDB.addToSyncQueue({
        operation: 'delete',
        data: { id: recordId },
        timestamp: Date.now()
      });
    }
  } else {
    // 오프라인 상태일 때 동기화 큐에 추가
    await indexedDB.addToSyncQueue({
      operation: 'delete',
      data: { id: recordId },
      timestamp: Date.now()
    });
  }
  
  // 동기화 상태 업데이트
  await notifySyncStatusChange();
};

// 동기화 작업 실행
export const syncWithServer = async (): Promise<void> => {
  if (!isOnline()) {
    console.log('오프라인 상태: 동기화 건너뜀');
    return;
  }
  
  const syncQueue = await indexedDB.getSyncQueue();
  
  if (syncQueue.length === 0) {
    console.log('동기화할 항목 없음');
    return;
  }
  
  console.log(`${syncQueue.length}개 항목 동기화 시작`);
  
  // 성능 최적화: 동기화 작업을 배치 처리
  const batchSize = 10;
  const batches = [];
  
  for (let i = 0; i < syncQueue.length; i += batchSize) {
    batches.push(syncQueue.slice(i, i + batchSize));
  }
  
  for (const batch of batches) {
    await Promise.all(batch.map(async (item) => {
      try {
        if (item.operation === 'create') {
          await saveRecordToServer(item.data);
        } else if (item.operation === 'delete') {
          await deleteRecordFromServer(item.data.id);
        }
        
        // 성공적으로 처리된 항목 제거
        await indexedDB.removeFromSyncQueue(item);
        
        // 생성 작업인 경우 로컬 기록 상태 업데이트
        if (item.operation === 'create') {
          await indexedDB.updateRecordSyncStatus(item.data.id, true);
        }
      } catch (error) {
        console.error(`동기화 오류 (${item.operation}):`, error);
      }
    }));
  }
  
  // 동기화 상태 업데이트
  await notifySyncStatusChange();
  
  console.log('동기화 완료');
};

// 페이지 언로드 시 동기화 시도
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', async () => {
    if (isOnline()) {
      try {
        // 동기화 큐 가져오기
        const syncQueue = await indexedDB.getSyncQueue();
        
        if (syncQueue.length > 0) {
          // sendBeacon API를 사용하여 동기화 데이터 전송
          const blob = new Blob(
            [JSON.stringify({ items: syncQueue })], 
            { type: 'application/json' }
          );
          
          navigator.sendBeacon('/api/sync', blob);
          console.log('페이지 언로드 전 동기화 요청 전송');
        }
      } catch (error) {
        console.error('페이지 언로드 전 동기화 실패:', error);
      }
    }
  });
} 