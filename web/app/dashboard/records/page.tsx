'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';

// 타입 정의
interface Student {
  id: string;
  name: string;
  student_number: number;
}

interface Card {
  id: string;
  title: string;
  description: string;
  subject: string;
  color: string;
  icon: string;
}

interface CardRecord {
  id: string;
  studentId: string;
  cardId?: string;
  subject?: string;
  memo: string;
  recordedDate: Date;
  serverSynced?: boolean;
  card?: Card;
  student?: Student;
}

export default function RecordsPage() {
  const [records, setRecords] = useState<CardRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // 필터 상태
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // 학생 데이터 가져오기 - API 사용
        const studentsResponse = await fetch('/api/students');
        if (!studentsResponse.ok) {
          throw new Error('학생 데이터를 불러오는데 실패했습니다.');
        }
        const studentsData = await studentsResponse.json();
        
        // 카드 데이터 가져오기 - API 사용
        const cardsResponse = await fetch('/api/cards');
        if (!cardsResponse.ok) {
          throw new Error('카드 데이터를 불러오는데 실패했습니다.');
        }
        const cardsData = await cardsResponse.json();
        
        // 기록 데이터 가져오기 - API 사용
        const recordsResponse = await fetch('/api/records');
        if (!recordsResponse.ok) {
          throw new Error('기록 데이터를 불러오는데 실패했습니다.');
        }
        const recordsData = await recordsResponse.json();
        
        // 기록 데이터에 학생 및 카드 정보 추가
        const enrichedRecords = recordsData.map((record: any) => {
          const student = studentsData.find((s: any) => s.id === record.studentId);
          const card = record.cardId 
            ? cardsData.find((c: any) => c.id === record.cardId) 
            : undefined;
          
          return {
            ...record,
            subject: record.subject || '',
            student,
            card
          } as CardRecord;
        });
        
        setStudents(studentsData as Student[]);
        setCards(cardsData as Card[]);
        setRecords(enrichedRecords);
      } catch (error) {
        console.error('데이터 로드 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // 기록 삭제 처리
  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm('정말로 이 기록을 삭제하시겠습니까?')) return;
    
    try {
      // API를 통한 기록 삭제
      const response = await fetch(`/api/records?id=${recordId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '기록 삭제 중 오류가 발생했습니다.');
      }
      
      // 기록 데이터 다시 로드
      const recordsResponse = await fetch('/api/records');
      if (!recordsResponse.ok) {
        throw new Error('기록 데이터를 불러오는데 실패했습니다.');
      }
      const recordsData = await recordsResponse.json();
      
      // 기록 데이터에 학생 및 카드 정보 추가
      const enrichedRecords = recordsData.map((record: any) => {
        const student = students.find(s => s.id === record.studentId);
        const card = record.cardId 
          ? cards.find(c => c.id === record.cardId) 
          : undefined;
        
        return {
          ...record,
          subject: record.subject || '',
          student,
          card
        } as CardRecord;
      });
      
      setRecords(enrichedRecords);
    } catch (error) {
      console.error('기록 삭제 오류:', error);
      alert('기록 삭제 중 오류가 발생했습니다.');
    }
  };

  // 필터링된 기록 목록
  const filteredRecords = records.filter(record => {
    // 학생 필터
    if (selectedStudent !== 'all' && record.studentId !== selectedStudent) {
      return false;
    }
    
    // 과목 필터
    if (selectedSubject !== 'all' && record.subject !== selectedSubject) {
      return false;
    }
    
    // 날짜 필터
    const recordDate = format(new Date(record.recordedDate), 'yyyy-MM-dd');
    if (selectedDate && recordDate !== selectedDate) {
      return false;
    }
    
    // 검색어 필터
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      const studentName = record.student?.name.toLowerCase() || '';
      const cardTitle = record.card?.title.toLowerCase() || '';
      const memo = record.memo.toLowerCase();
      
      return (
        studentName.includes(lowerQuery) ||
        cardTitle.includes(lowerQuery) ||
        memo.includes(lowerQuery)
      );
    }
    
    return true;
  });
  
  // 과목 목록 생성
  const subjects = Array.from(new Set(records.map(record => record.subject)));

  return (
    <div className="container mx-auto p-4 max-w-full">
      <h1 className="text-2xl font-bold mb-6">기록 목록</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* 필터 영역 */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h2 className="text-lg font-semibold mb-4">필터 및 검색</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 학생 필터 */}
              <div>
                <label className="block text-base font-medium mb-2">학생</label>
                <select
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '0.5rem', 
                    outline: 'none',
                    height: '3.5rem',
                    fontSize: '1rem'
                  }}
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                >
                  <option value="all">전체 학생</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.student_number}. {student.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* 과목 필터 */}
              <div>
                <label className="block text-base font-medium mb-2">과목</label>
                <select
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '0.5rem', 
                    outline: 'none',
                    height: '3.5rem',
                    fontSize: '1rem'
                  }}
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                >
                  <option value="all">전체 과목</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* 날짜 필터 */}
              <div>
                <label className="block text-base font-medium mb-2">날짜</label>
                <input
                  type="date"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '0.5rem', 
                    outline: 'none',
                    height: '3.5rem',
                    fontSize: '1rem'
                  }}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              
              {/* 검색어 */}
              <div>
                <label className="block text-base font-medium mb-2">검색</label>
                <input
                  type="text"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '0.5rem', 
                    outline: 'none',
                    height: '3.5rem',
                    fontSize: '1rem'
                  }}
                  placeholder="검색어 입력..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {/* 기록 목록 */}
          <div className="bg-white rounded-lg shadow w-full">
            <div className="w-full overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-base font-medium text-gray-700 uppercase tracking-wider">
                      날짜
                    </th>
                    <th className="px-6 py-3 text-left text-base font-medium text-gray-700 uppercase tracking-wider">
                      학생
                    </th>
                    <th className="px-6 py-3 text-left text-base font-medium text-gray-700 uppercase tracking-wider">
                      과목
                    </th>
                    <th className="px-6 py-3 text-left text-base font-medium text-gray-700 uppercase tracking-wider">
                      카드
                    </th>
                    <th className="px-6 py-3 text-left text-base font-medium text-gray-700 uppercase tracking-wider">
                      메모
                    </th>
                    <th className="px-6 py-3 text-left text-base font-medium text-gray-700 uppercase tracking-wider">
                      동기화
                    </th>
                    <th className="px-6 py-3 text-left text-base font-medium text-gray-700 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map(record => (
                      <tr key={record.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-base">
                          {format(new Date(record.recordedDate), 'yyyy-MM-dd')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base">
                          {record.student 
                            ? `${record.student.student_number}. ${record.student.name}` 
                            : '알 수 없음'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base">
                          {record.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base">
                          {record.card ? (
                            <div className="flex items-center">
                              <span className="mr-1 text-xl">{record.card.icon}</span>
                              <span>{record.card.title}</span>
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-base">
                          {record.memo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base">
                          {record.serverSynced ? (
                            <span className="text-green-500 font-medium">완료</span>
                          ) : (
                            <span className="text-amber-500 font-medium">대기 중</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base">
                          <button
                            className="text-red-600 hover:text-red-900 font-medium"
                            onClick={() => handleDeleteRecord(record.id)}
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-base text-gray-500">
                        기록이 없거나 필터 조건에 맞는 기록이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* 카드 기록 페이지로 이동 */}
          <div className="mt-8 text-center">
            <Link
              href="/dashboard/cards"
              className="inline-block px-8 py-4 bg-blue-500 text-white text-lg font-medium rounded-lg hover:bg-blue-600 shadow-md transition-all duration-200 hover:shadow-lg"
            >
              카드 기록하기
            </Link>
          </div>
        </>
      )}
    </div>
  );
} 