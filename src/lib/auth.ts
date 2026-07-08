import { betterAuth } from "better-auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// THE PHOTOGRAPHY와 동일 패턴:
// - getCloudflareContext()는 동기 함수 (await 불필요)
// - better-auth 1.6+는 env.DB를 직접 받음 (Kysely/kysely-d1 불필요)
// - 모듈 최상단에서 즉시 호출하면 빌드 정적 분석 단계에서 깨지므로
//   첫 요청 시점으로 인스턴스 생성을 지연

function buildAuth() {
  const { env } = getCloudflareContext();

  return betterAuth({
    database: env.DB as D1Database,
    secret: env.BETTER_AUTH_SECRET as string,
    baseURL: env.BETTER_AUTH_URL as string,
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID as string,
        clientSecret: env.GOOGLE_CLIENT_SECRET as string,
      },
    },
    emailAndPassword: { enabled: false },
    session: {
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    advanced: {
      useSecureCookies: true,
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
      },
    },
  });
}

let authInstance: ReturnType<typeof buildAuth> | undefined;

export function getAuth() {
  if (!authInstance) authInstance = buildAuth();
  return authInstance;
}

export async function getSession(req: Request) {
  const session = await getAuth().api.getSession({ headers: req.headers });
  if (!session?.user) return null;
  return {
    userId: session.user.id as string,
    email: session.user.email as string,
  };
}
