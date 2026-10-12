# 인증 보안 논문·실험 프로젝트 통합 진행 프롬프트

아래 내용을 새 Codex 또는 ChatGPT 대화의 첫 요청으로 사용한다.

---

나는 Windows 로컬 환경에서 다음 프로젝트를 진행하고 있다.

프로젝트 경로:
`C:\Users\kimgu\OneDrive\바탕 화면\projects\auth-security-lab`

연구 주제:
“Next.js와 PostgreSQL 기반 웹 애플리케이션의 인증·세션·권한 우회 취약점 재현 및 보안 통제 효과 비교”

연구 목적은 내가 소유한 localhost 실험환경에서 인증, 세션, 권한, JWT·요청 흐름 취약점을 재현하고, 동일한 공격 입력을 취약 모드와 보안 강화 모드에 적용해 성공률·정상 기능·응답시간·감사 로그를 비교하는 것이다. 외부 시스템이나 실제 계정은 절대 대상으로 삼지 않는다.

현재 환경:

- Windows, Node.js 20.9.0, npm 10.1.0, Git 2.37.2
- Next.js 15, Prisma 6.19.3, PostgreSQL 15, Playwright
- 취약 모드: `http://127.0.0.1:3001`
- 강화 모드: `http://127.0.0.1:3002`
- 실제 DB: `auth_security_lab`
- Prisma shadow DB: `auth_security_lab_shadow`
- `.env`에는 `DATABASE_URL`, `SHADOW_DATABASE_URL`, `AUTH_SECRET`, `LAB_MODE`가 설정되어 있다. 비밀값을 출력하거나 커밋하지 않는다.

완료된 내용:

- 인증 4개, 세션 4개, 권한 4개, 토큰·요청 흐름 4개 등 16개 시나리오 정의
- 취약·강화 모드의 HTTP 판정 API
- Playwright 비교 테스트 32개
- PostgreSQL Prisma 마이그레이션 적용
- 실험 사용자 3명과 리소스 2개 시드
- 공격 실행 결과를 PostgreSQL `AuditLog`에 기록
- 마지막 전체 검증에서 기능 비교와 통합·대조 테스트 72/72 통과
- 실제 로그인, PostgreSQL 세션, 로그아웃·만료, 객체 조회·수정·삭제, 관리자 역할, JWT 서명, CSRF 흐름 구현
- 2026-10-12 최종 전체 실행 직후 DB 스냅숏에서 세션 108건, 누적 감사 로그 192건 확인
- `npm run db:verify` 실행 시 `results/db-verification.json` 갱신

중요한 현재 한계:

- 판정 함수 기반 1차 실험과 실제 통합 실험이 함께 있으므로 결과를 분리해 해석해야 한다.
- 16개 정의 시나리오는 모두 실제 통합 흐름을 가진다.
- JWT의 iss·aud·nbf 실패 사례와 키 회전은 추가 검증이 필요하다.
- 최소 10회 반복 실행, 회차 ID, 응답시간 통계와 회차별 JSON 저장이 필요하다.

우선 읽을 파일:

- `README.md`
- `prisma/schema.prisma`
- `src/lib/scenarios.ts`
- `src/lib/lab.ts`
- `tests/scenarios.spec.ts`
- `docs/thesis-completeness-review.md`
- `docs/experiment-design.md`
- `docs/experiment-results.md`
- `docs/paper-security-section.md`
- `results/db-verification.json`

작업 원칙:

1. 기존 `.env`의 값과 비밀번호를 출력하지 않는다.
2. 기존 16개 시나리오 ID를 코드·테스트·DB·논문에서 동일하게 유지한다.
3. 기능 실험과 실제 통합 실험 결과를 구분한다.
4. 공격은 localhost와 시드한 비실계정에만 실행한다.
5. 각 구현 후 TypeScript 검사, 빌드, Playwright 테스트, DB 집계를 수행한다.
6. 원시 결과는 `results/` 아래 JSON으로 저장하고 생성 시각·실행 회차·환경 버전을 포함한다.
7. 논문에는 구현되지 않은 방어를 완료된 것처럼 쓰지 않는다.
8. 공식 근거는 OWASP, NIST, IETF RFC, MITRE CWE 같은 1차 자료를 우선한다.

다음 작업을 순서대로 진행하라.

1. 실제 비밀번호 재설정 토큰 모델과 발급·소비·재사용 차단을 구현한다.
2. 다수 실제 계정을 사용하는 자격 증명 스터핑 실험을 구현한다.
3. JWT의 iss·aud·nbf 실패 사례와 키 회전 조건을 추가한다.
4. 최소 10회 반복 실험 실행기와 회차별 JSON·요약 통계를 구현한다.
5. 응답시간 중앙값·범위와 정상 요청 성공률을 계산한다.
6. 전체 테스트와 DB 검증을 실행한다.
7. 실제 결과를 `docs/experiment-results.md`와 `docs/paper-security-section.md`에 반영한다.

먼저 현재 저장소 상태와 테스트 결과를 확인한 뒤 구현을 계속하라. 변경 사항, 검증 결과, 남은 한계를 명확하게 보고하라.

---
