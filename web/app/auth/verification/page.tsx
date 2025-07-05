'use client';

import Link from 'next/link';

export default function Verification() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold">ClickNote</h1>
          <h2 className="mt-2 text-xl font-semibold">이메일 확인</h2>
        </div>

        <div className="mt-6">
          <div className="rounded-md bg-blue-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  이메일 확인이 필요합니다
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    가입해주셔서 감사합니다! 입력하신 이메일 주소로 확인 링크를 보내드렸습니다.
                    링크를 클릭하여 계정 등록을 완료해 주세요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            이메일을 받지 못하셨나요?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              로그인 페이지로 돌아가기
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 