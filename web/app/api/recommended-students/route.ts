import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase 서버 클라이언트 생성
const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kbnskzykzornnvjoknry.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtibnNrenlrem9ybm52am9rbnJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTcyMzU3MSwiZXhwIjoyMDY3Mjk5NTcxfQ.qov51H7Hdx73j47kGQwaZRPakePSu-6sGFaVPwEArSo';
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

// GET 요청 처리 - 관찰이 필요한 학생 추천
export async function GET() {
  try {
    const supabase = createServerClient();
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14); // 2주 전 날짜 계산
    
    // 1. 모든 학생 가져오기
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, student_number, class_id');
    
    if (studentsError) {
      console.error('학생 데이터 로드 오류:', studentsError);
      return NextResponse.json({ error: studentsError.message }, { status: 500 });
    }
    
    // 2. 최근 2주간 기록 가져오기
    const { data: recentRecords, error: recordsError } = await supabase
      .from('card_records')
      .select('student_id, recorded_date')
      .gte('recorded_date', twoWeeksAgo.toISOString());
    
    if (recordsError) {
      console.error('기록 데이터 로드 오류:', recordsError);
      return NextResponse.json({ error: recordsError.message }, { status: 500 });
    }
    
    // 3. 학생별 기록 수 계산
    const recordCounts: Record<string, number> = {};
    
    students.forEach(student => {
      recordCounts[student.id] = 0;
    });
    
    recentRecords.forEach(record => {
      if (recordCounts[record.student_id] !== undefined) {
        recordCounts[record.student_id] += 1;
      }
    });
    
    // 4. 기록 수에 따라 학생 정렬 (기록이 적은 순)
    const sortedStudents = [...students].sort((a, b) => {
      const countA = recordCounts[a.id] || 0;
      const countB = recordCounts[b.id] || 0;
      
      // 기록 수가 같으면 무작위로 정렬 (매일 자정에 바뀌도록)
      if (countA === countB) {
        const today = new Date().setHours(0, 0, 0, 0);
        const randomA = Math.sin(today + a.id.charCodeAt(0)) * 10000;
        const randomB = Math.sin(today + b.id.charCodeAt(0)) * 10000;
        return randomA - randomB;
      }
      
      return countA - countB;
    });
    
    // 5. 최대 5명의 학생 추천
    const recommendedStudents = sortedStudents.slice(0, 5).map(student => ({
      id: student.id,
      name: student.name,
      student_number: student.student_number,
      class_id: student.class_id,
      record_count: recordCounts[student.id] || 0
    }));
    
    return NextResponse.json(recommendedStudents);
  } catch (error) {
    console.error('추천 학생 데이터 로드 오류:', error);
    return NextResponse.json(
      { error: '추천 학생 데이터를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 