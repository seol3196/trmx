import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ToastProvider } from '../components/toast';
import { AuthProvider } from '../components/auth-provider';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ClickNote',
  description: '교사를 위한 학생 관찰 기록 도구',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <title>ClickNote - 학생 관찰 기록</title>
        <meta name="description" content="교사를 위한 학생 관찰 기록 도구" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
        
        {/* 동기화 관리자 초기화 스크립트 */}
        <Script id="sync-manager-init" strategy="afterInteractive">
          {`
            try {
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                      console.log('Service Worker 등록 성공:', registration.scope);
                    })
                    .catch(error => {
                      console.error('Service Worker 등록 실패:', error);
                    });
                });
              }
            } catch (error) {
              console.error('Service Worker 초기화 오류:', error);
            }
          `}
        </Script>
      </body>
    </html>
  );
}