// Supabase 클라이언트 테스트 스크립트
const { createBrowserClient, createServerClient } = require('./lib/supabase.ts');

console.log('🧪 Supabase 클라이언트 테스트 시작...');

try {
  // 환경 변수 확인
  console.log('📋 환경 변수 확인:');
  console.log('- SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 설정됨' : '❌ 없음');
  console.log('- SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 없음');
  
  // 브라우저 클라이언트 테스트
  console.log('\n🌐 브라우저 클라이언트 테스트:');
  const browserClient = createBrowserClient();
  console.log('- 클라이언트 생성:', browserClient ? '✅ 성공' : '❌ 실패');
  console.log('- Auth 설정:', browserClient.auth ? '✅ 있음' : '❌ 없음');
  
  // 서버 클라이언트 테스트
  console.log('\n🖥️  서버 클라이언트 테스트:');
  const serverClient = createServerClient();
  console.log('- 클라이언트 생성:', serverClient ? '✅ 성공' : '❌ 실패');
  console.log('- Auth 설정:', serverClient.auth ? '✅ 있음' : '❌ 없음');
  
  console.log('\n✅ 모든 테스트 완료!');
  
} catch (error) {
  console.error('❌ 테스트 실패:', error.message);
}