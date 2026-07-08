# 트랜컷 (trancut)

키워드 트렌드 검색 + 이미지 업로드 → AI 한글 상세페이지 생성 반자동 툴.
Next.js 15 + Cloudflare Workers (OpenNext) + D1 + R2 + KV.

## 인증 / 관리자

- 로그인은 Better Auth + Google OAuth (`src/lib/auth.ts`)
- **관리자는 `korphotobrush@gmail.com` 한 계정만 허용** (`src/lib/admin.ts`의
  `ADMIN_EMAILS` 배열). 관리자를 추가하려면 이 배열에 이메일만 더하면 됨.
- `/admin` 페이지와 `/api/ad-banners`의 POST는 관리자 이메일이 아니면 접근 거부됨.

## 배포 전 반드시 확인할 것

1. `.dev.vars` 생성 (`.dev.vars.example` 참고) 후 `ENCRYPTION_KEY`, `BETTER_AUTH_SECRET`,
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 실제 값 채우기 — git에 커밋하지 않음
2. `wrangler.toml`의 `database_id`, KV `id`를 본인 Cloudflare 계정 값으로 교체
3. (확인됨) `api.openai.com`은 브라우저 fetch 직접 호출을 CORS로 차단합니다. 그래서
   `src/lib/client-generate.ts`는 직접 호출 대신 `/api/generate`(Workers 스트리밍 프록시,
   `src/app/api/generate/route.ts`)를 거쳐 OpenAI를 호출하고 응답을 스트림으로 그대로
   전달합니다. Worker는 스트림 전달만 하므로 CPU 과금은 최소화됩니다.

## 새 Cloudflare 계정 설정 순서

```bash
npm install
npx wrangler login                     # 새로 분리한 Cloudflare 계정으로 로그인
npx wrangler d1 create trancut-db      # 생성된 database_id를 wrangler.toml에 반영
npx wrangler r2 bucket create trancut-media
npx wrangler kv namespace create CACHE_KV   # 생성된 id를 wrangler.toml에 반영

npm run db:migrate:local               # 로컬 테스트 (0001 → 0002 → 0003 순서로 적용됨)
npm run dev                            # http://localhost:3000

npm run db:migrate:remote              # 원격 D1에 마이그레이션 적용
npm run deploy                         # Cloudflare Workers에 배포
```

Google OAuth 클라이언트는 Google Cloud Console에서 발급 후 리디렉션 URI에
`https://<배포도메인>/api/auth/callback/google` 등록 필요.

## 디렉토리 구조

```
src/app/page.tsx                    메인 페이지 (키워드 검색, 업로드, 프롬프트, 생성, 출력 포맷)
src/app/admin/page.tsx               광고 배너 관리 (관리자 이메일만 접근)
src/app/admin/AdminBannerList.tsx    배너 목록 클라이언트 컴포넌트
src/app/api/auth/[...all]           Better Auth 핸들러
src/app/api/keys                    API 키 등록/조회/삭제 (암호화 저장)
src/app/api/keys/[provider]/reveal  본인 키 복호화 반환 (클라이언트 직접 호출용)
src/app/api/keywords                키워드 검색 (D1 캐시로 중복 호출 방지)
src/app/api/projects                상세페이지 생성 요청 (일일 rate limit 포함)
src/app/api/projects/[id]           클라이언트가 생성한 결과 저장 (PATCH)
src/app/api/ad-banners               광고 배너 조회/등록 (slot_group 기반, 그룹당 무제한, 등록은 관리자 전용)
src/app/api/generate                 OpenAI 스트리밍 프록시 (브라우저 CORS 우회, 키 서버 복호화)
src/lib/client-generate.ts          /api/generate를 호출해 SSE 스트림을 텍스트로 조립하는 함수
src/lib/admin.ts                    관리자 이메일 화이트리스트
migrations/0001_better_auth.sql     Better Auth 테이블 (user/session/account/verification)
migrations/0002_init.sql            앱 스키마 (api_keys, projects, ad_banners 등)
migrations/0003_project_results.sql 생성 결과 저장 컬럼 추가
```

## 운영비용 최소화 원칙 (회의 결론 반영)

- 이미지 인식/생성처럼 오래 걸리는 AI 호출은, OpenAI가 브라우저 직접 호출을 CORS로 막기 때문에
  `/api/generate`가 대신 호출하되 **응답을 스트림으로 그대로 흘려보내는 방식**으로 연결할 것
  (Worker가 전체 응답 완료를 기다리며 대기하지 않도록 — CPU 시간 과금 최소화)
- 키워드 검색은 D1에 6시간 캐시 (`keyword_cache` 테이블)
- 사용자당 일일 생성 한도 30회 (`daily_usage` 테이블, 코드에서 조정 가능)
