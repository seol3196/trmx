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

// card_records 테이블 생성 함수
async function createCardRecordsTable() {
  const supabase = createServerClient();
  
  try {
    // uuid-ossp 확장 활성화
    await supabase.rpc('create_extension', { extension_name: 'uuid-ossp' });
    
    // 테이블 생성
    await supabase.rpc('run_sql', { 
      sql: `
        CREATE TABLE IF NOT EXISTS public.card_records (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          student_id UUID NOT NULL,
          card_id UUID,
          subject TEXT,
          memo TEXT NOT NULL,
          recorded_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          user_id UUID NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        -- 외래 키 제약 조건 추가
        DO $$
        BEGIN
          BEGIN
            ALTER TABLE public.card_records 
            ADD CONSTRAINT card_records_student_id_fkey 
            FOREIGN KEY (student_id) REFERENCES public.students(id);
          EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'Foreign key card_records_student_id_fkey already exists';
          END;
          
          BEGIN
            ALTER TABLE public.card_records 
            ADD CONSTRAINT card_records_card_id_fkey 
            FOREIGN KEY (card_id) REFERENCES public.cards(id);
          EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'Foreign key card_records_card_id_fkey already exists';
          END;
          
          BEGIN
            ALTER TABLE public.card_records 
            ADD CONSTRAINT card_records_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES public.users(id);
          EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'Foreign key card_records_user_id_fkey already exists';
          END;
        END;
        $$;
      `
    });
    
    return true;
  } catch (error) {
    console.error('테이블 생성 오류:', error);
    return false;
  }
}

// POST 요청 처리
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;
    
    if (action === 'create_card_records_table') {
      const success = await createCardRecordsTable();
      
      if (success) {
        return NextResponse.json({ success: true, message: 'card_records 테이블이 생성되었습니다.' });
      } else {
        return NextResponse.json(
          { error: '테이블을 생성할 수 없습니다.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: '알 수 없는 액션입니다.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('DB 설정 오류:', error);
    return NextResponse.json(
      { error: 'DB 설정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 