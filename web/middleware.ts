import { NextResponse, type NextRequest } from 'next/server';

// 미들웨어를 간소화하여 인증 체크를 제거합니다
export async function middleware(request: NextRequest) {
  console.log('미들웨어 실행:', request.nextUrl.pathname);
  
  // 로그인 페이지로 접근하면 대시보드로 리다이렉트
  if (request.nextUrl.pathname.startsWith('/auth/login') || request.nextUrl.pathname.startsWith('/auth/signup')) {
    console.log('로그인 페이지 접근 -> 대시보드로 리다이렉트');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // 인증 페이지
    '/auth/login',
    '/auth/signup',
  ],
}; 