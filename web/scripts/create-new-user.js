const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = 'https://kbnskzykzornnvjoknry.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtibnNrenlrem9ybm52am9rbnJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MjM1NzEsImV4cCI6MjA2NzI5OTU3MX0.nhqiud7ulbcwkc76vEQ9sdKEGFqnP4N__rO-eeMfQXs';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 새 사용자 생성 함수
async function createNewUser() {
  try {
    // 새 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'teacher@clicknote.com',
      password: 'teacher123',
      options: {
        data: {
          name: '김선생',
          role: 'teacher'
        }
      }
    });

    if (authError) {
      console.error('인증 생성 에러:', authError);
      return;
    }

    console.log('인증 생성 성공:', authData);
    console.log('새 계정이 생성되었습니다!');
    console.log('이메일: teacher@clicknote.com');
    console.log('비밀번호: teacher123');

    // 로그인 시도
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'teacher@clicknote.com',
      password: 'teacher123',
    });

    if (signInError) {
      console.error('로그인 에러:', signInError);
      return;
    }

    console.log('로그인 성공:', signInData);
    console.log('로그인이 성공적으로 완료되었습니다!');
  } catch (err) {
    console.error('예상치 못한 에러:', err);
  }
}

// 스크립트 실행
createNewUser(); 