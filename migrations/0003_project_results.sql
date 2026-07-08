-- 클라이언트가 직접 생성한 AI 결과를 저장하기 위한 컬럼 추가
ALTER TABLE projects ADD COLUMN result_text TEXT;
ALTER TABLE projects ADD COLUMN result_json TEXT;
