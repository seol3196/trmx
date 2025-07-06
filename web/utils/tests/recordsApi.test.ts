/**
 * @jest-environment jsdom
 */

import { saveRecord, getRecords, deleteRecord, syncWithServer } from '../recordsApi';
import * as indexedDB from '../indexedDB';
import { createBrowserClient } from '../../lib/supabase';

// Mocking dependencies
jest.mock('../indexedDB');
jest.mock('../../lib/supabase');

describe('Records API', () => {
  // Setup mocks before each test
  beforeEach(() => {
    // Mock IndexedDB functions
    (indexedDB.saveRecord as jest.Mock).mockResolvedValue('mock-id');
    (indexedDB.getRecords as jest.Mock).mockResolvedValue([]);
    (indexedDB.deleteRecord as jest.Mock).mockResolvedValue(undefined);
    (indexedDB.addToSyncQueue as jest.Mock).mockResolvedValue(undefined);
    (indexedDB.getSyncQueue as jest.Mock).mockResolvedValue([]);
    (indexedDB.removeFromSyncQueue as jest.Mock).mockResolvedValue(undefined);
    (indexedDB.updateSyncQueueItem as jest.Mock).mockResolvedValue(undefined);
    (indexedDB.isOnline as jest.Mock).mockReturnValue(true);

    // Mock Supabase client
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'server-id' },
        error: null
      }),
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: { id: 'user-id' }
          }
        })
      }
    };
    (createBrowserClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveRecord', () => {
    test('should save record to IndexedDB and server when online', async () => {
      // Arrange
      const record = {
        id: '',
        studentId: 'student-1',
        subject: '국어',
        memo: '수업 참여 우수',
        recordedDate: new Date()
      };

      // Act
      const result = await saveRecord(record);

      // Assert
      expect(indexedDB.saveRecord).toHaveBeenCalled();
      expect(createBrowserClient().from).toHaveBeenCalledWith('notes');
      expect(result).toBe('server-id');
    });

    test('should save record to IndexedDB and queue when offline', async () => {
      // Arrange
      (indexedDB.isOnline as jest.Mock).mockReturnValue(false);
      const record = {
        id: '',
        studentId: 'student-1',
        subject: '국어',
        memo: '수업 참여 우수',
        recordedDate: new Date()
      };

      // Act
      const result = await saveRecord(record);

      // Assert
      expect(indexedDB.saveRecord).toHaveBeenCalled();
      expect(indexedDB.addToSyncQueue).toHaveBeenCalledWith('create', expect.objectContaining({
        studentId: 'student-1'
      }));
      expect(createBrowserClient().from).not.toHaveBeenCalled();
      expect(result).toMatch(/^local-/);
    });
  });

  describe('getRecords', () => {
    test('should get records from server and merge with local when online', async () => {
      // Arrange
      const mockServerRecords = [
        { id: 'server-1', studentId: 'student-1', recordedDate: '2023-01-01', serverSynced: true }
      ];
      const mockLocalRecords = [
        { id: 'local-1', studentId: 'student-2', recordedDate: '2023-01-02', serverSynced: false }
      ];
      
      (indexedDB.getRecords as jest.Mock).mockResolvedValue(mockLocalRecords);
      const mockSupabase = createBrowserClient();
      mockSupabase.from().select().mockResolvedValue({
        data: mockServerRecords.map(r => ({
          id: r.id,
          student_id: r.studentId,
          recorded_date: r.recordedDate
        })),
        error: null
      });

      // Act
      const result = await getRecords();

      // Assert
      expect(indexedDB.getRecords).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith('notes');
      expect(result).toHaveLength(2); // Both server and local records
    });

    test('should get records from IndexedDB only when offline', async () => {
      // Arrange
      (indexedDB.isOnline as jest.Mock).mockReturnValue(false);
      const mockLocalRecords = [
        { id: 'local-1', studentId: 'student-1', recordedDate: '2023-01-01', serverSynced: false }
      ];
      (indexedDB.getRecords as jest.Mock).mockResolvedValue(mockLocalRecords);

      // Act
      const result = await getRecords();

      // Assert
      expect(indexedDB.getRecords).toHaveBeenCalled();
      expect(createBrowserClient().from).not.toHaveBeenCalled();
      expect(result).toEqual(mockLocalRecords);
    });
  });

  describe('deleteRecord', () => {
    test('should delete record from IndexedDB and server when online', async () => {
      // Act
      await deleteRecord('record-1');

      // Assert
      expect(indexedDB.deleteRecord).toHaveBeenCalledWith('record-1');
      expect(createBrowserClient().from).toHaveBeenCalledWith('notes');
      expect(createBrowserClient().from().delete).toHaveBeenCalled();
    });

    test('should delete record from IndexedDB and queue when offline', async () => {
      // Arrange
      (indexedDB.isOnline as jest.Mock).mockReturnValue(false);

      // Act
      await deleteRecord('record-1');

      // Assert
      expect(indexedDB.deleteRecord).toHaveBeenCalledWith('record-1');
      expect(indexedDB.addToSyncQueue).toHaveBeenCalledWith('delete', { id: 'record-1' });
      expect(createBrowserClient().from).not.toHaveBeenCalled();
    });
  });

  describe('syncWithServer', () => {
    test('should skip sync when offline', async () => {
      // Arrange
      (indexedDB.isOnline as jest.Mock).mockReturnValue(false);

      // Act
      await syncWithServer();

      // Assert
      expect(indexedDB.getSyncQueue).not.toHaveBeenCalled();
      expect(createBrowserClient().from).not.toHaveBeenCalled();
    });

    test('should process sync queue when online', async () => {
      // Arrange
      const syncQueue = [
        { id: 1, operation: 'create', data: { id: 'local-1', studentId: 'student-1' } },
        { id: 2, operation: 'delete', data: { id: 'server-1' } }
      ];
      (indexedDB.getSyncQueue as jest.Mock).mockResolvedValue(syncQueue);

      // Act
      await syncWithServer();

      // Assert
      expect(indexedDB.getSyncQueue).toHaveBeenCalled();
      expect(createBrowserClient().from).toHaveBeenCalledTimes(2); // Once for each operation
      expect(indexedDB.removeFromSyncQueue).toHaveBeenCalledTimes(2);
    });

    test('should handle sync errors and update retry count', async () => {
      // Arrange
      const syncQueue = [
        { id: 1, operation: 'create', data: { id: 'local-1', studentId: 'student-1' }, retryCount: 0 }
      ];
      (indexedDB.getSyncQueue as jest.Mock).mockResolvedValue(syncQueue);
      
      // Mock server error
      const mockSupabase = createBrowserClient();
      mockSupabase.from().insert().select().single.mockRejectedValue(new Error('Server error'));

      // Act
      await syncWithServer();

      // Assert
      expect(indexedDB.getSyncQueue).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith('notes');
      expect(indexedDB.removeFromSyncQueue).not.toHaveBeenCalled();
      expect(indexedDB.updateSyncQueueItem).toHaveBeenCalledWith(1, expect.objectContaining({
        retryCount: 1
      }));
    });
  });
}); 