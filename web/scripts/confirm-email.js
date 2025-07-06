const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = 'https://kbnskzykzornnvjoknry.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtibnNrenlrem9ybm52am9rbnJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MjM1NzEsImV4cCI6MjA2NzI5OTU3MX0.nhqiud7ulbcwkc76vEQ9sdKEGFqnP4N__rO-eeMfQXs';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 이메일 확인 함수
async function confirmEmail(email) {
  try {
    // 이메일과 비밀번호로 로그인
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: '123456',
    });

    if (signInError) {
      console.error('로그인 에러:', signInError);
      return;
    }

    console.log('로그인 성공:', signInData);

    // 사용자 정보 업데이트
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
      data: {
        email_verified: true
      }
    });

    if (updateError) {
      console.error('사용자 정보 업데이트 에러:', updateError);
      return;
    }

    console.log('사용자 정보 업데이트 성공:', updateData);
    console.log('이메일 확인 완료! 이제 로그인할 수 있습니다.');
    console.log('이메일:', email);
    console.log('비밀번호: 123456');
  } catch (err) {
    console.error('예상치 못한 에러:', err);
  }
}

// 스크립트 실행
const emailToConfirm = process.argv[2] || 'admin@clicknote.com';
console.log(`이메일 확인 시도: ${emailToConfirm}`);
confirmEmail(emailToConfirm); 