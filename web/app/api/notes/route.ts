import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase 서버 클라이언트 생성 (서비스 롤 사용)
const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kbnskzykzornnvjoknry.supabase.co';
  // 서비스 롤 키는 RLS를 우회할 수 있음
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtibnNrenlrem9ybm52am9rbnJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTcyMzU3MSwiZXhwIjoyMDY3Mjk5NTcxfQ.qov51H7Hdx73j47kGQwaZRPakePSu-6sGFaVPwEArSo';
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

// 노트 타입 정의
interface Note {
  id: string;
  student_id: string;
  content: string;
  created_at: string;
  subject?: string;
}

// GET 요청 처리 - 노트 목록 가져오기
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const url = new URL(request.url);
    const studentId = url.searchParams.get('studentId');
    
    let query = supabase.from('notes').select('*');
    
    // 학생 ID로 필터링
    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    
    // 최신순으로 정렬
    query = query.order('created_at', { ascending: false });
    
    const { data: notes, error } = await query;
    
    if (error) {
      console.error('노트 데이터 로드 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(notes);
  } catch (error) {
    console.error('노트 데이터 로드 오류:', error);
    return NextResponse.json(
      { error: '노트 데이터를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST 요청 처리 - 노트 추가하기
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const noteData = await request.json();
    
    // 필수 필드 검증
    if (!noteData.student_id || !noteData.content) {
      return NextResponse.json(
        { error: '학생 ID와 내용은 필수 항목입니다.' },
        { status: 400 }
      );
    }
    
    // 노트 추가
    const { data, error } = await supabase
      .from('notes')
      .insert([
        {
          student_id: noteData.student_id,
          content: noteData.content,
          subject: noteData.subject || null,
        }
      ])
      .select();
    
    if (error) {
      console.error('노트 추가 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error('노트 추가 오류:', error);
    return NextResponse.json(
      { error: '노트를 추가하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 