import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 서비스 롤 키를 사용하는 클라이언트 생성 (RLS 우회)
const createServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kbnskzykzornnvjoknry.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtibnNrenlrem9ybm52am9rbnJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTcyMzU3MSwiZXhwIjoyMDY3Mjk5NTcxfQ.qov51H7Hdx73j47kGQwaZRPakePSu-6sGFaVPwEArSo';
  
  console.log('[API] 서비스 롤 키로 클라이언트 생성 (RLS 우회)');
  return createClient(supabaseUrl, supabaseServiceKey);
};

// GET 요청 처리 - 기록 목록 가져오기
export async function GET(request: Request) {
  try {
    console.log('[API] 기록 데이터 요청 시작');
    const supabase = createServiceClient();
    
    // URL 파라미터에서 사용자 ID 가져오기
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    console.log('[API] 기록 요청 - 사용자 ID:', userId);
    
    // 기록 데이터 가져오기
    let query = supabase
      .from('card_records')
      .select('*');
    
    // 사용자 ID로 필터링 (URL 파라미터에서 userId가 제공된 경우)
    if (userId) {
      console.log(`[API] 사용자 ID로 기록 필터링: ${userId}`);
      query = query.eq('user_id', userId);
    }
    
    // 날짜 기준 내림차순 정렬
    const { data: records, error } = await query.order('recorded_date', { ascending: false });
    
    if (error) {
      console.error('[API] 기록 데이터 로드 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log(`[API] 기록 데이터 ${records ? records.length : 0}개 로드 성공`);
    
    // 디버깅을 위한 추가 로그
    if (records && records.length > 0) {
      console.log('[API] 첫 번째 기록 데이터 예시:', {
        id: records[0].id,
        student_id: records[0].student_id,
        user_id: records[0].user_id,
        subject: records[0].subject
      });
    } else {
      console.log('[API] 필터링된 기록 데이터가 없습니다.');
      if (userId) {
        console.log(`[API] 사용자 ID ${userId}에 해당하는 기록이 없는지 확인이 필요합니다.`);
      }
    }
    
    // 클라이언트 측 형식으로 변환
    const formattedRecords = records ? records.map(record => ({
      id: record.id,
      studentId: record.student_id,
      cardId: record.card_id,
      subject: record.subject,
      memo: record.memo,
      recordedDate: record.recorded_date,
      serverSynced: true,
      userId: record.user_id // 클라이언트에 사용자 ID도 전달
    })) : [];
    
    return NextResponse.json(formattedRecords);
  } catch (error) {
    console.error('[API] 기록 데이터 로드 오류:', error);
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
    const supabase = createServiceClient();
    
    console.log('[API] 새 기록 생성 요청 받음:', body);
    
    // 클라이언트에서 전달된 사용자 ID 확인
    if (!body.userId) {
      console.error('[API] 사용자 ID가 제공되지 않았습니다.');
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 클라이언트 형식을 서버 형식으로 변환
    const serverRecord = {
      student_id: body.studentId,
      card_id: body.cardId,
      subject: body.subject,
      memo: body.memo,
      recorded_date: body.recordedDate,
      user_id: body.userId // 클라이언트에서 전달된 사용자 ID 사용
    };
    
    console.log('[API] 새 기록 생성 시도:', serverRecord);
    
    // 새 기록 생성
    const { data, error } = await supabase
      .from('card_records')
      .insert(serverRecord)
      .select()
      .single();
    
    if (error) {
      console.error('[API] 기록 생성 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('[API] 기록 생성 성공:', data);
    
    // 서버 응답을 클라이언트 형식으로 변환
    const formattedRecord = {
      id: data.id,
      studentId: data.student_id,
      cardId: data.card_id,
      subject: data.subject,
      memo: data.memo,
      recordedDate: data.recorded_date,
      userId: data.user_id, // 사용자 ID도 반환
      serverSynced: true
    };
    
    return NextResponse.json(formattedRecord);
  } catch (error) {
    console.error('[API] 기록 생성 오류:', error);
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
    
    console.log(`[API] 기록 삭제 시도: ${id}`);
    
    const supabase = createServiceClient();
    
    // 기록 삭제
    const { error } = await supabase
      .from('card_records')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('[API] 기록 삭제 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log(`[API] 기록 삭제 성공: ${id}`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] 기록 삭제 오류:', error);
    return NextResponse.json(
      { error: '기록을 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 