-- better-auth 1.6.23의 소셜 로그인(callback) 처리 코드가 account 레코드에
-- accessTokenExpiresAt / refreshTokenExpiresAt / scope 값을 저장하려 하는데
-- 0001 마이그레이션에는 이 컬럼들이 없었음 (실제 구글 로그인 시도 중 발견됨).
ALTER TABLE account ADD COLUMN accessTokenExpiresAt INTEGER;
ALTER TABLE account ADD COLUMN refreshTokenExpiresAt INTEGER;
ALTER TABLE account ADD COLUMN scope TEXT;
ALTER TABLE account ADD COLUMN password TEXT;
