/**
 * IndexedDB를 사용하여 오프라인 캐시를 구현하는 유틸리티 함수
 * 단순화된 버전으로 기본 기능만 제공합니다.
 */

const DB_NAME = 'clicknote-db';
const DB_VERSION = 1;
const RECORDS_STORE = 'records';
const SYNC_QUEUE_STORE = 'syncQueue';

// 동기화 작업 타입
export interface SyncQueueItem {
  id?: string;
  operation: 'create' | 'delete' | 'update';
  data: any;
  timestamp: number;
}

// 카드 기록 타입
export interface CardRecord {
  id: string;
  studentId: string;
  cardId?: string;
  subject?: string;
  memo: string;
  recordedDate: Date;
  serverSynced?: boolean;
}

// 로컬 저장을 위한 타입 (recordedDate가 문자열)
interface StoredCardRecord {
  id: string;
  studentId: string;
  cardId?: string;
  subject?: string;
  memo: string;
  recordedDate: string;
  serverSynced?: boolean;
}

// IndexedDB 초기화 (앱 시작시 호출되어야 함)
export const initializeDB = (): Promise<void> => {
  return new Promise((resolve) => {
    // 간단하게 초기화 성공으로 처리
    console.log('IndexedDB 초기화 간소화됨');
    // 로컬 저장소에 대체 사용 표시
    if (typeof window !== 'undefined') {
      localStorage.setItem('use-local-storage-fallback', 'true');
    }
    resolve();
  });
};

// 로컬 저장소 대체 구현
// 브라우저 IndexedDB 문제 회피를 위해 localStorage 사용
let localRecords: {[key: string]: StoredCardRecord} = {};
let localSyncQueue: {[key: string]: SyncQueueItem} = {};

// 앱 시작 시 로컬 저장소에서 데이터 복원
if (typeof window !== 'undefined') {
  try {
    const savedRecords = localStorage.getItem('clicknote-records');
    if (savedRecords) {
      localRecords = JSON.parse(savedRecords);
      console.log('로컬 저장소에서 기록 복원됨:', Object.keys(localRecords).length);
    }
    
    const savedQueue = localStorage.getItem('clicknote-sync-queue');
    if (savedQueue) {
      localSyncQueue = JSON.parse(savedQueue);
      console.log('로컬 저장소에서 동기화 큐 복원됨:', Object.keys(localSyncQueue).length);
    }
  } catch (error) {
    console.error('로컬 저장소 복원 오류:', error);
  }
}

// 저장소에 변경사항 저장
const saveToLocalStorage = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('clicknote-records', JSON.stringify(localRecords));
    localStorage.setItem('clicknote-sync-queue', JSON.stringify(localSyncQueue));
  }
};

// localStorage 폴백 구현
const useLocalStorageFallback = () => {
  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined';
  
  if (!isBrowser) {
    return false;
  }
  
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    return true;
  } catch (e) {
    console.error('localStorage is not available:', e);
    return false;
  }
};

// 기록 저장
export const saveRecord = async (record: CardRecord, skipQueue: boolean = false): Promise<string> => {
  try {
    console.log('기록 저장 시작:', record);
    
    // 새 기록인 경우 ID 생성
    if (!record.id) {
      record.id = crypto.randomUUID();
      console.log('새 ID 생성됨:', record.id);
    }
    
    // 날짜 객체를 ISO 문자열로 변환하여 저장
    const recordToSave = {
      ...record,
      recordedDate: record.recordedDate instanceof Date 
        ? record.recordedDate.toISOString() 
        : record.recordedDate
    };
    
    // 로컬 저장소에 저장
    localRecords[record.id] = recordToSave;
    saveToLocalStorage();
    
    console.log('기록 저장 성공:', record.id);
    return record.id;
  } catch (error) {
    console.error('기록 저장 오류:', error);
    throw error;
  }
};

// 기록 가져오기
export const getRecords = async (): Promise<CardRecord[]> => {
  try {
    console.log('로컬 저장소에서 기록 가져오기');
    
    // 객체를 배열로 변환
    const records = Object.values(localRecords);
    
    // ISO 문자열을 Date 객체로 변환
    const recordsWithDates = records.map(record => ({
      ...record,
      recordedDate: new Date(record.recordedDate)
    }));
    
    console.log(`${recordsWithDates.length}개 기록 가져옴`);
    return recordsWithDates;
  } catch (error) {
    console.error('기록 가져오기 오류:', error);
    return [];
  }
};

// 기록 삭제
export const deleteRecord = async (id: string): Promise<void> => {
  console.log('기록 삭제:', id);
  delete localRecords[id];
  saveToLocalStorage();
};

// 동기화 큐에 항목 추가
export const addToSyncQueue = async (item: SyncQueueItem): Promise<string> => {
  const id = item.id || crypto.randomUUID();
  
  localSyncQueue[id] = {
    ...item,
    id,
    timestamp: Date.now()
  };
  
  saveToLocalStorage();
  return id;
};

// 동기화 큐에서 항목 가져오기
export const getSyncQueue = async (): Promise<SyncQueueItem[]> => {
  return Object.values(localSyncQueue);
};

// 동기화 큐에서 항목 제거
export const removeFromSyncQueue = async (item: SyncQueueItem): Promise<void> => {
  if (item.id) {
    delete localSyncQueue[item.id];
    saveToLocalStorage();
  }
};

// 기록의 동기화 상태 업데이트
export const updateRecordSyncStatus = async (id: string, synced: boolean): Promise<void> => {
  if (localRecords[id]) {
    localRecords[id].serverSynced = synced;
    saveToLocalStorage();
  }
};

// 모든 데이터 삭제 (개발용)
export const clearAllData = async (): Promise<void> => {
  localRecords = {};
  localSyncQueue = {};
  saveToLocalStorage();
  console.log('모든 데이터 삭제됨');
}; 