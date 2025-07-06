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

// GET 요청 처리 - 기록 목록 가져오기
export async function GET() {
  try {
    const supabase = createServerClient();
    
    // 기록 데이터 가져오기
    const { data: records, error } = await supabase
      .from('card_records')
      .select('*')
      .order('recorded_date', { ascending: false });
    
    if (error) {
      console.error('기록 데이터 로드 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // 클라이언트 측 형식으로 변환
    const formattedRecords = records ? records.map(record => ({
      id: record.id,
      studentId: record.student_id,
      cardId: record.card_id,
      subject: record.subject,
      memo: record.memo,
      recordedDate: record.recorded_date,
      serverSynced: true
    })) : [];
    
    return NextResponse.json(formattedRecords);
  } catch (error) {
    console.error('기록 데이터 로드 오류:', error);
    return NextResponse.json(
      { error: '기록 데이터를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST 요청 처리 - 새 기록 생성
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = createServerClient();
    const userId = await getValidUserId();
    
    // 클라이언트 형식을 서버 형식으로 변환
    const serverRecord = {
      student_id: body.studentId,
      card_id: body.cardId,
      subject: body.subject,
      memo: body.memo,
      recorded_date: body.recordedDate,
      user_id: userId
    };
    
    // 새 기록 생성
    const { data, error } = await supabase
      .from('card_records')
      .insert(serverRecord)
      .select()
      .single();
    
    if (error) {
      console.error('기록 생성 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // 서버 응답을 클라이언트 형식으로 변환
    const formattedRecord = {
      id: data.id,
      studentId: data.student_id,
      cardId: data.card_id,
      subject: data.subject,
      memo: data.memo,
      recordedDate: data.recorded_date,
      serverSynced: true
    };
    
    return NextResponse.json(formattedRecord);
  } catch (error) {
    console.error('기록 생성 오류:', error);
    return NextResponse.json(
      { error: '기록을 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE 요청 처리 - 기록 삭제
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: '기록 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    const supabase = createServerClient();
    
    // 기록 삭제
    const { error } = await supabase
      .from('card_records')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('기록 삭제 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('기록 삭제 오류:', error);
    return NextResponse.json(
      { error: '기록을 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 