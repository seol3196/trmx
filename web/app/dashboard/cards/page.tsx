'use client';

import { useState, useEffect } from 'react';
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
        // 학생 데이터 가져오기 - API 사용
        const studentsResponse = await fetch('/api/students');
        if (!studentsResponse.ok) {
          throw new Error('학생 데이터를 불러오는데 실패했습니다.');
        }
        const studentsData = await studentsResponse.json();
        setStudents(studentsData);
        
        // 카드 데이터 가져오기 - API 사용
        const cardsResponse = await fetch('/api/cards');
        if (!cardsResponse.ok) {
          throw new Error('카드 데이터를 불러오는데 실패했습니다.');
        }
        const cardsData = await cardsResponse.json();
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
    
    setIsSaving(true);
    
    try {
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
          recordedDate: new Date()
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
      const successfulStudents: string[] = [];
      const failedStudents: string[] = [];
      
      // 선택된 모든 학생에 대해 메모 저장
      for (const student of selectedStudents) {
        const newRecord = {
          id: '',
          studentId: student.id,
          cardId: '',
          subject: selectedSubject,
          memo: memo,
          recordedDate: new Date()
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
  
  // 과목 목록 생성
  const subjects = Array.from(new Set(cards.map(card => card.subject)));

  // 선택된 학생 수 표시 텍스트
  const selectedStudentsText = selectedStudents.length > 0 
    ? `${selectedStudents.length}명 선택됨` 
    : '학생을 선택하세요';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '1.5rem 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>카드형 기록</h1>
        
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '16rem', backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)', padding: '1.5rem' }}>
            <div style={{ height: '4rem', width: '4rem', borderRadius: '50%', border: '4px solid #e5e7eb', borderTopColor: '#3b82f6', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ marginTop: '1rem', color: '#4b5563' }}>데이터를 불러오는 중입니다...</p>
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)', padding: '1.5rem' }}>
            {/* 학생 선택 */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: '600' }}>학생 선택</h2>
                <span style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: selectedStudents.length > 0 ? '#2563eb' : '#6b7280',
                  backgroundColor: selectedStudents.length > 0 ? '#dbeafe' : '#f3f4f6',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px'
                }}>
                  {selectedStudentsText}
                </span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {Array.from({ length: Math.ceil(students.length / 6) }).map((_, rowIndex) => (
                    <tr key={rowIndex}>
                      {students.slice(rowIndex * 6, rowIndex * 6 + 6).map(student => {
                        const isSelected = selectedStudents.some(s => s.id === student.id);
                        return (
                          <td key={student.id} style={{ padding: '0.25rem', width: '16.666%' }}>
                            <button
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0.75rem 0.25rem',
                                borderRadius: '0.5rem',
                                boxShadow: isSelected ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                transition: 'all 0.2s',
                                height: '6rem',
                                width: '100%',
                                backgroundColor: isSelected ? '#1e3a8a' : 'white',
                                border: isSelected ? '2px solid #eab308' : '1px solid #e5e7eb',
                                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                                cursor: 'pointer'
                              }}
                              onClick={() => toggleStudentSelection(student)}
                            >
                              <span style={{ 
                                fontSize: '1.125rem', 
                                fontWeight: 'bold', 
                                color: isSelected ? '#facc15' : '#374151'
                              }}>
                                {student.name}
                              </span>
                              <span style={{ 
                                fontSize: '0.875rem', 
                                marginTop: '0.25rem', 
                                fontWeight: '500', 
                                color: isSelected ? '#fef08a' : '#6b7280'
                              }}>
                                {student.student_number}번
                              </span>
                            </button>
                          </td>
                        );
                      })}
                      {/* Fill empty cells to maintain 6 columns */}
                      {Array.from({ length: 6 - (students.slice(rowIndex * 6, rowIndex * 6 + 6).length) }).map((_, i) => (
                        <td key={`empty-${i}`} style={{ padding: '0.25rem', width: '16.666%' }}></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* 과목 선택 */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' }}>과목 선택</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {subjects.map(subject => (
                  <button
                    key={subject}
                    style={{
                      width: 'auto',
                      minWidth: '6rem',
                      height: '3.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '0.5rem',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                      fontSize: '1rem',
                      padding: '0 1rem',
                      margin: '0 0.5rem 0.5rem 0',
                      backgroundColor: selectedSubject === subject ? '#3b82f6' : 'white',
                      color: selectedSubject === subject ? 'white' : '#374151',
                      border: selectedSubject === subject ? 'none' : '1px solid #e5e7eb',
                      boxShadow: selectedSubject === subject ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
                      transform: selectedSubject === subject ? 'scale(1.05)' : 'scale(1)',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedSubject(subject)}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>
            
            {/* 메모 입력 */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' }}>활동내용, 추가메모(선택사항)</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <textarea
                  style={{ 
                    flex: '1', 
                    padding: '0.75rem', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '0.5rem', 
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', 
                    outline: 'none',
                    transition: 'all 0.2s',
                    fontSize: '0.875rem',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                  placeholder="활동 내용 또는 추가 메모를 입력하세요..."
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  rows={3}
                ></textarea>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    style={{ 
                      padding: '0.125rem 0.5rem', 
                      backgroundColor: '#14532d', 
                      color: '#facc15', 
                      borderRadius: '0.5rem', 
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', 
                      transition: 'all 0.2s', 
                      opacity: (selectedStudents.length === 0 || !memo || isSaving) ? '0.5' : '1',
                      cursor: (selectedStudents.length === 0 || !memo || isSaving) ? 'not-allowed' : 'pointer',
                      fontSize: '0.75rem', 
                      fontWeight: 'bold', 
                      border: '1px solid #15803d',
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      minWidth: '90px',
                      height: '24px'
                    }}
                    onClick={handleMemoSave}
                    disabled={selectedStudents.length === 0 || !memo || isSaving}
                  >
                    {isSaving ? '저장 중...' : '메모만 저장'}
                  </button>
                </div>
              </div>
            </div>
            
            {/* 카드 목록 */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' }}>카드 선택</h2>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
                gap: '0.5rem'
              }}>
                {filteredCards.map(card => (
                  <div
                    key={card.id}
                    style={{ 
                      border: '1px solid #e5e7eb', 
                      borderLeft: `4px solid ${card.color}`, 
                      borderRadius: '0.375rem', 
                      overflow: 'hidden', 
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', 
                      cursor: selectedStudents.length > 0 && !isSaving ? 'pointer' : 'not-allowed', 
                      transition: 'all 0.2s',
                      backgroundColor: 'white',
                      opacity: selectedStudents.length > 0 && !isSaving ? '1' : '0.7'
                    }}
                    onClick={() => !isSaving && handleCardClick(card)}
                  >
                    <div style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>{card.icon}</span>
                        <h3 style={{ fontWeight: '600', fontSize: '0.875rem', color: '#1f2937' }}>{card.title}</h3>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#4b5563', marginBottom: '0.5rem', maxHeight: '2.5rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{card.description}</p>
                    </div>
                  </div>
                ))}
              </div>
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