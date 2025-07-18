import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from './lib/supabase';

export async function middleware(request: NextRequest) {
  console.log('미들웨어 실행:', request.nextUrl.pathname);
  
  // 콜백 페이지인지 확인
  const isCallbackRoute = request.nextUrl.pathname.startsWith('/auth/callback');
  
  // 콜백 페이지는 항상 접근 허용
  if (isCallbackRoute) {
    console.log('OAuth 콜백 페이지 접근 허용');
    return NextResponse.next();
  }
  
  // 응답 객체 생성
  const response = NextResponse.next();
  
  try {
    // Supabase 미들웨어 클라이언트 생성
    const supabase = createMiddlewareClient({ req: request, res: response });
    
    // 세션 정보 가져오기
    const { data: { session }, error } = await supabase.auth.getSession();
    
    console.log('미들웨어 세션 확인:', {
      hasSession: !!session,
      user: session?.user?.email || 'none',
      error: error?.message || 'none'
    });
    
    // 인증 상태 확인
    const isAuthenticated = !!session;
    
    // 인증이 필요한 페이지들
    const protectedRoutes = ['/dashboard', '/students', '/cards'];
    const authRoutes = ['/auth/login', '/auth/signup'];
    
    // 현재 경로가 보호된 경로인지 확인
    const isProtectedRoute = protectedRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    );
    
    // 현재 경로가 인증 경로인지 확인
    const isAuthRoute = authRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    );

    // 인증된 사용자가 로그인 페이지에 접근하려는 경우
    if (isAuthenticated && isAuthRoute) {
      console.log('인증된 사용자 -> 대시보드로 리디렉트');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // 인증되지 않은 사용자가 보호된 페이지에 접근하려는 경우
    if (!isAuthenticated && isProtectedRoute) {
      console.log('미인증 사용자 -> 로그인 페이지로 리디렉트');
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // 그 외의 경우 정상 진행
    return response;
  } catch (error) {
    console.error('미들웨어 오류:', error);
    return response;
  }
}

export const config = {
  matcher: [
    // 보호된 라우트
    '/dashboard/:path*',
    '/students/:path*',
    '/cards/:path*',
    // 인증 페이지
    '/auth/login',
    '/auth/signup',
    // 콜백 페이지
    '/auth/callback',
    // 홈페이지
    '/'
  ],
};