# ClickNote - 학생 관찰 기록 앱

교사가 클릭 또는 터치로 학생 관찰 내용을 간편하게 기록할 수 있는 애플리케이션입니다.

## 프로젝트 개요

ClickNote는 담임 교사가 학생 관찰 내용을 신속하고 편리하게 기록하고 관리할 수 있는 도구입니다. 카드 형식의 간편한 인터페이스와 AI 추천 기능을 통해 업무 효율성을 높이고, 학생 관찰 데이터의 수집과 분석을 용이하게 합니다.

### 주요 기능

- **카드형 빠른 기록**: 미리 설정된 카드를 클릭하여 3클릭 이하로 관찰 내용 기록
- **AI 문구 추천 및 요약**: 입력된 키워드와 과거 기록을 기반으로 문장 자동 생성
- **버전 관리**: 모든 수정 및 삭제 이력을 자동으로 관리하고 차이(diff) 표시
- **검색 및 통계**: 학생/기간/카테고리별 필터링 및 그래프 시각화 제공

## 기술 스택

- **프론트엔드**: React, React Native
- **백엔드**: Supabase (PostgreSQL, Auth, Storage)
- **AI 서비스**: OpenAI GPT API 또는 오픈소스 대안
- **개발 도구**: TypeScript, ESLint, Prettier, Husky

## 프로젝트 구조

```
clicknote/
├── web/                # 웹 애플리케이션
├── mobile/             # 모바일 애플리케이션 (React Native)
├── packages/           # 공유 패키지
│   ├── ui/             # 공통 UI 컴포넌트
│   ├── types/          # 타입 정의
│   └── utils/          # 유틸리티 함수
└── infra/              # 인프라 관련 코드
```

## 개발 환경 설정

### 필수 요구사항

- Node.js 18.0.0 이상
- Yarn 패키지 매니저

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/yourusername/clicknote.git
cd clicknote

# 의존성 설치
yarn install

# 웹 애플리케이션 개발 서버 실행
yarn dev:web

# 모바일 애플리케이션 개발 서버 실행
yarn dev:mobile
```

## 개발 가이드라인

- 커밋 메시지는 [Conventional Commits](https://www.conventionalcommits.org/) 규칙을 따릅니다.
- 코드 작성 전 ESLint와 Prettier 설정을 확인하세요.
- 기능 개발은 항상 새로운 브랜치에서 진행합니다.

## 라이센스

이 프로젝트는 개인 용도로 개발되었습니다. 