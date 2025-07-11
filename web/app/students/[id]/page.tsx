'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

// 학생 타입 정의
interface Student {
  id: string;
  name: string;
  student_number?: number;
  class_id?: string;
}

// 노트 타입 정의
interface Note {
  id: string;
  student_id: string;
  content: string;
  created_at: string;
  subject?: string;
  type: 'note';
}

// 카드 기록 타입 정의
interface CardRecord {
  id: string;
  studentId: string;
  cardId?: string;
  subject?: string;
  memo: string;
  recordedDate: string;
  type: 'card';
  card?: {
    title: string;
    icon: string;
  };
}

// 통합 관찰 기록 타입
type ObservationRecord = Note | CardRecord;

export default function StudentDetailPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [observations, setObservations] = useState<ObservationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const studentId = params?.id as string;

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setIsLoading(true);
        
        // 학생 정보 가져오기
        const studentResponse = await fetch(`/api/students?id=${studentId}`);
        if (!studentResponse.ok) {
          throw new Error('학생 정보를 불러오는데 실패했습니다.');
        }
        
        const studentsData = await studentResponse.json();
        const studentData = Array.isArray(studentsData) ? studentsData[0] : studentsData;
        
        if (!studentData) {
          throw new Error('학생 정보를 찾을 수 없습니다.');
        }
        
        setStudent(studentData);
        
        // 학생의 노트 기록 가져오기
        const notesResponse = await fetch(`/api/notes?studentId=${studentId}`);
        let notesData: Note[] = [];
        if (notesResponse.ok) {
          const rawNotesData = await notesResponse.json();
          notesData = rawNotesData.map((note: any) => ({
            ...note,
            type: 'note'
          }));
        }
        
        // 학생의 카드 기록 가져오기
        const recordsResponse = await fetch(`/api/records`);
        let recordsData: CardRecord[] = [];
        if (recordsResponse.ok) {
          const rawRecordsData = await recordsResponse.json();
          recordsData = rawRecordsData
            .filter((record: any) => record.studentId === studentId)
            .map((record: any) => ({
              ...record,
              type: 'card'
            }));
          
          // 카드 정보 가져오기
          if (recordsData.length > 0) {
            const cardsResponse = await fetch('/api/cards');
            if (cardsResponse.ok) {
              const cardsData = await cardsResponse.json();
              // 카드 정보 연결
              recordsData = recordsData.map(record => {
                if (record.cardId) {
                  const cardInfo = cardsData.find((card: any) => card.id === record.cardId);
                  return {
                    ...record,
                    card: cardInfo
                  };
                }
                return record;
              });
            }
          }
        }
        
        // 모든 관찰 기록 통합 및 날짜순 정렬
        const allObservations = [...notesData, ...recordsData].sort((a, b) => {
          const dateA = a.type === 'note' ? new Date(a.created_at) : new Date(a.recordedDate);
          const dateB = b.type === 'note' ? new Date(b.created_at) : new Date(b.recordedDate);
          return dateB.getTime() - dateA.getTime(); // 최신순 정렬
        });
        
        setObservations(allObservations);
      } catch (error) {
        console.error('학생 데이터 로드 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (studentId) {
      fetchStudentData();
    }
  }, [studentId]);

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">학생을 찾을 수 없습니다</h1>
          <button
            onClick={() => router.push('/students')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            학생 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{student.name} 학생 정보</h1>
          <button
            onClick={() => router.push('/students')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            학생 목록으로 돌아가기
          </button>
        </div>
        
        {/* 학생 정보 카드 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">학생 번호</p>
              <p className="text-lg font-medium">{student.student_number || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">이름</p>
              <p className="text-lg font-medium">{student.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">학급</p>
              <p className="text-lg font-medium">{student.class_id || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">관찰 기록 수</p>
              <p className="text-lg font-medium">{observations.length}회</p>
            </div>
          </div>
        </div>
        
        {/* 관찰 기록 목록 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">관찰 기록</h2>
          
          {observations.length > 0 ? (
            <div className="space-y-4">
              {observations.map((observation) => (
                <div key={observation.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {observation.type === 'card' && observation.card?.icon && (
                        <span className="text-xl" role="img" aria-label="icon">
                          {observation.card.icon}
                        </span>
                      )}
                      {observation.subject && (
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded">
                          {observation.subject}
                        </span>
                      )}
                      <span className="text-sm text-gray-500">
                        {observation.type === 'note' 
                          ? formatDate(observation.created_at) 
                          : formatDate(observation.recordedDate)}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                        {observation.type === 'note' ? '노트' : '카드'}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700">
                    {observation.type === 'note' 
                      ? observation.content 
                      : observation.memo}
                  </p>
                  {observation.type === 'card' && observation.card?.title && (
                    <p className="text-sm text-gray-500 mt-2">
                      카드: {observation.card.title}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>관찰 기록이 없습니다</p>
              <button
                onClick={() => router.push(`/dashboard/records?studentId=${studentId}&studentName=${student.name}`)}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                관찰 기록 추가하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 