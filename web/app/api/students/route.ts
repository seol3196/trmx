import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 서비스 롤 키를 사용하는 클라이언트 생성 (RLS 우회)
const createServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kbnskzykzornnvjoknry.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtibnNrenlrem9ybm52am9rbnJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTcyMzU3MSwiZXhwIjoyMDY3Mjk5NTcxfQ.qov51H7Hdx73j47kGQwaZRPakePSu-6sGFaVPwEArSo';
  
  console.log('[API] 서비스 롤 키로 클라이언트 생성 (RLS 우회)');
  return createClient(supabaseUrl, supabaseServiceKey);
};

// GET 요청 처리 - 학생 목록 가져오기
export async function GET(request: Request) {
  try {
    console.log('[API] 학생 데이터 요청 시작');
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    
    console.log('[API] 요청 파라미터:', { id, userId });
    
    // 특정 학생 ID로 필터링
    if (id) {
      console.log(`[API] 특정 학생 ID로 조회: ${id}`);
      const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('[API] 학생 데이터 로드 오류:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      console.log('[API] 학생 데이터 조회 성공:', student ? '데이터 있음' : '데이터 없음');
      return NextResponse.json(student);
    }
    
    // 모든 학생 데이터 가져오기 (사용자 ID로 필터링 가능)
    console.log('[API] 학생 데이터 조회 시도');
    
    let query = supabase
      .from('students')
      .select('*');
    
    // 사용자 ID로 필터링 (URL 파라미터에서 userId가 제공된 경우)
    if (userId) {
      console.log(`[API] 사용자 ID로 필터링: ${userId}`);
      query = query.eq('user_id', userId);
    }
    // 필터링이 없는 경우 모든 학생 데이터 반환 (기본 필터링 제거)
    
    // 학생 번호로 정렬
    const { data: students, error } = await query.order('student_number');
    
    if (error) {
      console.error('[API] 학생 데이터 로드 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // 학생 데이터가 없는 경우 빈 배열 반환
    if (!students || students.length === 0) {
      console.log('[API] 학생 데이터 없음');
      return NextResponse.json([]);
    }
    
    console.log(`[API] 학생 데이터 ${students.length}명 조회 성공`);
    
    // 디버깅용 첫 번째 학생 데이터 출력
    if (students.length > 0) {
      console.log('[API] 첫 번째 학생 샘플:', {
        id: students[0].id,
        name: students[0].name,
        user_id: students[0].user_id
      });
    }
    
    return NextResponse.json(students);
  } catch (error: any) {
    console.error('[API] 학생 데이터 로드 중 예외 발생:', error?.message || error);
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
    const supabase = createServiceClient();
    
    // 새 학생 데이터에 기본 사용자 ID 추가 (필요한 경우)
    const studentData = {
      ...body,
      user_id: body.user_id || 'f4f57d97-a05f-4dcd-982e-65be3344d198' // 기본 사용자 ID 설정
    };
    
    console.log('[API] 새 학생 생성 시도:', studentData);
    
    // 새 학생 생성
    const { data, error } = await supabase
      .from('students')
      .insert(studentData)
      .select()
      .single();
    
    if (error) {
      console.error('[API] 학생 생성 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('[API] 학생 생성 성공:', data?.id);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API] 학생 생성 중 예외 발생:', error?.message || error);
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
    const supabase = createServiceClient();
    
    console.log('[API] 학생 정보 수정 시도:', body?.id);
    
    // 학생 정보 수정
    const { data, error } = await supabase
      .from('students')
      .update(body)
      .eq('id', body.id)
      .select()
      .single();
    
    if (error) {
      console.error('[API] 학생 수정 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('[API] 학생 정보 수정 성공');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API] 학생 수정 중 예외 발생:', error?.message || error);
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
      console.log('[API] 학생 삭제 실패: ID 없음');
      return NextResponse.json(
        { error: '학생 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    console.log(`[API] 학생 삭제 시도: ${id}`);
    const supabase = createServiceClient();
    
    // 학생 삭제
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('[API] 학생 삭제 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('[API] 학생 삭제 성공');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API] 학생 삭제 중 예외 발생:', error?.message || error);
    return NextResponse.json(
      { error: '학생을 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 