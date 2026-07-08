-- 키워드 검색 결과를 소스별로 나누지 않고 한 번에 합쳐서 캐싱하도록 바꾸면서
-- source='combined' 값을 쓰게 됐는데, 기존 CHECK 제약이 naver_open/naver_searchad만
-- 허용해서 막혀 있었음. SQLite는 CHECK 제약을 직접 못 고치므로 테이블을 재생성한다.
CREATE TABLE keyword_cache_new (
  keyword TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('naver_open','naver_searchad','combined')),
  result_json TEXT NOT NULL,
  cached_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  PRIMARY KEY (keyword, source)
);
INSERT INTO keyword_cache_new SELECT * FROM keyword_cache;
DROP TABLE keyword_cache;
ALTER TABLE keyword_cache_new RENAME TO keyword_cache;
CREATE INDEX idx_keyword_cache_cached_at ON keyword_cache(cached_at);
