const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = 'https://kbnskzykzornnvjoknry.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtibnNrenlrem9ybm52am9rbnJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MjM1NzEsImV4cCI6MjA2NzI5OTU3MX0.nhqiud7ulbcwkc76vEQ9sdKEGFqnP4N__rO-eeMfQXs';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 사용자 생성 함수
async function createUser() {
  try {
    // 1. 사용자 인증 생성
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'admin@clicknote.com',
      password: '123456',
      options: {
        data: {
          name: 'Admin',
          role: 'admin'
        }
      }
    });

    if (authError) {
      console.error('인증 생성 에러:', authError);
      return;
    }

    console.log('인증 생성 성공:', authData);

    // 2. 사용자 정보를 users 테이블에 저장
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: 'admin@clicknote.com',
            name: 'Admin',
            role: 'admin'
          }
        ]);

      if (profileError) {
        console.error('프로필 생성 에러:', profileError);
        return;
      }

      console.log('사용자 생성 완료!');
      console.log('이메일: admin@clicknote.com');
      console.log('비밀번호: 123456');
    }
  } catch (err) {
    console.error('예상치 못한 에러:', err);
  }
}

// 스크립트 실행
createUser(); 