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
  userId?: string; // 사용자 ID 필드 추가
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

// 서버에 기록 저장
export const saveRecordToServer = async (record: CardRecord): Promise<void> => {
  try {
    console.log('서버에 기록 저장 시도:', record.id);
    const supabase = createBrowserClient();
    
    // 현재 로그인된 사용자 정보 가져오기 (자세한 로그 추가)
    console.log('사용자 정보 가져오기 시도...');
    const { data, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('사용자 정보 가져오기 오류:', userError);
    }
    
    console.log('가져온 사용자 데이터:', data?.user?.id, data?.user?.email);
    
    // 사용자 ID 설정 (하드코딩된 값 제거)
    let userId = data?.user?.id;
    let sessionData = null;
    
    if (!userId) {
      console.error('사용자 ID를 가져올 수 없음, 세션 확인 시도');
      
      // 세션으로 다시 시도
      const sessionResult = await supabase.auth.getSession();
      sessionData = sessionResult.data;
      const sessionError = sessionResult.error;
      
      console.log('세션 데이터:', sessionData?.session?.user?.id, sessionData?.session?.user?.email);
      
      if (sessionError) {
        console.error('세션 가져오기 오류:', sessionError);
      }
    }
    
    // 최종 사용자 ID 결정
    const finalUserId = userId || sessionData?.session?.user?.id;
    
    console.log('기록 저장에 사용할 사용자 ID:', finalUserId);
    
    if (!finalUserId) {
      console.error('사용자 ID를 확인할 수 없음, 기본값 사용하지 않음');
      throw new Error('사용자 인증 정보를 가져올 수 없습니다. 로그인 상태를 확인해주세요.');
    }
    
    // 서버에 저장
    const { data: insertData, error } = await supabase
      .from('card_records')
      .insert({
        id: record.id,
        student_id: record.studentId,
        card_id: record.cardId || null,
        subject: record.subject || '',
        memo: record.memo,
        recorded_date: new Date(record.recordedDate).toISOString(),
        user_id: finalUserId
      });
    
    if (error) {
      console.error('Supabase 저장 오류:', error);
      throw error;
    }
    
    console.log('서버 저장 성공:', record.id);
  } catch (error) {
    console.error('서버 저장 중 예외 발생:', error);
    throw error;
  }
};

// 기록 저장 - 온라인/오프라인 모두 지원
export const saveRecord = async (record: CardRecord): Promise<string> => {
  try {
    console.log('기록 저장 함수 호출됨:', record);
    
    if (!record.id) {
      record.id = crypto.randomUUID();
      console.log('새 ID 생성:', record.id);
    }
    
    // 사용자 ID 가져오기
    const supabase = createBrowserClient();
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    
    console.log('기록 저장 - 현재 사용자 ID:', userId);
    
    // 사용자 ID 추가
    if (userId) {
      record.userId = userId;
    } else {
      console.error('사용자 ID를 가져올 수 없음, 세션 확인');
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUserId = sessionData.session?.user?.id;
      
      if (sessionUserId) {
        record.userId = sessionUserId;
        console.log('세션에서 사용자 ID 가져옴:', sessionUserId);
      } else {
        console.error('사용자 인증 정보를 가져올 수 없습니다.');
        throw new Error('사용자 인증 정보를 가져올 수 없습니다. 로그인 상태를 확인해주세요.');
      }
    }
    
    // 로컬에 저장
    console.log('로컬 스토리지에 저장 시도...');
    const recordId = await indexedDB.saveRecord(record);
    console.log('로컬 저장 성공:', recordId);
    
    // 온라인 상태일 때 서버에도 저장 시도
    try {
      if (isOnline()) {
        console.log('온라인 상태 - 서버 저장 시도');
        try {
          await saveRecordToServer(record);
          console.log('서버 저장 성공');
          
          // 동기화 상태 업데이트
          await indexedDB.updateRecordSyncStatus(record.id, true);
          console.log('동기화 상태 업데이트 완료');
        } catch (serverError) {
          console.error('서버 저장 실패, 동기화 큐에 추가:', serverError);
          
          // 서버 저장 실패 시 동기화 큐에 추가
          await indexedDB.addToSyncQueue({
            operation: 'create',
            data: record,
            timestamp: Date.now()
          });
          console.log('동기화 큐에 추가됨');
        }
      } else {
        console.log('오프라인 상태 - 동기화 큐에 추가');
        
        // 오프라인일 때 동기화 큐에 추가
        await indexedDB.addToSyncQueue({
          operation: 'create',
          data: record,
          timestamp: Date.now()
        });
        console.log('동기화 큐에 추가됨');
      }
    } catch (syncError) {
      console.error('동기화 처리 오류:', syncError);
      // 동기화 처리 실패해도 로컬 저장은 성공했으므로 계속 진행
    }
    
    return recordId;
  } catch (error) {
    console.error('기록 저장 전체 오류:', error);
    throw error;
  }
};

// 서버에서 기록 삭제
export const deleteRecordFromServer = async (recordId: string): Promise<void> => {
  const supabase = createBrowserClient();
  
  // 서버에서 삭제
  const { error } = await supabase
    .from('card_records')
    .delete()
    .eq('id', recordId);
  
  if (error) {
    console.error('Supabase 삭제 오류:', error);
    throw error;
  }
};

// 기록 가져오기 - 온라인/오프라인 모두 지원
export const getRecords = async (): Promise<CardRecord[]> => {
  console.log('getRecords 함수 호출됨');
  
  // 로컬 저장소에서 가져오기
  try {
    const localRecords = await indexedDB.getRecords();
    console.log('로컬 저장소에서 가져온 기록:', localRecords.length, '개');
    
    // 온라인 상태일 때 서버에서도 가져오기
    if (isOnline()) {
      console.log('온라인 상태 - 서버에서 기록 가져오는 중');
      try {
        const supabase = createBrowserClient();
        console.log('Supabase 클라이언트 생성됨');
        
        // 현재 로그인된 사용자 정보 가져오기
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || 'a729c507-8d88-45d8-b15e-c945fe836b68'; // wogh0625@gmail.com의 ID를 기본값으로 사용
        
        console.log('기록 조회 - 사용자 ID:', userId);
        
        // 서버에서 기록 가져오기 (사용자 ID로 필터링)
        const { data: serverRecords, error } = await supabase
          .from('card_records')
          .select('*')
          .eq('user_id', userId)
          .order('recorded_date', { ascending: false });
        
        if (error) {
          console.error('Supabase 조회 오류:', error);
          return localRecords;
        }
        
        console.log('서버에서 가져온 기록:', serverRecords?.length || 0, '개');
        
        // 서버 데이터를 로컬 형식으로 변환
        const formattedServerRecords: CardRecord[] = (serverRecords || []).map(record => {
          console.log('서버 기록 변환:', record);
          return {
            id: record.id as string,
            studentId: record.student_id as string,
            cardId: record.card_id ? String(record.card_id) : undefined,
            subject: record.subject as string,
            memo: record.memo as string,
            recordedDate: new Date(record.recorded_date as string | number),
            serverSynced: true
          };
        });
        
        // 로컬 데이터와 병합 (서버 데이터 우선)
        const mergedRecords = mergeRecords(localRecords, formattedServerRecords);
        console.log('병합된 총 기록:', mergedRecords.length, '개');
        
        // 로컬 저장소 업데이트
        console.log('로컬 저장소 업데이트 중');
        for (const record of mergedRecords) {
          await indexedDB.saveRecord(record, true); // skipQueue=true로 설정하여 동기화 큐에 추가하지 않음
        }
        
        return mergedRecords;
      } catch (error) {
        console.error('서버 데이터 가져오기 오류:', error);
        return localRecords;
      }
    } else {
      console.log('오프라인 상태 - 로컬 기록만 사용');
    }
    
    return localRecords;
  } catch (error) {
    console.error('getRecords 실행 오류:', error);
    return [];
  }
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