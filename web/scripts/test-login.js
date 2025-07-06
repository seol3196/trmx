const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = 'https://kbnskzykzornnvjoknry.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtibnNrenlrem9ybm52am9rbnJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MjM1NzEsImV4cCI6MjA2NzI5OTU3MX0.nhqiud7ulbcwkc76vEQ9sdKEGFqnP4N__rO-eeMfQXs';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 로그인 테스트 함수
async function testLogin() {
  try {
    const email = process.argv[2] || 'admin@clicknote.com';
    const password = process.argv[3] || '123456';
    
    console.log(`로그인 시도: ${email}`);
    
    // 이메일과 비밀번호로 로그인
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error('로그인 에러:', error);
      return;
    }

    console.log('로그인 성공!');
    console.log('사용자 정보:', data.user);
    console.log('세션 정보:', data.session);
  } catch (err) {
    console.error('예상치 못한 에러:', err);
  }
}

// 스크립트 실행
testLogin(); 