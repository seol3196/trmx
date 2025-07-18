import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 서비스 롤 키를 사용하는 클라이언트 생성 (RLS 우회)
const createServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kbnskzykzornnvjoknry.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtibnNrenlrem9ybm52am9rbnJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTcyMzU3MSwiZXhwIjoyMDY3Mjk5NTcxfQ.qov51H7Hdx73j47kGQwaZRPakePSu-6sGFaVPwEArSo';
  
  console.log('[API] 서비스 롤 키로 클라이언트 생성 (RLS 우회)');
  return createClient(supabaseUrl, supabaseServiceKey);
};

// GET 요청 처리 - 모든 카드 가져오기
export async function GET() {
  try {
    const supabase = createServiceClient();
    
    // 카드는 모든 사용자가 공유하므로 user_id 필터링을 하지 않음
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .order('subject');
    
    if (error) {
      console.error('[API] 카드 데이터 로드 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] 서버 오류:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST 요청 처리 - 새 카드 생성
export async function POST(request: Request) {
  try {
    const cardData = await request.json();
    
    // 필수 필드 검증
    if (!cardData.title || !cardData.description) {
      return NextResponse.json({ error: '제목과 설명은 필수 입력 항목입니다.' }, { status: 400 });
    }
    
    // id 필드가 비어있으면 제거하여 Supabase가 자동으로 UUID를 생성하도록 함
    if (!cardData.id) {
      delete cardData.id;
    }
    
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('cards')
      .insert(cardData)
      .select();
    
    if (error) {
      console.error('[API] 카드 생성 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('[API] 서버 오류:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT 요청 처리 - 카드 수정
export async function PUT(request: Request) {
  try {
    const cardData = await request.json();
    
    // 필수 필드 검증
    if (!cardData.id || !cardData.title || !cardData.description) {
      return NextResponse.json({ error: '카드 ID, 제목, 설명은 필수 입력 항목입니다.' }, { status: 400 });
    }
    
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('cards')
      .update({
        title: cardData.title,
        description: cardData.description,
        subject: cardData.subject,
        color: cardData.color,
        icon: cardData.icon
      })
      .eq('id', cardData.id)
      .select();
    
    if (error) {
      console.error('[API] 카드 수정 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('[API] 서버 오류:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE 요청 처리 - 카드 삭제
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: '카드 ID가 필요합니다.' }, { status: 400 });
    }
    
    const supabase = createServiceClient();
    
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('[API] 카드 삭제 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] 기록 삭제 오류:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 