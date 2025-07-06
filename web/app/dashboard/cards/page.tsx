'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '../../../lib/supabase';
import { getRecords, saveRecord, deleteRecord } from '../../../utils/recordsApi';

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
  category: string;
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
}

export default function CardsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('공통');
  const [memo, setMemo] = useState<string>('');
  const [records, setRecords] = useState<CardRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 학생 및 카드 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const supabase = createBrowserClient();
        
        // 학생 데이터 가져오기
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('id, name, student_number')
          .order('student_number');
        
        if (studentsError) {
          console.error('학생 데이터 로드 오류:', studentsError);
          return;
        }
        
        // 카드 데이터 가져오기
        const { data: cardsData, error: cardsError } = await supabase
          .from('cards')
          .select('id, title, description, subject, category, color, icon')
          .order('subject, category');
        
        if (cardsError) {
          console.error('카드 데이터 로드 오류:', cardsError);
          return;
        }
        
        // 기록 데이터 가져오기
        const recordsData = await getRecords();
        
        setStudents(studentsData as Student[]);
        setCards(cardsData as Card[]);
        setRecords(recordsData);
        
        // 첫 번째 학생 선택
        if (studentsData.length > 0) {
          setSelectedStudent(studentsData[0] as Student);
        }
      } catch (error) {
        console.error('데이터 로드 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // 카드 클릭 처리
  const handleCardClick = async (card: Card) => {
    if (!selectedStudent) return;
    
    try {
      const newRecord: CardRecord = {
        id: '',
        studentId: selectedStudent.id,
        cardId: card.id,
        subject: card.subject,
        memo: memo || card.description,
        recordedDate: new Date()
      };
      
      await saveRecord(newRecord);
      
      // 기록 목록 새로고침
      const updatedRecords = await getRecords();
      setRecords(updatedRecords);
      
      // 메모 초기화
      setMemo('');
      
      // 성공 메시지
      alert(`${selectedStudent.name} 학생에 대한 "${card.title}" 카드가 저장되었습니다.`);
    } catch (error) {
      console.error('카드 저장 오류:', error);
      alert('카드 저장 중 오류가 발생했습니다.');
    }
  };

  // 메모만 저장 처리
  const handleMemoSave = async () => {
    if (!selectedStudent || !memo) return;
    
    try {
      const newRecord: CardRecord = {
        id: '',
        studentId: selectedStudent.id,
        cardId: '',
        subject: selectedSubject,
        memo: memo,
        recordedDate: new Date()
      };
      
      await saveRecord(newRecord);
      
      // 기록 목록 새로고침
      const updatedRecords = await getRecords();
      setRecords(updatedRecords);
      
      // 메모 초기화
      setMemo('');
      
      // 성공 메시지
      alert(`${selectedStudent.name} 학생에 대한 메모가 저장되었습니다.`);
    } catch (error) {
      console.error('메모 저장 오류:', error);
      alert('메모 저장 중 오류가 발생했습니다.');
    }
  };

  // 과목별 카드 필터링
  const filteredCards = cards.filter(card => card.subject === selectedSubject);
  
  // 과목 목록 생성
  const subjects = Array.from(new Set(cards.map(card => card.subject)));

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">카드형 기록</h1>
        
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64 bg-white rounded-xl shadow-sm p-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-500"></div>
            <p className="mt-4 text-gray-600">데이터를 불러오는 중입니다...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-6">
            {/* 학생 선택 */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-3">학생 선택</h2>
              <table className="w-full border-collapse">
                <tbody>
                  {Array.from({ length: Math.ceil(students.length / 6) }).map((_, rowIndex) => (
                    <tr key={rowIndex}>
                      {students.slice(rowIndex * 6, rowIndex * 6 + 6).map(student => (
                        <td key={student.id} className="p-1" style={{ width: '16.666%' }}>
                          <button
                            className={`flex flex-col items-center justify-center py-3 px-1 rounded-lg shadow-sm transition-all duration-200 h-24 w-full ${
                              selectedStudent?.id === student.id
                                ? 'bg-blue-500 text-white shadow-md transform scale-105'
                                : 'bg-white border border-gray-200 hover:bg-gray-50 hover:border-blue-300'
                            }`}
                            onClick={() => setSelectedStudent(student)}
                          >
                            <span className={`text-lg font-medium ${selectedStudent?.id === student.id ? 'text-white' : 'text-gray-700'}`}>
                              {student.name}
                            </span>
                            <span className={`text-sm mt-1 ${selectedStudent?.id === student.id ? 'text-blue-100' : 'text-gray-500'}`}>
                              {student.student_number}번
                            </span>
                          </button>
                        </td>
                      ))}
                      {/* Fill empty cells to maintain 6 columns */}
                      {Array.from({ length: 6 - (students.slice(rowIndex * 6, rowIndex * 6 + 6).length) }).map((_, i) => (
                        <td key={`empty-${i}`} className="p-1" style={{ width: '16.666%' }}></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* 과목 선택 */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-3">과목 선택</h2>
              <div className="flex flex-wrap gap-3">
                {subjects.map(subject => (
                  <button
                    key={subject}
                    className={`px-6 py-4 rounded-lg font-medium transition-all duration-200 text-lg ${
                      selectedSubject === subject
                        ? 'bg-blue-500 text-white shadow-md transform scale-105'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-blue-300'
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
              <h2 className="text-lg font-semibold mb-3">메모 (선택사항)</h2>
              <div className="flex flex-col md:flex-row gap-4">
                <textarea
                  className="flex-1 p-4 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all text-base"
                  placeholder="추가 메모를 입력하세요..."
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  rows={4}
                ></textarea>
                <button
                  className="px-6 py-4 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 hover:shadow-md transition-all duration-200 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed text-lg md:self-end"
                  onClick={handleMemoSave}
                  disabled={!selectedStudent || !memo}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    메모만 저장
                  </span>
                </button>
              </div>
            </div>
            
            {/* 카드 목록 */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-3">카드 선택</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredCards.map(card => (
                  <div
                    key={card.id}
                    className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 hover:transform hover:scale-105 bg-white"
                    style={{ borderLeft: `6px solid ${card.color}` }}
                    onClick={() => handleCardClick(card)}
                  >
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-4xl">{card.icon}</span>
                        <h3 className="font-semibold text-lg text-gray-800">{card.title}</h3>
                      </div>
                      <p className="text-base text-gray-600 mb-4">{card.description}</p>
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-sm px-4 py-1.5 bg-gray-100 rounded-full text-gray-700 font-medium">
                          {card.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 기록 보기 링크 */}
            <div className="mt-10 text-center">
              <Link
                href="/dashboard/records"
                className="inline-flex items-center px-8 py-5 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 hover:shadow-md transition-all duration-200 font-medium text-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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