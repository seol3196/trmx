import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 서비스 롤 키를 사용하는 클라이언트 생성 (RLS 우회)
const createServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kbnskzykzornnvjoknry.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtibnNrenlrem9ybm52am9rbnJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTcyMzU3MSwiZXhwIjoyMDY3Mjk5NTcxfQ.qov51H7Hdx73j47kGQwaZRPakePSu-6sGFaVPwEArSo';
  
  console.log('[API] 서비스 롤 키로 클라이언트 생성 (RLS 우회)');
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
    const supabase = createServiceClient();
    const url = new URL(request.url);
    const studentId = url.searchParams.get('studentId');
    const userId = url.searchParams.get('userId');
    
    console.log('[API] 노트 요청 - 학생 ID:', studentId, '사용자 ID:', userId);
    
    let query = supabase.from('notes').select('*');
    
    // 학생 ID로 필터링
    if (studentId) {
      console.log(`[API] 학생 ID로 노트 필터링: ${studentId}`);
      query = query.eq('student_id', studentId);
    }
    
    // 사용자 ID로 필터링
    if (userId) {
      console.log(`[API] 사용자 ID로 노트 필터링: ${userId}`);
      query = query.eq('created_by', userId);
    }
    
    // 최신순으로 정렬
    query = query.order('created_at', { ascending: false });
    
    const { data: notes, error } = await query;
    
    if (error) {
      console.error('[API] 노트 데이터 로드 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log(`[API] 노트 데이터 ${notes ? notes.length : 0}개 로드 성공`);
    
    return NextResponse.json(notes);
  } catch (error) {
    console.error('[API] 노트 데이터 로드 오류:', error);
    return NextResponse.json(
      { error: '노트 데이터를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST 요청 처리 - 노트 추가하기
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
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
      console.error('[API] 노트 추가 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error('[API] 노트 추가 오류:', error);
    return NextResponse.json(
      { error: '노트를 추가하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 