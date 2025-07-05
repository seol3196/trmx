export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-6">ClickNote</h1>
        <p className="text-xl mb-8">교사를 위한 학생 관찰 기록 앱</p>
        <div className="flex space-x-4">
          <a
            href="/auth/login"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            로그인
          </a>
          <a
            href="/auth/signup"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            회원가입
          </a>
        </div>
      </div>
    </main>
  );
} 