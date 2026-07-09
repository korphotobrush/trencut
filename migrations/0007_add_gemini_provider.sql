-- 개인 API 키로 Google Gemini(무료 티어)를 OpenAI 대신 쓸 수 있게 provider 추가.
-- SQLite는 CHECK 제약을 직접 못 고치므로 테이블을 재생성한다 (0006과 동일한 패턴).
CREATE TABLE api_keys_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('naver_open','naver_searchad','openai','gemini')),
  encrypted_value TEXT NOT NULL,
  is_valid INTEGER NOT NULL DEFAULT 1,
  last_checked_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  UNIQUE(user_id, provider)
);
INSERT INTO api_keys_new SELECT * FROM api_keys;
DROP TABLE api_keys;
ALTER TABLE api_keys_new RENAME TO api_keys;
