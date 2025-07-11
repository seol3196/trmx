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
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">카드 관리</h1>
        
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64 bg-white rounded-xl shadow-sm p-6">
            <div className="h-16 w-16 rounded-full border-4 border-gray-200 border-t-blue-500 animate-spin"></div>
            <p className="mt-4 text-gray-600">데이터를 불러오는 중입니다...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {/* 카드 생성/편집 폼 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">{isEditing ? '카드 편집' : '새 카드 생성'}</h2>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4">
                  {/* 제목 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      placeholder="카드 제목"
                      value={currentCard.title}
                      onChange={(e) => setCurrentCard({ ...currentCard, title: e.target.value })}
                    />
                  </div>
                  
                  {/* 색상 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">색상</label>
                    <div className="flex gap-2 flex-wrap">
                      {availableColors.map(color => (
                        <button
                          key={color}
                          className={`w-10 h-10 rounded-full border-2 shadow-sm cursor-pointer m-1 ${currentCard.color === color ? 'ring-2 ring-gray-500 ring-offset-2' : 'border-gray-300'}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setCurrentCard({ ...currentCard, color })}
                        ></button>
                      ))}
                    </div>
                  </div>
                  
                  {/* 아이콘 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">아이콘</label>
                    <div className="flex gap-2 flex-wrap">
                      {availableIcons.map(icon => (
                        <button
                          key={icon}
                          className={`w-10 h-10 flex items-center justify-center rounded-lg border text-xl cursor-pointer ${currentCard.icon === icon ? 'bg-indigo-100 border-indigo-300' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                          onClick={() => setCurrentCard({ ...currentCard, icon })}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* 과목 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">과목</label>
                    <div className="flex items-center gap-2">
                      <select
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        value={currentCard.subject}
                        onChange={(e) => setCurrentCard({ ...currentCard, subject: e.target.value })}
                      >
                        {subjects.map(subject => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                      </select>
                      <button
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-200 transition-colors"
                        onClick={handleAddSubject}
                      >
                        과목 추가
                      </button>
                    </div>
                  </div>
                  
                  {/* 설명 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      placeholder="카드 설명"
                      rows={3}
                      value={currentCard.description}
                      onChange={(e) => setCurrentCard({ ...currentCard, description: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                
                {/* 버튼 그룹 */}
                <div className="flex justify-end gap-3 mt-2">
                  <button
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-200 transition-colors"
                    onClick={resetForm}
                  >
                    취소
                  </button>
                  <button
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    onClick={handleSaveCard}
                  >
                    {isEditing ? '수정' : '생성'}
                  </button>
                </div>
              </div>
            </div>
            
            {/* 카드 목록 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">카드 목록</h2>
                <div className="flex gap-2">
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                  >
                    <option value="전체">전체 과목</option>
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {filteredCards.length === 0 ? (
                <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-8 text-center">
                  <p className="text-gray-600 mb-2">카드가 없습니다.</p>
                  <p className="text-sm text-gray-500">위 폼을 사용하여 새 카드를 생성하세요.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCards.map(card => (
                    <div key={card.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                      <div className="p-4">
                        <div className="flex items-start">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg mr-3 flex-shrink-0"
                            style={{ backgroundColor: card.color }}
                          >
                            {card.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 mb-1">{card.title}</h3>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{card.description}</p>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                {card.subject}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 flex justify-end gap-2">
                        <button
                          className="px-3 py-1 text-sm bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 transition-colors"
                          onClick={() => handleEditCard(card)}
                        >
                          편집
                        </button>
                        <button
                          className="px-3 py-1 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
                          onClick={() => handleDeleteCard(card.id)}
                        >
                          삭제
                        </button>
                      </div>
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