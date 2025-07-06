'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// 노트 타입 정의
interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

export default function Dashboard() {
  const [userName] = useState<string>('사용자');
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // 로컬 스토리지에서 노트 불러오기
  useEffect(() => {
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
      try {
        const parsedNotes = JSON.parse(savedNotes);
        // Date 객체로 변환
        const notesWithDates = parsedNotes.map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt)
        }));
        setNotes(notesWithDates);
      } catch (error) {
        console.error('노트 로드 중 오류:', error);
      }
    }
  }, []);

  // 노트 저장
  const saveNotes = (updatedNotes: Note[]) => {
    localStorage.setItem('notes', JSON.stringify(updatedNotes));
    setNotes(updatedNotes);
  };

  // 노트 추가
  const handleAddNote = () => {
    if (title.trim() === '') return;
    
    const newNote: Note = {
      id: Date.now().toString(),
      title,
      content,
      createdAt: new Date()
    };
    
    const updatedNotes = [...notes, newNote];
    saveNotes(updatedNotes);
    setTitle('');
    setContent('');
  };

  // 노트 수정
  const handleUpdateNote = () => {
    if (!selectedNote || title.trim() === '') return;
    
    const updatedNotes = notes.map(note => 
      note.id === selectedNote.id 
        ? { ...note, title, content } 
        : note
    );
    
    saveNotes(updatedNotes);
    setTitle('');
    setContent('');
    setSelectedNote(null);
    setIsEditing(false);
  };

  // 노트 삭제
  const handleDeleteNote = (id: string) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    saveNotes(updatedNotes);
    
    if (selectedNote?.id === id) {
      setSelectedNote(null);
      setTitle('');
      setContent('');
      setIsEditing(false);
    }
  };

  // 노트 선택
  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
    setIsEditing(true);
  };

  // 날짜 포맷팅 함수
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen">
      {/* 상단 네비게이션 바 */}
      <nav className="bg-white shadow-md">
        <div className="container">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-bold" style={{ color: 'var(--primary-color)' }}>ClickNote</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-primary-color font-medium">
                대시보드
              </Link>
              <Link href="/dashboard/cards" className="text-gray-600 hover:text-primary-color">
                카드 기록
              </Link>
              <Link href="/dashboard/records" className="text-gray-600 hover:text-primary-color">
                기록 조회
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <main className="container py-8">
        <div className="flex flex-col gap-6 md:flex-row">
          {/* 노트 목록 */}
          <div className="md:w-1/3 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">내 노트</h2>
              <button 
                onClick={() => {
                  setSelectedNote(null);
                  setTitle('');
                  setContent('');
                  setIsEditing(false);
                }}
                className="btn btn-primary"
              >
                새 노트
              </button>
            </div>
            
            {notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--gray-400)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-center">노트가 없습니다. 새 노트를 작성해보세요!</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {notes.map(note => (
                  <li 
                    key={note.id}
                    className="p-6 border rounded-lg cursor-pointer"
                    style={{ 
                      backgroundColor: selectedNote?.id === note.id ? 'var(--gray-100)' : 'white',
                      borderColor: selectedNote?.id === note.id ? 'var(--primary-color)' : 'var(--gray-300)',
                      boxShadow: selectedNote?.id === note.id ? '0 0 0 2px rgba(79, 70, 229, 0.1)' : 'none'
                    }}
                    onClick={() => handleSelectNote(note)}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-gray-800">{note.title}</h3>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        style={{ 
                          color: 'var(--gray-400)',
                          padding: '0.25rem',
                          borderRadius: '9999px'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.color = 'var(--primary-color)';
                          e.currentTarget.style.backgroundColor = 'var(--gray-100)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.color = 'var(--gray-400)';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        aria-label="노트 삭제"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">{formatDate(note.createdAt)}</p>
                    {note.content && (
                      <p className="text-sm text-gray-600 mt-2" style={{
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {note.content}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* 노트 편집기 */}
          <div className="md:w-2/3 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">
              {isEditing ? '노트 수정' : '새 노트 작성'}
            </h2>
            <div className="space-y-5">
              <div>
                <label htmlFor="title">
                  제목
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="노트 제목을 입력하세요"
                />
              </div>
              <div>
                <label htmlFor="content">
                  내용
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  placeholder="노트 내용을 입력하세요"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={isEditing ? handleUpdateNote : handleAddNote}
                  disabled={title.trim() === ''}
                  className="btn btn-primary"
                  style={{ opacity: title.trim() === '' ? 0.5 : 1 }}
                >
                  {isEditing ? '수정하기' : '저장하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 