'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

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

// 카드 기록 타입 정의
interface CardRecord {
  id: string;
  studentId: string;
  cardId?: string;
  subject?: string;
  memo: string;
  recordedDate: Date;
  serverSynced?: boolean;
  userId?: string; // 사용자 ID 필드 추가
}

export default function CardsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('공통');
  const [memo, setMemo] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // 현재 로그인된 사용자 정보 가져오기
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.error('로그인된 사용자 세션이 없습니다.');
          return;
        }
        
        const userId = session.user.id;
        console.log('현재 로그인된 사용자 ID:', userId);
        
        // 학생 데이터 가져오기 - API 사용 (사용자 ID로 필터링)
        const studentsResponse = await fetch(`/api/students?userId=${userId}`);
        if (!studentsResponse.ok) {
          throw new Error('학생 데이터를 불러오는데 실패했습니다.');
        }
        const studentsData = await studentsResponse.json();
        console.log('로드된 학생 데이터:', studentsData.length, '명');
        setStudents(studentsData);
        
        // 카드 데이터 가져오기 - API 사용
        const cardsResponse = await fetch('/api/cards');
        if (!cardsResponse.ok) {
          throw new Error('카드 데이터를 불러오는데 실패했습니다.');
        }
        const cardsData = await cardsResponse.json();
        console.log('로드된 카드 데이터:', cardsData.length, '개');
        setCards(cardsData);
        
        // 첫 번째 과목을 기본 선택으로 설정
        if (cardsData.length > 0) {
          const subjects = Array.from(new Set(cardsData.map((card: Card) => card.subject)));
          if (subjects.length > 0) {
            setSelectedSubject(subjects[0] as string);
          }
        }
      } catch (error) {
        console.error('데이터 로드 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // 학생 선택 토글 처리
  const toggleStudentSelection = (student: Student) => {
    setSelectedStudents(prev => {
      // 이미 선택된 학생인지 확인
      const isAlreadySelected = prev.some(s => s.id === student.id);
      
      if (isAlreadySelected) {
        // 이미 선택된 학생이면 제거
        return prev.filter(s => s.id !== student.id);
      } else {
        // 선택되지 않은 학생이면 추가
        return [...prev, student];
      }
    });
  };

  // 카드 클릭 처리
  const handleCardClick = async (card: Card) => {
    if (selectedStudents.length === 0) {
      alert('최소 한 명 이상의 학생을 선택해주세요.');
      return;
    }
    
    console.log('카드 클릭:', card);
    console.log('선택된 학생들:', selectedStudents);
    
    setIsSaving(true);
    
    try {
      // 현재 로그인된 사용자 정보 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('로그인된 사용자 세션이 없습니다.');
        alert('로그인 상태를 확인해주세요.');
        setIsSaving(false);
        return;
      }
      
      const userId = session.user.id;
      console.log('카드 저장 - 사용자 ID:', userId);
      
      const successfulStudents: string[] = [];
      const failedStudents: string[] = [];
      
      // 선택된 모든 학생에 대해 기록 저장
      for (const student of selectedStudents) {
        const newRecord = {
          id: '',
          studentId: student.id,
          cardId: card.id,
          subject: selectedSubject,
          memo: memo || card.description,
          recordedDate: new Date(),
          userId: userId // 사용자 ID 추가
        };
        
        console.log('저장할 기록:', newRecord);
        
        try {
          // API를 통해 기록 저장
          const response = await fetch('/api/records', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newRecord)
          });
          
          const responseData = await response.json();
          console.log('API 응답:', response.status, responseData);
          
          if (response.ok) {
            successfulStudents.push(student.name);
          } else {
            console.error('API 오류:', responseData);
            failedStudents.push(student.name);
          }
        } catch (error) {
          console.error(`${student.name} 학생 기록 저장 오류:`, error);
          failedStudents.push(student.name);
        }
      }
      
      // 결과 메시지 표시
      if (successfulStudents.length > 0) {
        const studentNames = successfulStudents.join(', ');
        alert(`${studentNames} 학생에 대한 "${card.title}" 카드가 저장되었습니다.`);
      }
      
      if (failedStudents.length > 0) {
        const failedNames = failedStudents.join(', ');
        alert(`${failedNames} 학생에 대한 카드 저장에 실패했습니다.`);
      }
    } catch (error) {
      console.error('카드 저장 오류:', error);
      alert('카드 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 메모만 저장 처리
  const handleMemoSave = async () => {
    if (selectedStudents.length === 0 || !memo) {
      alert('최소 한 명 이상의 학생을 선택하고 메모를 입력해주세요.');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // 현재 로그인된 사용자 정보 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('로그인된 사용자 세션이 없습니다.');
        alert('로그인 상태를 확인해주세요.');
        setIsSaving(false);
        return;
      }
      
      const userId = session.user.id;
      console.log('메모 저장 - 사용자 ID:', userId);
      
      const successfulStudents: string[] = [];
      const failedStudents: string[] = [];
      
      // 선택된 모든 학생에 대해 메모 저장
      for (const student of selectedStudents) {
        const newRecord = {
          id: '',
          studentId: student.id,
          cardId: null,
          subject: selectedSubject,
          memo: memo,
          recordedDate: new Date(),
          userId: userId // 사용자 ID 추가
        };
        
        try {
          // API를 통해 기록 저장
          const response = await fetch('/api/records', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newRecord)
          });
          
          if (response.ok) {
            successfulStudents.push(student.name);
          } else {
            failedStudents.push(student.name);
          }
        } catch (error) {
          console.error(`${student.name} 학생 메모 저장 오류:`, error);
          failedStudents.push(student.name);
        }
      }
      
      // 결과 메시지 표시
      if (successfulStudents.length > 0) {
        const studentNames = successfulStudents.join(', ');
        alert(`${studentNames} 학생에 대한 메모가 저장되었습니다.`);
      }
      
      if (failedStudents.length > 0) {
        const failedNames = failedStudents.join(', ');
        alert(`${failedNames} 학생에 대한 메모 저장에 실패했습니다.`);
      }
    } catch (error) {
      console.error('메모 저장 오류:', error);
      alert('메모 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 과목별 카드 필터링
  const filteredCards = cards.filter(card => card.subject === selectedSubject);
  
  // 과목 목록 생성 및 정렬 - "생활" 과목을 제일 앞으로 정렬
  const subjects = Array.from(new Set(cards.map(card => card.subject)));
  const sortedSubjects = [...subjects].sort((a, b) => {
    if (a === '생활') return -1;
    if (b === '생활') return 1;
    return a.localeCompare(b);
  });

  // 선택된 학생 수 표시 텍스트
  const selectedStudentsText = selectedStudents.length > 0 
    ? `${selectedStudents.length}명 선택됨` 
    : '학생을 선택하세요';

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">카드형 기록</h1>
        
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64 bg-white rounded-xl shadow-sm p-6">
            <div className="h-16 w-16 rounded-full border-4 border-gray-200 border-t-blue-500 animate-spin"></div>
            <p className="mt-4 text-gray-600">데이터를 불러오는 중입니다...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-6">
            {/* 학생 선택 */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">학생 선택</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {students.map(student => (
                  <button
                    key={student.id}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedStudents.some(s => s.id === student.id)
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                        : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => toggleStudentSelection(student)}
                  >
                    {student.name}
                  </button>
                ))}
              </div>
              <div className="text-sm text-gray-500 mb-2">
                {selectedStudentsText}
              </div>
            </div>
            
            {/* 과목 선택 */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">과목 선택</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {sortedSubjects.map(subject => (
                  <button
                    key={subject}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedSubject === subject
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                        : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedSubject(subject)}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>
            
            {/* 메모 입력 */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">메모 입력 (선택사항)</h2>
              <div className="mb-4">
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                  placeholder="메모를 입력하세요 (선택사항)"
                  rows={3}
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                ></textarea>
              </div>
              <button
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleMemoSave}
                disabled={isSaving || selectedStudents.length === 0 || !memo}
              >
                {isSaving ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                )}
                메모만 저장하기
              </button>
            </div>
            
            {/* 카드 목록 */}
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-800">카드 선택</h2>
              {filteredCards.length === 0 ? (
                <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-8 text-center">
                  <p className="text-gray-600 mb-2">선택한 과목에 대한 카드가 없습니다.</p>
                  <p className="text-sm text-gray-500">다른 과목을 선택하거나 카드 관리 페이지에서 카드를 추가하세요.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCards.map(card => (
                    <button
                      key={card.id}
                      className="flex items-start p-4 rounded-xl border border-gray-200 hover:border-gray-300 bg-white shadow-sm hover:shadow transition-all text-left"
                      onClick={() => handleCardClick(card)}
                      disabled={isSaving || selectedStudents.length === 0}
                    >
                      <div className="flex-shrink-0 mr-4">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                          style={{ backgroundColor: card.color }}
                        >
                          {card.icon}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{card.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{card.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* 기록 보기 링크 */}
            <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
              <Link
                href="/dashboard/records"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  padding: '1.25rem 2rem', 
                  backgroundColor: '#3b82f6', 
                  color: 'white', 
                  borderRadius: '0.5rem', 
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', 
                  transition: 'all 0.2s', 
                  fontWeight: '500', 
                  fontSize: '1.125rem',
                  textDecoration: 'none'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '1.5rem', width: '1.5rem', marginRight: '0.5rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                기록 목록 보기
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 