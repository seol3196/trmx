const fetch = require('node-fetch');

// Supabase 프로젝트 정보
const PROJECT_REF = 'kbnskzykzornnvjoknry';
const ACCESS_TOKEN = 'sbp_f64ec34cd1b9a18c903fac20ef5cbfd463b36228';

// 이메일 확인 함수
async function confirmEmailAdmin(email) {
  try {
    console.log(`이메일 확인 시도: ${email}`);
    
    // 1. 사용자 ID 조회
    const usersResponse = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/auth/users?email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const usersData = await usersResponse.json();
    
    if (!usersResponse.ok || !usersData.users || usersData.users.length === 0) {
      console.error('사용자 조회 실패:', usersData);
      return;
    }
    
    const userId = usersData.users[0].id;
    console.log(`사용자 ID 조회 성공: ${userId}`);
    
    // 2. 이메일 확인 상태 업데이트
    const updateResponse = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/auth/users/${userId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email_confirm: true,
          app_metadata: {
            email_confirmed_at: new Date().toISOString()
          }
        })
      }
    );
    
    const updateData = await updateResponse.json();
    
    if (!updateResponse.ok) {
      console.error('이메일 확인 업데이트 실패:', updateData);
      return;
    }
    
    console.log('이메일 확인 완료!');
    console.log(`이메일: ${email}`);
    console.log('이제 로그인할 수 있습니다.');
  } catch (err) {
    console.error('예상치 못한 에러:', err);
  }
}

// 스크립트 실행
const emailToConfirm = process.argv[2];
if (!emailToConfirm) {
  console.error('사용법: node confirm-email-admin.js <이메일>');
  process.exit(1);
}

confirmEmailAdmin(emailToConfirm); 