'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '../../../lib/supabase';

// 타입 정의
interface Card {
  id: string;
  title: string;
  description: string;
  subject: string;
  category: string;
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
    category: '행동',
    color: '#4F46E5',
    icon: '📝'
  });
  
  const [subjects, setSubjects] = useState<string[]>(['공통', '국어', '수학', '영어', '과학', '사회', '음악', '미술', '체육']);
  const [categories, setCategories] = useState<string[]>(['행동', '학습', '참여', '태도', '협력', '창의성']);
  const [availableIcons] = useState<string[]>(['📝', '🔍', '📚', '✏️', '🖊️', '📒', '🎯', '🏆', '👍', '👏', '🌟', '⭐', '💯', '🎓', '🧠', '💡', '🔆', '📊', '📈', '🧩']);
  const [availableColors] = useState<string[]>(['#4F46E5', '#2563EB', '#0891B2', '#059669', '#65A30D', '#CA8A04', '#DC2626', '#9333EA', '#DB2777', '#475569']);
  
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
          const existingCategories = Array.from(new Set(typedCards.map(card => card.category)));
          
          if (existingSubjects.length > 0) {
            setSubjects(prev => Array.from(new Set([...prev, ...existingSubjects])));
          }
          
          if (existingCategories.length > 0) {
            setCategories(prev => Array.from(new Set([...prev, ...existingCategories])));
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
      category: '행동',
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

  // 카테고리 추가
  const handleAddCategory = () => {
    const newCategory = prompt('추가할 카테고리명을 입력하세요:');
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setCurrentCard({ ...currentCard, category: newCategory });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">카드 관리</h1>
        
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64 bg-white rounded-xl shadow-sm p-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-500"></div>
            <p className="mt-4 text-gray-600">데이터를 불러오는 중입니다...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 카드 생성/편집 폼 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">{isEditing ? '카드 편집' : '새 카드 생성'}</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 제목 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all"
                      placeholder="카드 제목"
                      value={currentCard.title}
                      onChange={(e) => setCurrentCard({ ...currentCard, title: e.target.value })}
                    />
                  </div>
                  
                  {/* 색상 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">색상</label>
                    <div className="grid grid-cols-5 gap-2">
                      {availableColors.map(color => (
                        <button
                          key={color}
                          className={`w-10 h-10 rounded-full ${currentCard.color === color ? 'ring-2 ring-offset-2 ring-gray-500' : ''}`}
                          style={{ 
                            backgroundColor: color, 
                            border: '2px solid #d1d5db',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                          onClick={() => setCurrentCard({ ...currentCard, color })}
                        ></button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* 설명 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all"
                    placeholder="카드 설명"
                    rows={3}
                    value={currentCard.description}
                    onChange={(e) => setCurrentCard({ ...currentCard, description: e.target.value })}
                  ></textarea>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 과목 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">과목</label>
                    <div className="flex gap-2">
                      <select
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all"
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
                  
                  {/* 카테고리 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                    <div className="flex gap-2">
                      <select
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all"
                        value={currentCard.category}
                        onChange={(e) => setCurrentCard({ ...currentCard, category: e.target.value })}
                      >
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
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
                        onClick={handleAddCategory}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* 아이콘 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">아이콘</label>
                  <div className="grid grid-cols-10 gap-2">
                    {availableIcons.map(icon => (
                      <button
                        key={icon}
                        className={`p-2 text-2xl rounded-lg ${currentCard.icon === icon ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50 border border-gray-200'}`}
                        onClick={() => setCurrentCard({ ...currentCard, icon })}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* 버튼 그룹 */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
                    onClick={resetForm}
                  >
                    취소
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                    onClick={handleSaveCard}
                  >
                    {isEditing ? '수정하기' : '생성하기'}
                  </button>
                </div>
              </div>
            </div>
            
            {/* 카드 목록 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">카드 목록</h2>
              
              {cards.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  생성된 카드가 없습니다. 새 카드를 만들어보세요.
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {cards.map(card => (
                    <div 
                      key={card.id} 
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                      style={{ borderLeft: `6px solid ${card.color}` }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{card.icon}</span>
                          <div>
                            <h3 className="font-semibold text-lg">{card.title}</h3>
                            <p className="text-sm text-gray-500">{card.subject} / {card.category}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                            onClick={() => handleEditCard(card)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                            onClick={() => handleDeleteCard(card.id)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p className="mt-2 text-gray-700">{card.description}</p>
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