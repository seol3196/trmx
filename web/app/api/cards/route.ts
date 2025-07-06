import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase 서버 클라이언트 생성 (서비스 롤 사용)
const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kbnskzykzornnvjoknry.supabase.co';
  // 서비스 롤 키는 RLS를 우회할 수 있음
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtibnNrenlrem9ybm52am9rbnJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTcyMzU3MSwiZXhwIjoyMDY3Mjk5NTcxfQ.qov51H7Hdx73j47kGQwaZRPakePSu-6sGFaVPwEArSo';
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

// 유효한 사용자 ID 가져오기
async function getValidUserId() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .limit(1);
  
  if (error || !data || data.length === 0) {
    // 사용자가 없는 경우 새 사용자 생성
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({ name: 'Default User', email: 'default@example.com' })
      .select();
    
    if (createError || !newUser || newUser.length === 0) {
      throw new Error('유효한 사용자를 찾거나 생성할 수 없습니다.');
    }
    
    return newUser[0].id;
  }
  
  return data[0].id;
}

// GET 요청 처리 - 모든 카드 가져오기
export async function GET() {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .order('subject, category');
    
    if (error) {
      console.error('카드 데이터 로드 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('서버 오류:', error);
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
    
    // 유효한 사용자 ID 가져오기
    const userId = await getValidUserId();
    
    // user_id 필드 추가
    const cardWithUserId = {
      ...cardData,
      user_id: userId
    };
    
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('cards')
      .insert(cardWithUserId)
      .select();
    
    if (error) {
      console.error('카드 생성 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('서버 오류:', error);
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
    
    // 유효한 사용자 ID 가져오기
    const userId = await getValidUserId();
    
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('cards')
      .update({
        title: cardData.title,
        description: cardData.description,
        subject: cardData.subject,
        category: cardData.category,
        color: cardData.color,
        icon: cardData.icon,
        user_id: userId
      })
      .eq('id', cardData.id)
      .select();
    
    if (error) {
      console.error('카드 수정 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('서버 오류:', error);
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
    
    const supabase = createServerClient();
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('카드 삭제 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 