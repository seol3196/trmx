# ClickNote 데이터베이스 스키마

## 개요

이 문서는 ClickNote 애플리케이션의 데이터베이스 스키마 구조를 설명합니다. 스키마는 학생 관찰 내용을 효율적으로 기록, 조회, 관리하기 위해 설계되었습니다.

## 테이블 구조

### 1. users

사용자(교사) 정보를 저장하는 테이블입니다.

| 컬럼명 | 타입 | 설명 |
|-------|------|------|
| id | UUID | 기본키, 사용자 고유 식별자 |
| email | TEXT | 사용자 이메일 (유니크) |
| name | TEXT | 사용자 이름 |
| avatar_url | TEXT | 프로필 이미지 URL |
| role | TEXT | 사용자 역할 (기본값: 'teacher') |
| created_at | TIMESTAMPTZ | 생성 일시 |
| updated_at | TIMESTAMPTZ | 수정 일시 |

### 2. classes

학급 정보를 저장하는 테이블입니다.

| 컬럼명 | 타입 | 설명 |
|-------|------|------|
| id | UUID | 기본키, 학급 고유 식별자 |
| name | TEXT | 학급명 |
| school_year | INT | 학년도 |
| grade | INT | 학년 |
| teacher_id | UUID | 담임 교사 ID (외래키: users) |
| created_at | TIMESTAMPTZ | 생성 일시 |
| updated_at | TIMESTAMPTZ | 수정 일시 |

### 3. students

학생 정보를 저장하는 테이블입니다.

| 컬럼명 | 타입 | 설명 |
|-------|------|------|
| id | UUID | 기본키, 학생 고유 식별자 |
| class_id | UUID | 학급 ID (외래키: classes) |
| student_number | INT | 학생 번호 |
| name | TEXT | 학생 이름 |
| created_at | TIMESTAMPTZ | 생성 일시 |
| updated_at | TIMESTAMPTZ | 수정 일시 |

### 4. cards

관찰 내용 카드 템플릿을 저장하는 테이블입니다.

| 컬럼명 | 타입 | 설명 |
|-------|------|------|
| id | UUID | 기본키, 카드 고유 식별자 |
| user_id | UUID | 생성한 사용자 ID (외래키: users) |
| title | TEXT | 카드 제목 |
| description | TEXT | 카드 설명 |
| category | TEXT | 카드 카테고리 |
| weight | SMALLINT | 가중치 |
| color | TEXT | 카드 색상 |
| icon | TEXT | 카드 아이콘 |
| created_at | TIMESTAMPTZ | 생성 일시 |
| updated_at | TIMESTAMPTZ | 수정 일시 |

### 5. notes

학생 관찰 기록을 저장하는 테이블입니다.

| 컬럼명 | 타입 | 설명 |
|-------|------|------|
| id | UUID | 기본키, 기록 고유 식별자 |
| student_id | UUID | 학생 ID (외래키: students) |
| card_id | UUID | 카드 ID (외래키: cards) |
| content | TEXT | 관찰 내용 |
| recorded_date | DATE | 관찰 날짜 |
| created_by | UUID | 작성자 ID (외래키: users) |
| created_at | TIMESTAMPTZ | 생성 일시 |
| updated_at | TIMESTAMPTZ | 수정 일시 |

### 6. notes_history

기록 변경 이력을 저장하는 테이블입니다.

| 컬럼명 | 타입 | 설명 |
|-------|------|------|
| id | UUID | 기본키, 이력 고유 식별자 |
| note_id | UUID | 기록 ID (외래키: notes) |
| previous_content | TEXT | 이전 내용 |
| new_content | TEXT | 변경된 내용 |
| diff | JSONB | 변경 내용 차이(diff) |
| changed_by | UUID | 변경한 사용자 ID (외래키: users) |
| changed_at | TIMESTAMPTZ | 변경 일시 |

## 관계 구조

```
users (1) --- (N) classes
classes (1) --- (N) students
students (1) --- (N) notes
users (1) --- (N) cards
cards (1) --- (N) notes
notes (1) --- (N) notes_history
users (1) --- (N) notes (as creator)
users (1) --- (N) notes_history (as changer)
```

## 인덱스

성능 최적화를 위해 다음 인덱스가 생성되었습니다:

- `idx_classes_teacher_id`: 교사별 학급 조회 최적화
- `idx_classes_school_year`: 학년도별 학급 조회 최적화
- `idx_students_class_id`: 학급별 학생 조회 최적화
- `idx_notes_student_id`: 학생별 관찰 기록 조회 최적화
- `idx_notes_recorded_date`: 날짜별 관찰 기록 조회 최적화
- `idx_notes_card_id`: 카드별 관찰 기록 조회 최적화
- `idx_notes_created_by`: 작성자별 관찰 기록 조회 최적화
- `idx_cards_user_id`: 사용자별 카드 조회 최적화
- `idx_cards_category`: 카테고리별 카드 조회 최적화
- `idx_notes_history_note_id`: 기록별 변경 이력 조회 최적화
- `idx_notes_history_changed_by`: 사용자별 변경 이력 조회 최적화
- `idx_notes_history_changed_at`: 시간별 변경 이력 조회 최적화

## 보안 정책

모든 테이블에 행 수준 보안(Row Level Security)이 적용되었습니다:

- `users`: 자신의 데이터만 읽고 수정 가능
- `classes`: 자신이 생성한 학급만 CRUD 가능
- `students`: 자신의 학급에 속한 학생만 CRUD 가능
- `cards`: 자신이 생성한 카드만 CRUD 가능
- `notes`: 자신의 학급 학생에 대한 기록만 CRUD 가능
- `notes_history`: 자신의 학급 학생 기록의 이력만 조회 가능

## 자동 기록 이력 관리

관찰 내용이 수정되거나 삭제될 때 자동으로 이력을 기록하는 트리거가 설정되었습니다:

- `on_note_update`: 기록이 수정될 때 이력 생성
- `on_note_delete`: 기록이 삭제될 때 이력 생성

이를 통해 모든 변경사항을 추적하고 필요 시 이전 버전으로 복원할 수 있습니다. 