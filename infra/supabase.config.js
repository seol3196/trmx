/**
 * Supabase 설정 파일
 * 
 * 이 파일은 Supabase 설정을 관리합니다.
 * 환경별 설정 값을 정의하고 로드합니다.
 */

// 실제 사용 시 .env 파일에서 로드하여 사용하세요.
const config = {
  development: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key',
  },
  test: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-test-anon-key',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-test-service-role-key',
  },
  production: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
};

// 현재 환경 설정 내보내기
const environment = process.env.NODE_ENV || 'development';
export default config[environment];

/**
 * 마이그레이션 실행 스크립트 (CLI)
 * 
 * 사용 방법:
 * 1. 마이그레이션 적용: node supabase.config.js migrate
 * 2. 마이그레이션 롤백: node supabase.config.js rollback
 * 
 * 참고: 실제 마이그레이션에는 Supabase CLI나 
 * 더 정교한 마이그레이션 도구를 사용하는 것이 권장됩니다.
 */
if (require.main === module) {
  const { createClient } = require('@supabase/supabase-js');
  const fs = require('fs');
  const path = require('path');
  
  const action = process.argv[2];
  
  // Supabase 클라이언트 생성
  const supabase = createClient(
    config.development.url,
    config.development.serviceRoleKey
  );
  
  // 마이그레이션 디렉토리 경로
  const migrationsDir = path.join(__dirname, 'migrations');
  
  // 마이그레이션 실행 함수
  async function runMigration() {
    try {
      const sqlFile = path.join(migrationsDir, '00001_init_schema.sql');
      const sql = fs.readFileSync(sqlFile, 'utf8');
      
      console.log('Running migration...');
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.error('Migration failed:', error);
      } else {
        console.log('Migration successful!');
      }
    } catch (err) {
      console.error('Error running migration:', err);
    }
  }
  
  // 롤백 실행 함수
  async function runRollback() {
    try {
      const sqlFile = path.join(migrationsDir, '00001_init_schema_rollback.sql');
      const sql = fs.readFileSync(sqlFile, 'utf8');
      
      console.log('Running rollback...');
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.error('Rollback failed:', error);
      } else {
        console.log('Rollback successful!');
      }
    } catch (err) {
      console.error('Error running rollback:', err);
    }
  }
  
  // 명령어에 따라 실행
  if (action === 'migrate') {
    runMigration();
  } else if (action === 'rollback') {
    runRollback();
  } else {
    console.log('Invalid command. Use "migrate" or "rollback"');
  }
} 