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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">카드형 기록</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* 학생 선택 */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">학생 선택</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {students.map(student => (
                <button
                  key={student.id}
                  className={`p-2 rounded text-sm ${
                    selectedStudent?.id === student.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  onClick={() => setSelectedStudent(student)}
                >
                  {student.student_number}. {student.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* 과목 선택 */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">과목 선택</h2>
            <div className="flex flex-wrap gap-2">
              {subjects.map(subject => (
                <button
                  key={subject}
                  className={`px-4 py-2 rounded ${
                    selectedSubject === subject
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  onClick={() => setSelectedSubject(subject)}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>
          
          {/* 메모 입력 */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">메모 (선택사항)</h2>
            <div className="flex gap-2">
              <textarea
                className="flex-1 p-2 border rounded"
                placeholder="추가 메모를 입력하세요..."
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={2}
              ></textarea>
              <button
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 whitespace-nowrap"
                onClick={handleMemoSave}
                disabled={!selectedStudent || !memo}
              >
                메모만 저장
              </button>
            </div>
          </div>
          
          {/* 카드 목록 */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">카드 선택</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredCards.map(card => (
                <div
                  key={card.id}
                  className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-shadow"
                  style={{ borderLeft: `4px solid ${card.color}` }}
                  onClick={() => handleCardClick(card)}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{card.icon}</span>
                      <h3 className="font-semibold">{card.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{card.description}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                        {card.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 기록 보기 링크 */}
          <div className="mt-8 text-center">
            <Link
              href="/dashboard/records"
              className="inline-block px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              기록 목록 보기
            </Link>
          </div>
        </>
      )}
    </div>
  );
} 