'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// 추천 학생 타입 정의
interface RecommendedStudent {
  id: string;
  name: string;
  student_number: number;
  record_count: number;
}

export default function RecommendedStudents() {
  const [students, setStudents] = useState<RecommendedStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredStudentId, setHoveredStudentId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchRecommendedStudents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/recommended-students');
        
        if (!response.ok) {
          throw new Error('추천 학생을 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        setStudents(data);
      } catch (err) {
        console.error('추천 학생 로드 오류:', err);
        setError('추천 학생을 불러오는데 문제가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendedStudents();
    
    // 매일 자정에 갱신 (컴포넌트가 마운트된 상태라면)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    // 자정에 한 번 실행하고, 그 후 24시간마다 실행
    const midnightTimeout = setTimeout(() => {
      fetchRecommendedStudents();
      
      // 이후 24시간마다 실행
      const dailyInterval = setInterval(fetchRecommendedStudents, 24 * 60 * 60 * 1000);
      
      return () => clearInterval(dailyInterval);
    }, timeUntilMidnight);
    
    return () => clearTimeout(midnightTimeout);
  }, []);

  // 학생 이름 클릭 시 기록 조회 페이지로 이동
  const handleStudentClick = (studentId: string, studentName: string) => {
    router.push(`/dashboard/records?studentId=${studentId}&studentName=${encodeURIComponent(studentName)}`);
  };

  if (isLoading) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        border: '1px solid #e5e7eb',
        padding: '2rem',
        height: '100%',
        minHeight: '600px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 500, color: '#1f2937', marginBottom: '1.5rem' }}>관찰 추천 학생</h2>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: '2.5rem',
          paddingBottom: '2.5rem',
          flexGrow: 1
        }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ borderRadius: '9999px', backgroundColor: '#e5e7eb', height: '0.75rem', width: '0.75rem' }}></div>
            <div style={{ borderRadius: '9999px', backgroundColor: '#e5e7eb', height: '0.75rem', width: '0.75rem' }}></div>
            <div style={{ borderRadius: '9999px', backgroundColor: '#e5e7eb', height: '0.75rem', width: '0.75rem' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        border: '1px solid #e5e7eb',
        padding: '2rem',
        height: '100%',
        minHeight: '600px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 500, color: '#1f2937', marginBottom: '1.5rem' }}>관찰 추천 학생</h2>
        <div style={{
          color: '#ef4444',
          textAlign: 'center',
          padding: '1rem',
          fontSize: '0.875rem',
          border: '1px solid #fee2e2',
          backgroundColor: '#fef2f2',
          borderRadius: '0.375rem',
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const tableStyle = {
    minWidth: '100%',
    borderCollapse: 'separate' as const,
    borderSpacing: 0
  };

  const tdStyle = {
    padding: '1rem 0.5rem',
    fontSize: '0.875rem',
    borderBottom: '1px solid #e5e7eb'
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      border: '1px solid #e5e7eb',
      padding: '2rem',
      height: '100%',
      minHeight: '600px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 500, color: '#1f2937' }}>관찰 추천 학생</h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>매일 자정 갱신</p>
      </div>
      
      {students.length === 0 ? (
        <div style={{
          color: '#6b7280',
          textAlign: 'center',
          padding: '2.5rem 0',
          fontSize: '0.875rem',
          border: '1px dashed #d1d5db',
          borderRadius: '0.5rem',
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <p style={{ padding: '1rem 0' }}>추천할 학생이 없습니다.</p>
        </div>
      ) : (
        <div style={{
          overflow: 'hidden',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ overflowY: 'auto', flexGrow: 1 }}>
            <table style={tableStyle}>
              <tbody>
                {students.map((student) => (
                  <tr 
                    key={student.id}
                    style={{ transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ ...tdStyle, width: '4rem', paddingLeft: '1rem' }}>{student.student_number}번</td>
                    <td 
                      style={{ 
                        ...tdStyle, 
                        fontSize: '1rem', 
                        fontWeight: 500, 
                        color: hoveredStudentId === student.id ? '#4f46e5' : '#111827',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textDecoration: hoveredStudentId === student.id ? 'underline' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                      onClick={() => handleStudentClick(student.id, student.name)}
                      onMouseEnter={() => setHoveredStudentId(student.id)}
                      onMouseLeave={() => setHoveredStudentId(null)}
                    >
                      {student.name}
                      {hoveredStudentId === student.id && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                      )}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', width: '6rem', paddingRight: '1rem', color: '#6b7280' }}>
                      {student.record_count === 0 
                        ? '기록 없음' 
                        : `${student.record_count}개 기록`}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', width: '5rem', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}>
                      <Link href={`/dashboard/records?studentId=${student.id}&studentName=${encodeURIComponent(student.name)}`} style={{ display: 'inline-flex' }}>
                        <button style={{
                          padding: '0.5rem 1rem',
                          border: '1px solid #d1d5db',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          borderRadius: '0.375rem',
                          color: '#4b5563',
                          backgroundColor: 'white',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                          기록 보기
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
            <p>* 최근 2주간 관찰 기록이 적은 학생 순</p>
          </div>
        </div>
      )}
    </div>
  );
} 