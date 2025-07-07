-- Cards 테이블에서 category 컬럼 제거
ALTER TABLE public.cards DROP COLUMN IF EXISTS category;

-- category 인덱스 제거
DROP INDEX IF EXISTS idx_cards_category; 