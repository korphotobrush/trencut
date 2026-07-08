-- better-auth 1.6.23가 verification 레코드 갱신 시 updatedAt 컬럼을 요구하는데
-- 0001 마이그레이션에서 이 컬럼이 누락되어 있었음 (실제 로그인 시도 중 발견됨).
ALTER TABLE verification ADD COLUMN updatedAt INTEGER;
