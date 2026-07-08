-- 트랜컷 앱 스키마
-- user_id는 0001_better_auth.sql의 user(id)를 그대로 참조 (별도 users 테이블 없음)
-- 유연한 광고 배너 구조: slot_group + sort_order로 그룹당 배너 수 제한 없이 확장 가능

CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('naver_open','naver_searchad','openai')),
  encrypted_value TEXT NOT NULL,
  is_valid INTEGER NOT NULL DEFAULT 1,
  last_checked_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  UNIQUE(user_id, provider)
);

CREATE TABLE keyword_cache (
  keyword TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('naver_open','naver_searchad')),
  result_json TEXT NOT NULL,
  cached_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  PRIMARY KEY (keyword, source)
);

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  title TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('auto','advanced')),
  advanced_prompt TEXT,
  output_format TEXT NOT NULL CHECK (output_format IN ('card','text','both')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','generating','done','failed')),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE TABLE project_images (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  r2_key TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE daily_usage (
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  usage_date TEXT NOT NULL,
  generation_count INTEGER NOT NULL DEFAULT 0,
  keyword_search_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, usage_date)
);

-- 광고 배너: slot_group으로 그룹화, 그룹당 배너 수는 애플리케이션/관리자 화면에서 자유롭게 추가·삭제
-- slot_group 예: 'sidebar' (우측), 'bottom' (하단 AdFit), 'floating_left' (좌측 플로팅)
CREATE TABLE ad_banners (
  id TEXT PRIMARY KEY,
  slot_group TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  r2_key TEXT,
  link_url TEXT,
  internal_note TEXT,
  is_active INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE INDEX idx_keyword_cache_cached_at ON keyword_cache(cached_at);
CREATE INDEX idx_projects_user ON projects(user_id, created_at);
CREATE INDEX idx_ad_banners_group ON ad_banners(slot_group, sort_order);
