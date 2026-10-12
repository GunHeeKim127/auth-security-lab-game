# 웹 애플리케이션 인증·인가 우회 경로 및 다중 보안 통제 실험 재현 안내

이 패키지는 본인이 소유한 로컬 실험 환경에서만 실행하도록 만든 Next.js, PostgreSQL, Prisma, Playwright 기반 연구 자료다. 외부 서비스나 타인의 계정을 대상으로 사용하지 않는다.

## 빠른 확인

1. Node.js 20 이상과 PostgreSQL 15 이상을 준비한다.
2. `.env.example`을 참고해 `.env`를 만들고 본인 로컬 데이터베이스 주소를 입력한다. 비밀번호가 포함된 `.env`는 제출물에 없다.
3. `npm ci`를 실행한다.
4. `npx prisma migrate deploy`와 `npm run db:seed`를 실행한다.
5. `npm run test:e2e`로 72개 자동화 검증을 실행한다.
6. `npm run test:repeat`로 16개 공격을 취약·인증인가 부분 강화·전체 강화의 세 모드에서 각각 10회 반복하고 `results/repeated-experiment-raw.json`과 `results/repeated-experiment-summary.json`을 다시 만든다.

## 결과 무결성 확인

`results/repeated-experiment-summary.json`에서 `expectedObservations`와 `actualObservations`가 모두 480인지 확인한다. 각 모드는 160건이어야 한다. 최신 제출 실행의 공격 성공은 취약 모드 160건, 인증·인가 부분 강화 모드 80건, 전체 강화 모드 0건이었다.

## 주요 파일

- `docs/submission-paper-source.md`: 최종 논문 원문
- `results/repeated-experiment-raw.json`: 480건 원자료
- `results/repeated-experiment-summary.json`: 모드별 및 시나리오별 집계
- `tests/repeat/repeat-experiment.spec.ts`: 10회 반복 실행 스크립트
- `tests/scenarios.spec.ts`, `tests/integration.spec.ts`: 판정 및 실제 통합 테스트
- `prisma/schema.prisma`, `prisma/seed.mjs`: 데이터 구조와 초기 데이터
- `src`: 취약 모드와 강화 모드 구현

## 설계 변경 기록

초기에는 16개 시나리오를 취약·전체 강화 조건에서 한 번씩 비교했으나, 과제의 최소 반복 기준을 충족하기 위해 10회로 늘렸다. 이후 이 두 조건만으로는 인증·인가 강화의 불충분성을 확인할 수 없다는 검토에 따라 인증·인가만 강화하고 세션·토큰·요청 흐름은 취약하게 유지한 중간 조건을 추가했다. 최종 설계는 세 조건의 시작 순서를 회차별로 순환한다. 이전 결과는 삭제하지 않고 `results/latest-test-summary.json`과 기존 문서에 보존했다.

## 보안 및 범위

제출 ZIP은 `.env`, 데이터베이스 비밀번호, `node_modules`, `.next`, Playwright HTML 보고서를 포함하지 않는다. 연구 범위는 인증·세션·권한·토큰·요청 흐름의 16개 시나리오이며 SQL 삽입, XSS, SSRF, 파일 업로드, 공급망, 네트워크 및 운영체제 공격은 결론 범위에 포함하지 않는다.
