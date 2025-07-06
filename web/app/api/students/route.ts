import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase 서버 클라이언트 생성 (서비스 롤 사용)
const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kbnskzykzornnvjoknry.supabase.co';
  // 서비스 롤 키는 RLS를 우회할 수 있음
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtibnNrenlrem9ybm52am9rbnJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTcyMzU3MSwiZXhwIjoyMDY3Mjk5NTcxfQ.qov51H7Hdx73j47kGQwaZRPakePSu-6sGFaVPwEArSo';
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

// 유효한 사용자 ID를 얻는 함수
async function getValidUserId() {
  const supabase = createServerClient();
  
  // 기존 사용자 찾기
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .limit(1);
  
  if (users && users.length > 0) {
    return users[0].id;
  }
  
  // 사용자가 없으면 새로 생성
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({ email: 'default@example.com', role: 'teacher' })
    .select('id')
    .single();
  
  if (error) {
    console.error('사용자 생성 오류:', error);
    throw new Error('사용자를 생성할 수 없습니다.');
  }
  
  return newUser.id;
}

// GET 요청 처리 - 학생 목록 가져오기
export async function GET() {
  try {
    const supabase = createServerClient();
    
    // 학생 데이터 가져오기
    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .order('student_number');
    
    if (error) {
      console.error('학생 데이터 로드 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(students);
  } catch (error) {
    console.error('학생 데이터 로드 오류:', error);
    return NextResponse.json(
      { error: '학생 데이터를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST 요청 처리 - 새 학생 생성
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = createServerClient();
    const userId = await getValidUserId();
    
    // 새 학생 생성
    const { data, error } = await supabase
      .from('students')
      .insert({ ...body, user_id: userId })
      .select()
      .single();
    
    if (error) {
      console.error('학생 생성 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('학생 생성 오류:', error);
    return NextResponse.json(
      { error: '학생을 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT 요청 처리 - 학생 정보 수정
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const supabase = createServerClient();
    
    // 학생 정보 수정
    const { data, error } = await supabase
      .from('students')
      .update(body)
      .eq('id', body.id)
      .select()
      .single();
    
    if (error) {
      console.error('학생 수정 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('학생 수정 오류:', error);
    return NextResponse.json(
      { error: '학생 정보를 수정하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE 요청 처리 - 학생 삭제
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: '학생 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    const supabase = createServerClient();
    
    // 학생 삭제
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('학생 삭제 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('학생 삭제 오류:', error);
    return NextResponse.json(
      { error: '학생을 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 