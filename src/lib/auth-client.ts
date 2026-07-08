"use client";

// 브라우저에서 로그인 상태를 확인하고(useSession) 로그인/로그아웃을 실행하는(signIn/signOut)
// better-auth 클라이언트. src/lib/auth.ts는 서버 쪽 설정이고, 이 파일은 그 반대쪽(브라우저)이다.
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
export const { useSession, signIn, signOut } = authClient;
