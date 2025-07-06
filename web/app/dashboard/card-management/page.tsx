'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '../../../lib/supabase';

// 타입 정의
interface Card {
  id: string;
  title: string;
  description: string;
  subject: string;
  color: string;
  icon: string;
}

export default function CardManagementPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentCard, setCurrentCard] = useState<Card>({
    id: '',
    title: '',
    description: '',
    subject: '공통',
    color: '#4F46E5',
    icon: '📝'
  });
  
  const [subjects, setSubjects] = useState<string[]>(['공통', '국어', '수학', '영어', '과학', '사회', '음악', '미술', '체육']);
  const [availableIcons] = useState<string[]>(['📝', '🔍', '📚', '✏️', '🖊️', '📒', '🎯', '🏆', '👍', '👏', '🌟', '⭐', '💯', '🎓', '🧠', '💡', '🔆', '📊', '📈', '🧩']);
  const [availableColors] = useState<string[]>(['#4F46E5', '#2563EB', '#0891B2', '#059669', '#65A30D', '#CA8A04', '#DC2626', '#9333EA', '#DB2777', '#475569']);
  const [selectedSubject, setSelectedSubject] = useState<string>('전체');
  
  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // API를 통해 카드 데이터 가져오기
        const response = await fetch('/api/cards');
        if (!response.ok) {
          throw new Error('카드 데이터를 불러오는데 실패했습니다.');
        }
        
        const cardsData = await response.json();
        
        // 타입 변환 확인
        const typedCards = cardsData as unknown as Card[];
        setCards(typedCards);
        
        // 기존 과목 및 카테고리 목록 가져오기
        if (typedCards && typedCards.length > 0) {
          const existingSubjects = Array.from(new Set(typedCards.map(card => card.subject)));
          
          if (existingSubjects.length > 0) {
            setSubjects(prev => Array.from(new Set([...prev, ...existingSubjects])));
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

  // 카드 저장 처리
  const handleSaveCard = async () => {
    if (!currentCard.title || !currentCard.description) {
      alert('제목과 설명을 모두 입력해주세요.');
      return;
    }
    
    try {
      if (currentCard.id) {
        // 기존 카드 수정 - API 사용
        const response = await fetch('/api/cards', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(currentCard)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '카드 수정 중 오류가 발생했습니다.');
        }
        
        alert('카드가 성공적으로 수정되었습니다.');
      } else {
        // 새 카드 생성 - API 사용
        const response = await fetch('/api/cards', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(currentCard)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '카드 생성 중 오류가 발생했습니다.');
        }
        
        alert('새 카드가 성공적으로 생성되었습니다.');
      }
      
      // 카드 목록 새로고침
      const response = await fetch('/api/cards');
      if (!response.ok) {
        throw new Error('카드 목록을 새로고침하는데 실패했습니다.');
      }
      
      const updatedCards = await response.json();
      setCards(updatedCards as unknown as Card[]);
      
      // 폼 초기화
      resetForm();
    } catch (error) {
      console.error('카드 저장 오류:', error);
      alert(`카드 저장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  // 카드 삭제 처리
  const handleDeleteCard = async (id: string) => {
    if (!confirm('정말로 이 카드를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }
    
    try {
      // API를 통한 카드 삭제
      const response = await fetch(`/api/cards?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '카드 삭제 중 오류가 발생했습니다.');
      }
      
      // 카드 목록 업데이트
      setCards(cards.filter(card => card.id !== id));
      alert('카드가 성공적으로 삭제되었습니다.');
      
      // 현재 편집 중인 카드가 삭제된 카드라면 폼 초기화
      if (currentCard.id === id) {
        resetForm();
      }
    } catch (error) {
      console.error('카드 삭제 오류:', error);
      alert(`카드 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  // 카드 편집 시작
  const handleEditCard = (card: Card) => {
    setCurrentCard({ ...card });
    setIsEditing(true);
  };

  // 폼 초기화
  const resetForm = () => {
    setCurrentCard({
      id: '',
      title: '',
      description: '',
      subject: '공통',
      color: '#4F46E5',
      icon: '📝'
    });
    setIsEditing(false);
  };

  // 과목 추가
  const handleAddSubject = () => {
    const newSubject = prompt('추가할 과목명을 입력하세요:');
    if (newSubject && !subjects.includes(newSubject)) {
      setSubjects([...subjects, newSubject]);
      setCurrentCard({ ...currentCard, subject: newSubject });
    }
  };

  const filteredCards = selectedSubject === '전체'
    ? cards
    : cards.filter(card => card.subject === selectedSubject);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '1.5rem 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>카드 관리</h1>
        
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '16rem', backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)', padding: '1.5rem' }}>
            <div style={{ height: '4rem', width: '4rem', borderRadius: '50%', border: '4px solid #e5e7eb', borderTopColor: '#3b82f6', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ marginTop: '1rem', color: '#4b5563' }}>데이터를 불러오는 중입니다...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            {/* 카드 생성/편집 폼 */}
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>{isEditing ? '카드 편집' : '새 카드 생성'}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                  {/* 제목 */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>제목</label>
                    <input
                      type="text"
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '0.5rem', 
                        outline: 'none',
                        transition: 'all 0.2s',
                        boxSizing: 'border-box'
                      }}
                      placeholder="카드 제목"
                      value={currentCard.title}
                      onChange={(e) => setCurrentCard({ ...currentCard, title: e.target.value })}
                    />
                  </div>
                  
                  {/* 색상 선택 */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>색상</label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {availableColors.map(color => (
                        <button
                          key={color}
                          style={{ 
                            width: '2.5rem', 
                            height: '2.5rem', 
                            borderRadius: '50%', 
                            backgroundColor: color, 
                            border: '2px solid #d1d5db',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            outline: currentCard.color === color ? '2px solid #6b7280' : 'none',
                            outlineOffset: currentCard.color === color ? '2px' : '0',
                            cursor: 'pointer',
                            margin: '0.25rem'
                          }}
                          onClick={() => setCurrentCard({ ...currentCard, color })}
                        ></button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* 설명 */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>설명</label>
                  <textarea
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '0.5rem', 
                      outline: 'none',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                    placeholder="카드 설명"
                    rows={3}
                    value={currentCard.description}
                    onChange={(e) => setCurrentCard({ ...currentCard, description: e.target.value })}
                  ></textarea>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                  {/* 과목 */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>과목</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select
                        style={{ 
                          flex: '1', 
                          padding: '0.75rem', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '0.5rem', 
                          outline: 'none',
                          transition: 'all 0.2s'
                        }}
                        value={currentCard.subject}
                        onChange={(e) => setCurrentCard({ ...currentCard, subject: e.target.value })}
                      >
                        {subjects.map(subject => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                      </select>
                      <button
                        style={{
                          padding: '12px 16px',
                          backgroundColor: '#e5e7eb',
                          color: '#374151',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          minWidth: '48px',
                          minHeight: '48px',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#d1d5db'}
                        onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#e5e7eb'}
                        onClick={handleAddSubject}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* 아이콘 선택 */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>아이콘</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '0.5rem' }}>
                    {availableIcons.map(icon => (
                      <button
                        key={icon}
                        style={{ 
                          padding: '0.5rem', 
                          fontSize: '1.5rem', 
                          borderRadius: '0.5rem', 
                          backgroundColor: currentCard.icon === icon ? '#dbeafe' : '#f9fafb',
                          border: currentCard.icon === icon ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                          cursor: 'pointer'
                        }}
                        onClick={() => setCurrentCard({ ...currentCard, icon })}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* 버튼 그룹 */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem' }}>
                  <button
                    style={{ 
                      padding: '0.5rem 1rem', 
                      backgroundColor: '#e5e7eb', 
                      color: '#374151', 
                      borderRadius: '0.5rem', 
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={resetForm}
                  >
                    취소
                  </button>
                  <button
                    style={{ 
                      padding: '0.5rem 1rem', 
                      backgroundColor: '#2563eb', 
                      color: 'white', 
                      borderRadius: '0.5rem', 
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={handleSaveCard}
                  >
                    {isEditing ? '수정하기' : '생성하기'}
                  </button>
                </div>
              </div>
            </div>
            
            {/* 카드 목록 */}
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>카드 목록</h2>
              
              {/* 과목 필터 */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>과목별 필터링</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <button
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      fontWeight: '500',
                      fontSize: '0.875rem',
                      backgroundColor: selectedSubject === '전체' ? '#3b82f6' : '#f3f4f6',
                      color: selectedSubject === '전체' ? 'white' : '#374151',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedSubject('전체')}
                  >
                    전체
                  </button>
                  {subjects.map(subject => (
                    <button
                      key={subject}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        fontWeight: '500',
                        fontSize: '0.875rem',
                        backgroundColor: selectedSubject === subject ? '#3b82f6' : '#f3f4f6',
                        color: selectedSubject === subject ? 'white' : '#374151',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedSubject(subject)}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>
              
              {cards.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 0', color: '#6b7280' }}>
                  생성된 카드가 없습니다. 새 카드를 만들어보세요.
                </div>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                  gap: '1rem', 
                  maxHeight: '600px', 
                  overflowY: 'auto', 
                  paddingRight: '0.5rem' 
                }}>
                  {filteredCards.map(card => (
                    <div 
                      key={card.id} 
                      style={{ 
                        border: '1px solid #e5e7eb', 
                        borderLeft: `6px solid ${card.color}`, 
                        borderRadius: '0.5rem', 
                        padding: '1rem', 
                        transition: 'all 0.2s',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '1.875rem' }}>{card.icon}</span>
                          <div>
                            <h3 style={{ fontWeight: '600', fontSize: '1.125rem' }}>{card.title}</h3>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{card.subject}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            style={{ 
                              padding: '0.5rem', 
                              color: '#2563eb', 
                              borderRadius: '9999px', 
                              border: 'none',
                              backgroundColor: 'transparent',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleEditCard(card)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '1.25rem', width: '1.25rem' }} viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            style={{ 
                              padding: '0.5rem', 
                              color: '#dc2626', 
                              borderRadius: '9999px', 
                              border: 'none',
                              backgroundColor: 'transparent',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleDeleteCard(card.id)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '1.25rem', width: '1.25rem' }} viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p style={{ marginTop: '0.5rem', color: '#374151' }}>{card.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 