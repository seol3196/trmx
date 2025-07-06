const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = 'https://kbnskzykzornnvjoknry.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtibnNrenlrem9ybm52am9rbnJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MjM1NzEsImV4cCI6MjA2NzI5OTU3MX0.nhqiud7ulbcwkc76vEQ9sdKEGFqnP4N__rO-eeMfQXs';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 사용자 생성 함수
async function insertUserWithSQL() {
  try {
    // 1. 사용자 인증 생성 (이미 생성됨)
    console.log('이미 생성된 사용자 정보:');
    console.log('이메일: admin@clicknote.com');
    console.log('비밀번호: 123456');

    // 2. RLS 우회하여 직접 SQL로 users 테이블에 데이터 삽입
    const { data, error } = await supabase.rpc('insert_user_admin', {
      user_id: 'f4f57d97-a05f-4dcd-982e-65be3344d198', // 이전에 생성된 사용자 ID
      user_email: 'admin@clicknote.com',
      user_name: 'Admin',
      user_role: 'admin'
    });

    if (error) {
      console.error('SQL 실행 에러:', error);
      
      // 대체 방법: 직접 SQL 쿼리 실행
      console.log('직접 SQL 쿼리 실행 시도...');
      
      const { data: sqlData, error: sqlError } = await supabase.rpc('execute_sql', {
        sql_query: `
          INSERT INTO public.users (id, email, name, role)
          VALUES ('f4f57d97-a05f-4dcd-982e-65be3344d198', 'admin@clicknote.com', 'Admin', 'admin')
          ON CONFLICT (id) DO UPDATE
          SET email = EXCLUDED.email, name = EXCLUDED.name, role = EXCLUDED.role;
        `
      });
      
      if (sqlError) {
        console.error('직접 SQL 쿼리 실행 에러:', sqlError);
        return;
      }
      
      console.log('직접 SQL 쿼리 실행 성공:', sqlData);
      return;
    }

    console.log('사용자 정보 삽입 성공:', data);
  } catch (err) {
    console.error('예상치 못한 에러:', err);
  }
}

// 스크립트 실행
insertUserWithSQL(); 