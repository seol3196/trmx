import { syncWithServer, SyncStatus } from './recordsApi';
import { initializeDB } from './indexedDB';

/**
 * 간소화된 동기화 관리자
 */
class SyncManager {
  /**
   * 초기화
   */
  initialize() {
    console.log('SyncManager initialized');
    
    // localStorage 기반 IndexedDB 대체 초기화
    if (typeof window !== 'undefined') {
      initializeDB()
        .then(() => console.log('데이터 저장소 초기화 성공'))
        .catch(err => console.error('데이터 저장소 초기화 오류:', err));
    }
  }
  
  /**
   * 정리
   */
  cleanup() {
    console.log('SyncManager cleanup');
  }
  
  /**
   * 수동 동기화
   */
  async syncNow() {
    try {
      console.log('수동 동기화 시작');
      await syncWithServer();
      console.log('수동 동기화 완료');
      return true;
    } catch (error) {
      console.error('동기화 오류:', error);
      return false;
    }
  }
  
  /**
   * 동기화 상태 조회
   */
  getSyncStatus(): SyncStatus {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    console.log('현재 네트워크 상태:', isOnline ? '온라인' : '오프라인');
    
    return {
      online: isOnline,
      pendingCount: 0,
      lastSyncedAt: null
    };
  }
}

const syncManager = new SyncManager();
export default syncManager; 