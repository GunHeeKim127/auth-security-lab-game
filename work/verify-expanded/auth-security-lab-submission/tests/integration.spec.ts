import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const credentials = { email: "alice@lab.local", password: "LabPassword!2026" };
const prisma = new PrismaClient();

test.afterAll(async () => {
  await prisma.$disconnect();
});

function tokenFrom(response: { headers(): Record<string, string> }) {
  const cookie = response.headers()["set-cookie"] ?? "";
  return /lab_session=([^;]+)/.exec(cookie)?.[1] ?? "";
}

test("정상 로그인과 세션 조회", async ({ request }) => {
  const login = await request.post("/api/auth/login", { data: credentials });
  expect(login.status()).toBe(200);
  const token = tokenFrom(login);
  expect(token).not.toBe("");
  const me = await request.get("/api/auth/me", { headers: { "x-session-token": token } });
  expect(me.status()).toBe(200);
  expect((await me.json()).user.email).toBe(credentials.email);
});

test("AUTH-01 실제 사용자 열거 응답", async ({ request }, testInfo) => {
  const existing = await request.post("/api/auth/login", { data: { email: credentials.email, password: "wrong" } });
  const missing = await request.post("/api/auth/login", { data: { email: "missing@lab.local", password: "wrong" } });
  const a = await existing.json();
  const b = await missing.json();
  expect(a.error === b.error).toBe(testInfo.project.name === "secure");
});

test("AUTH-02 실제 반복 인증 제한", async ({ request }, testInfo) => {
  const email = `bruteforce-${testInfo.project.name}@lab.local`;
  let status = 0;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    status = (await request.post("/api/auth/login", { data: { email, password: `wrong-${attempt}` } })).status();
  }
  expect(status).toBe(testInfo.project.name === "secure" ? 429 : 401);
});

test("AUTH-03 실제 약한 비밀번호 등록", async ({ request }, testInfo) => {
  const email = `weak-${testInfo.project.name}-${Date.now()}@lab.local`;
  const response = await request.post("/api/auth/register", { data: { email, password: "password123" } });
  expect(response.status()).toBe(testInfo.project.name === "secure" ? 422 : 201);
  await prisma.user.deleteMany({ where: { email } });
});

test("AUTH-04 실제 다계정 자격 증명 스터핑 제한", async ({ request }, testInfo) => {
  const emails = ["alice@lab.local", "bob@lab.local", "admin@lab.local"];
  const source = `198.51.100.${testInfo.project.name === "secure" ? 10 : 11}`;
  let status = 0;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    status = (await request.post("/api/auth/login", {
      data: { email: emails[attempt % emails.length], password: "Reused-Wrong-Password" },
      headers: { "x-forwarded-for": source }
    })).status();
  }
  expect(status).toBe(testInfo.project.name === "secure" ? 429 : 401);
});

test("SESS-01 실제 세션 고정", async ({ request }, testInfo) => {
  const fixed = `fixed-${testInfo.project.name}-${Date.now()}`;
  const response = await request.post("/api/auth/login", { data: credentials, headers: { "x-fixed-session": fixed } });
  expect(tokenFrom(response) === fixed).toBe(testInfo.project.name === "vulnerable");
});

test("SESS-02 쿠키 보호 속성", async ({ request }, testInfo) => {
  const response = await request.post("/api/auth/login", { data: credentials });
  const cookie = response.headers()["set-cookie"] ?? "";
  const protectedCookie = /HttpOnly/i.test(cookie) && /Secure/i.test(cookie) && /SameSite=Strict/i.test(cookie);
  expect(protectedCookie).toBe(testInfo.project.name === "secure");
});

test("SESS-03 로그아웃 토큰 재사용", async ({ request }, testInfo) => {
  const login = await request.post("/api/auth/login", { data: credentials });
  const token = tokenFrom(login);
  await request.post("/api/auth/logout", { headers: { "x-session-token": token } });
  const replay = await request.get("/api/auth/me", { headers: { "x-session-token": token } });
  expect(replay.status()).toBe(testInfo.project.name === "secure" ? 401 : 200);
});

test("SESS-04 실제 만료 세션 재사용", async ({ request }, testInfo) => {
  const login = await request.post("/api/auth/login", { data: credentials });
  const body = await login.json();
  const token = tokenFrom(login);
  await prisma.session.update({ where: { id: body.sessionId }, data: { expiresAt: new Date(Date.now() - 60_000) } });
  const response = await request.get("/api/auth/me", { headers: { "x-session-token": token } });
  expect(response.status()).toBe(testInfo.project.name === "secure" ? 401 : 200);
});

test("AUTHZ-01 실제 다른 사용자 리소스 조회", async ({ request }, testInfo) => {
  const login = await request.post("/api/auth/login", { data: credentials });
  const response = await request.get("/api/resources/resource-bob", { headers: { "x-session-token": tokenFrom(login) } });
  expect(response.status()).toBe(testInfo.project.name === "secure" ? 403 : 200);
});

test("AUTHZ-02 실제 관리자 기능 접근", async ({ request }, testInfo) => {
  const login = await request.post("/api/auth/login", { data: credentials });
  const response = await request.get("/api/admin", { headers: { "x-session-token": tokenFrom(login) } });
  expect(response.status()).toBe(testInfo.project.name === "secure" ? 403 : 200);
});

test("AUTHZ-03 실제 다른 사용자 리소스 수정", async ({ request }, testInfo) => {
  const login = await request.post("/api/auth/login", { data: credentials });
  const response = await request.patch("/api/resources/resource-bob", {
    headers: { "x-session-token": tokenFrom(login) }, data: { title: "Unauthorized change" }
  });
  expect(response.status()).toBe(testInfo.project.name === "secure" ? 403 : 200);
  await prisma.resource.update({ where: { id: "resource-bob" }, data: { title: "Bob private record" } });
});

test("AUTHZ-04 실제 다른 사용자 리소스 삭제", async ({ request }, testInfo) => {
  const bob = await prisma.user.findUniqueOrThrow({ where: { email: "bob@lab.local" } });
  const id = `delete-${testInfo.project.name}-${Date.now()}`;
  await prisma.resource.create({ data: { id, title: "Delete target", body: "Local lab data", ownerId: bob.id } });
  const login = await request.post("/api/auth/login", { data: credentials });
  const response = await request.delete(`/api/resources/${id}`, { headers: { "x-session-token": tokenFrom(login) } });
  expect(response.status()).toBe(testInfo.project.name === "secure" ? 403 : 200);
  await prisma.resource.deleteMany({ where: { id } });
});

test("정상 소유 리소스와 관리자 접근", async ({ request }) => {
  const userLogin = await request.post("/api/auth/login", { data: credentials });
  expect((await request.get("/api/resources/resource-alice", { headers: { "x-session-token": tokenFrom(userLogin) } })).status()).toBe(200);
  const adminLogin = await request.post("/api/auth/login", { data: { email: "admin@lab.local", password: credentials.password } });
  expect((await request.get("/api/admin", { headers: { "x-session-token": tokenFrom(adminLogin) } })).status()).toBe(200);
});

test("TOKEN-01 실제 alg=none JWT 변조", async ({ request }, testInfo) => {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: "alice@lab.local", exp: Math.floor(Date.now() / 1000) + 900 })).toString("base64url");
  const response = await request.post("/api/token/verify", { data: { token: `${header}.${payload}.` } });
  expect(response.status()).toBe(testInfo.project.name === "secure" ? 401 : 200);
});

test("정상 서명 JWT 검증", async ({ request }) => {
  const issued = await request.post("/api/token/issue");
  const { token } = await issued.json();
  const response = await request.post("/api/token/verify", { data: { token } });
  expect(response.status()).toBe(200);
});

test("TOKEN-02 실제 비밀번호 변경 후 세션 재사용", async ({ request }, testInfo) => {
  const email = `password-change-${testInfo.project.name}-${Date.now()}@lab.local`;
  await prisma.user.create({ data: { email, passwordHash: await bcrypt.hash(credentials.password, 12) } });
  const login = await request.post("/api/auth/login", { data: { email, password: credentials.password } });
  const token = tokenFrom(login);
  const changed = await request.post("/api/auth/password", {
    headers: { "x-session-token": token },
    data: { currentPassword: credentials.password, password: "A-new-long-passphrase-2026" }
  });
  expect(changed.status()).toBe(200);
  const replay = await request.get("/api/auth/me", { headers: { "x-session-token": token } });
  expect(replay.status()).toBe(testInfo.project.name === "secure" ? 401 : 200);
  await prisma.user.deleteMany({ where: { email } });
});

test("FLOW-01 실제 재설정 토큰 재사용", async ({ request }, testInfo) => {
  const email = `reset-${testInfo.project.name}-${Date.now()}@lab.local`;
  await prisma.user.create({ data: { email, passwordHash: await bcrypt.hash(credentials.password, 12) } });
  const issued = await request.post("/api/auth/reset/issue", { data: { email } });
  const { labToken } = await issued.json();
  const payload = { token: labToken, password: "A-reset-long-passphrase-2026" };
  expect((await request.post("/api/auth/reset/consume", { data: payload })).status()).toBe(200);
  const replay = await request.post("/api/auth/reset/consume", { data: payload });
  expect(replay.status()).toBe(testInfo.project.name === "secure" ? 410 : 200);
  await prisma.user.deleteMany({ where: { email } });
});

test("FLOW-02 실제 CSRF 출처 검증", async ({ request }, testInfo) => {
  const login = await request.post("/api/auth/login", { data: credentials });
  const sessionToken = tokenFrom(login);
  const issued = await request.get("/api/csrf");
  const { token } = await issued.json();
  const response = await request.post("/api/profile", {
    data: { displayName: "attacker-change" },
    headers: { origin: "https://attacker.invalid", "x-csrf-token": token, "x-session-token": sessionToken }
  });
  expect(response.status()).toBe(testInfo.project.name === "secure" ? 403 : 200);
});

test("정상 CSRF 토큰과 동일 출처 요청", async ({ request }, testInfo) => {
  const login = await request.post("/api/auth/login", { data: credentials });
  const sessionToken = tokenFrom(login);
  const issued = await request.get("/api/csrf");
  const { token } = await issued.json();
  const origin = testInfo.project.name === "secure" ? "http://127.0.0.1:3002" : "http://127.0.0.1:3001";
  const response = await request.post("/api/profile", {
    data: { displayName: "normal-change" },
    headers: { origin, "x-csrf-token": token, cookie: `lab_csrf=${token}`, "x-session-token": sessionToken }
  });
  expect(response.status()).toBe(200);
});
