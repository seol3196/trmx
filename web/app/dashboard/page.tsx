'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RecommendedStudents from '../../components/RecommendedStudents';
import { useRouter } from 'next/navigation';

// 노트 타입 정의
interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

// 학생 타입 정의
interface Student {
  id: string;
  name: string;
  lastObservation?: Date;
  observationCount: number;
  record_count?: number;
}

export default function Dashboard() {
  const [userName] = useState<string>('사용자');
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [recommendedStudents, setRecommendedStudents] = useState<Student[]>([]);
  const router = useRouter();

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
    
    // 추천 학생 데이터를 API에서 가져옵니다
    const fetchRecommendedStudents = async () => {
      try {
        const response = await fetch('/api/students/recommended');
        if (response.ok) {
          const data = await response.json();
          // 날짜 문자열을 Date 객체로 변환
          const studentsWithDates = data.map((student: any) => ({
            ...student,
            lastObservation: student.lastObservation ? new Date(student.lastObservation) : undefined
          }));
          setRecommendedStudents(studentsWithDates);
        } else {
          console.error('추천 학생 데이터를 가져오는데 실패했습니다.');
          setRecommendedStudents([]);
        }
      } catch (error) {
        console.error('추천 학생 데이터 로드 중 오류:', error);
        setRecommendedStudents([]);
      }
    };

    fetchRecommendedStudents();
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
    <div className="min-h-screen bg-gray-50">
      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* 모든 섹션을 하나의 행에 배치 - 반응형으로 변경 */}
        <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
          {/* 관찰 추천 학생 */}
          <div className="w-full lg:w-1/3 bg-white rounded-xl border border-gray-200 p-4 md:p-8 min-h-[600px] overflow-hidden shadow-sm">
            <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#4f46e5" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                추천 학생
              </h2>
              <button 
                onClick={() => router.push('/students')}
                className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium bg-gray-50 text-indigo-600 border border-gray-200 transition-all hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                전체 보기
              </button>
            </div>
            
            {recommendedStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300 my-4 h-[70%]">
                <div className="bg-indigo-50 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#4f46e5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="text-[0.938rem] font-medium text-gray-600 mb-2">
                  추천 학생이 없습니다
                </p>
                <p className="text-sm text-gray-500 mb-6 max-w-[80%]">
                  학생 목록에서 관찰이 필요한 학생을 추가해보세요
                </p>
                <button 
                  onClick={() => router.push('/students')}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-md text-sm font-medium bg-indigo-600 text-white border-none shadow-sm hover:bg-indigo-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  학생 추가하기
                </button>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[450px] pr-2">
                <ul className="flex flex-col gap-3">
                  {recommendedStudents.map(student => (
                    <li 
                      key={student.id}
                      className="p-4 rounded-lg border border-gray-200 bg-white cursor-pointer transition-all hover:border-gray-300 hover:bg-gray-50 shadow-sm"
                      onClick={() => router.push(`/students/${student.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#4f46e5">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium text-[0.938rem] text-gray-900 mb-1">
                            {student.name}
                          </h3>
                          <div className="flex items-center gap-3">
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                              </svg>
                              {student.lastObservation ? formatDate(student.lastObservation) : '관찰 기록 없음'}
                            </p>
                            <div className="text-xs py-0.5 px-2 bg-indigo-50 text-indigo-600 rounded-full font-medium">
                              {student.observationCount || student.record_count || 0}회 관찰
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* 내 노트 목록 */}
          <div className="w-full lg:w-1/3 bg-white rounded-xl border border-gray-200 p-4 md:p-8 min-h-[600px] overflow-hidden shadow-sm">
            {/* 내 노트 헤더 및 내용 - 위와 동일한 패턴으로 변환 */}
            <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#4f46e5" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                내 노트
              </h2>
              <button 
                onClick={() => {
                  setSelectedNote(null);
                  setTitle('');
                  setContent('');
                  setIsEditing(false);
                }}
                className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium bg-gray-50 text-indigo-600 border border-gray-200 transition-all hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                새 노트
              </button>
            </div>
            
            {notes.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3rem 1.5rem',
                textAlign: 'center',
                backgroundColor: '#f9fafb',
                borderRadius: '0.5rem',
                border: '1px dashed #d1d5db',
                margin: '1rem 0',
                height: '70%'
              }}>
                <div style={{
                  backgroundColor: '#eef2ff',
                  borderRadius: '50%',
                  width: '4rem',
                  height: '4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#4f46e5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <p style={{ 
                  fontSize: '0.938rem',
                  fontWeight: 500,
                  color: '#4b5563',
                  marginBottom: '0.5rem'
                }}>
                  노트가 없습니다
                </p>
                <p style={{ 
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  marginBottom: '1.5rem',
                  maxWidth: '80%'
                }}>
                  새 노트를 작성하여 중요한 정보를 기록해보세요
                </p>
                <button 
                  onClick={() => {
                    setSelectedNote(null);
                    setTitle('');
                    setContent('');
                    setIsEditing(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.625rem 1rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    backgroundColor: '#4f46e5',
                    color: 'white',
                    border: 'none',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#4338ca';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#4f46e5';
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  새 노트 작성하기
                </button>
              </div>
            ) : (
              <div style={{ overflowY: 'auto', maxHeight: '450px', paddingRight: '0.5rem' }}>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {notes.map(note => (
                    <li 
                      key={note.id}
                      style={{ 
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid',
                        borderColor: selectedNote?.id === note.id ? '#c7d2fe' : '#e5e7eb',
                        backgroundColor: selectedNote?.id === note.id ? '#eef2ff' : 'white',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                        boxShadow: selectedNote?.id === note.id 
                          ? '0 2px 4px rgba(79, 70, 229, 0.1)' 
                          : '0 1px 2px rgba(0, 0, 0, 0.05)'
                      }}
                      onClick={() => handleSelectNote(note)}
                      onMouseEnter={(e) => {
                        if (selectedNote?.id !== note.id) {
                          e.currentTarget.style.borderColor = '#d1d5db';
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedNote?.id !== note.id) {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.backgroundColor = 'white';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 style={{ 
                          fontWeight: 500, 
                          fontSize: '0.938rem',
                          color: selectedNote?.id === note.id ? '#4f46e5' : '#111827',
                          marginRight: '1.5rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {note.title}
                        </h3>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note.id);
                          }}
                          style={{
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            color: '#9ca3af',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            position: 'absolute',
                            top: '0.75rem',
                            right: '0.75rem',
                            padding: '0',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.stopPropagation();
                            e.currentTarget.style.color = '#ef4444';
                            e.currentTarget.style.backgroundColor = '#fee2e2';
                          }}
                          onMouseLeave={(e) => {
                            e.stopPropagation();
                            e.currentTarget.style.color = '#9ca3af';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          aria-label="노트 삭제"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p style={{ 
                        fontSize: '0.75rem',
                        color: selectedNote?.id === note.id ? '#6366f1' : '#6b7280',
                        marginTop: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDate(note.createdAt)}
                      </p>
                      {note.content && (
                        <p style={{ 
                          fontSize: '0.813rem',
                          color: selectedNote?.id === note.id ? '#4b5563' : '#6b7280',
                          marginTop: '0.5rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: '1.3'
                        }}>
                          {note.content}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* 노트 편집 영역 */}
          <div className="w-full lg:w-1/3 bg-white rounded-xl border border-gray-200 p-4 md:p-8 min-h-[600px] overflow-hidden shadow-sm">
            <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#4f46e5" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {isEditing ? '노트 수정' : '새 노트 작성'}
              </h2>
              {isEditing && (
                <button 
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedNote(null);
                    setTitle('');
                    setContent('');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    backgroundColor: '#f9fafb',
                    color: '#4f46e5',
                    border: '1px solid #e5e7eb',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  새 노트
                </button>
              )}
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="노트 제목"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all min-h-[300px]"
                  placeholder="노트 내용"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                ></textarea>
              </div>
              <div className="flex justify-end">
                <button
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  onClick={isEditing ? handleUpdateNote : handleAddNote}
                >
                  {isEditing ? '수정하기' : '저장하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 