'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 학생 타입 정의
interface Student {
  id: string;
  name: string;
  student_number?: number;
  class_id?: string;
  observationCount: number;
  lastObservation?: Date;
}

// 노트 타입 정의
interface Note {
  id: string;
  student_id: string;
  content: string;
  created_at: string;
}

// 카드 기록 타입 정의
interface CardRecord {
  id: string;
  studentId: string;
  recordedDate: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/students');
        
        if (!response.ok) {
          throw new Error('학생 데이터를 불러오는데 실패했습니다.');
        }
        
        const studentsData = await response.json();
        
        // 각 학생의 관찰 기록 수 가져오기 (노트)
        const notesResponse = await fetch('/api/notes');
        const notesData = notesResponse.ok ? await notesResponse.json() : [];
        
        // 각 학생의 관찰 기록 수 가져오기 (카드 기록)
        const recordsResponse = await fetch('/api/records');
        const recordsData = recordsResponse.ok ? await recordsResponse.json() : [];
        
        // 학생별 관찰 기록 수와 최신 관찰 날짜 계산
        const studentsWithObservations = studentsData.map((student: any) => {
          // 노트 데이터 필터링
          const studentNotes = notesData.filter((note: any) => note.student_id === student.id);
          
          // 카드 기록 데이터 필터링
          const studentRecords = recordsData.filter((record: any) => record.studentId === student.id);
          
          // 모든 관찰 기록 (노트 + 카드 기록)
          const allObservations = [
            ...studentNotes.map((note: any) => ({
              date: new Date(note.created_at),
              type: 'note'
            })),
            ...studentRecords.map((record: any) => ({
              date: new Date(record.recordedDate),
              type: 'record'
            }))
          ];
          
          // 총 관찰 횟수
          const observationCount = allObservations.length;
          
          // 가장 최근 관찰 기록 날짜 찾기
          let lastObservation = undefined;
          if (allObservations.length > 0) {
            // 날짜 기준으로 내림차순 정렬
            allObservations.sort((a, b) => b.date.getTime() - a.date.getTime());
            lastObservation = allObservations[0].date;
          }
          
          return {
            ...student,
            observationCount,
            lastObservation
          };
        });
        
        setStudents(studentsWithObservations);
      } catch (error) {
        console.error('학생 데이터 로드 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStudents();
  }, []);

  // 검색 필터링
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.student_number?.toString() || '').includes(searchTerm)
  );

  // 날짜 포맷팅 함수
  const formatDate = (date?: Date) => {
    if (!date) return '관찰 기록 없음';
    
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">학생 목록</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            대시보드로 돌아가기
          </button>
        </div>
        
        {/* 검색 필드 */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="학생 이름 또는 번호로 검색"
            className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">번호</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관찰 횟수</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">최근 관찰일</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <tr 
                        key={student.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/students/${student.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.student_number || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                            {student.observationCount}회
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(student.lastObservation)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/students/${student.id}`);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            상세보기
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        검색 결과가 없습니다
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 