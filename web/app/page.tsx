import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/dashboard');
  
  // 이 부분은 실행되지 않지만 타입 체크를 위해 필요합니다
  return null;
} 