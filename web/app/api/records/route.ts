import { NextResponse } from 'next/server';
import { createServerClient } from '../../../lib/supabase';

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
    
    // 테이블이 존재하는지 확인하고 없으면 생성
    try {
      // 테이블 존재 여부 확인
      const { error: checkError } = await supabase.from('card_records').select('id').limit(1);
      
      if (checkError && checkError.code === '42P01') { // 테이블이 존재하지 않음
        console.log('card_records 테이블이 존재하지 않습니다. 생성합니다...');
        
        // 테이블 생성 요청 - 서버 측에서 처리하도록 API 호출
        try {
          const response = await fetch('/api/setup-db', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'create_card_records_table' }),
          });
          
          if (!response.ok) {
            console.error('테이블 생성 API 오류:', await response.text());
          } else {
            console.log('card_records 테이블 생성 요청 완료');
          }
        } catch (apiError) {
          console.error('테이블 생성 API 호출 오류:', apiError);
        }
      }
    } catch (tableError) {
      console.error('테이블 확인/생성 오류:', tableError);
    }
    
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