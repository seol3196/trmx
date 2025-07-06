import { syncWithServer, SyncStatus } from './recordsApi';

/**
 * 간소화된 동기화 관리자
 */
class SyncManager {
  /**
   * 초기화
   */
  initialize() {
    console.log('SyncManager initialized');
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
      await syncWithServer();
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
    return {
      online: typeof navigator !== 'undefined' ? navigator.onLine : true,
      pendingCount: 0,
      lastSyncedAt: null
    };
  }
}

const syncManager = new SyncManager();
export default syncManager; 