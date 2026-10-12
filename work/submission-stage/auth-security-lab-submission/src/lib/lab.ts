type AttackInput = {
  attempt?: number; password?: string; sessionBefore?: string; sessionAfter?: string;
  cookieFlags?: string[]; tokenRevoked?: boolean; expired?: boolean; actorId?: string;
  ownerId?: string; role?: string; algorithm?: string; tokenIssuedBeforePasswordChange?: boolean;
  resetTokenUsed?: boolean; origin?: string; expectedOrigin?: string; accountExists?: boolean;
};

export type AttackResult = { attackSucceeded: boolean; status: number; evidence: string; control: string };
const vulnerableResult = (evidence: string): AttackResult => ({ attackSucceeded: true, status: 200, evidence, control: "취약 구현이 공격 입력을 수락함" });
const blockedResult = (evidence: string, status = 403): AttackResult => ({ attackSucceeded: false, status, evidence, control: "강화 구현이 공격 입력을 차단함" });

export function runAttack(id: string, secure: boolean, input: AttackInput): AttackResult {
  if (!secure) {
    const evidence: Record<string, string> = {
      "AUTH-01": input.accountExists ? "등록 계정이라는 구체적 오류 반환" : "미등록 계정이라는 구체적 오류 반환",
      "AUTH-02": `${input.attempt ?? 20}번째 로그인 시도도 처리됨`, "AUTH-03": `약한 비밀번호 '${input.password ?? "password123"}'가 허용됨`,
      "AUTH-04": "계정별 연속 자동 로그인 요청이 처리됨", "SESS-01": `로그인 전후 세션 ID가 ${input.sessionBefore ?? "fixed-session"}로 동일함`,
      "SESS-02": "세션 쿠키에 HttpOnly/Secure/SameSite가 없음", "SESS-03": "폐기된 토큰으로 보호 자원 접근 성공",
      "SESS-04": "만료 시간이 지난 토큰으로 접근 성공", "AUTHZ-01": "다른 사용자의 리소스 조회 성공",
      "AUTHZ-02": "일반 사용자로 관리자 기능 실행 성공", "AUTHZ-03": "다른 사용자의 리소스 수정 성공",
      "AUTHZ-04": "다른 사용자의 리소스 삭제 성공", "TOKEN-01": `${input.algorithm ?? "none"} 알고리즘 토큰 수락`,
      "TOKEN-02": "비밀번호 변경 이전 토큰 수락", "FLOW-01": "이미 사용한 재설정 토큰 재사용 성공",
      "FLOW-02": `${input.origin ?? "https://attacker.invalid"} 출처의 상태 변경 요청 수락`
    };
    return vulnerableResult(evidence[id] ?? "공격 성공");
  }
  switch (id) {
    case "AUTH-01": return blockedResult("계정 존재 여부와 무관하게 동일한 401 응답", 401);
    case "AUTH-02": return (input.attempt ?? 20) > 5 ? blockedResult("5회 초과 요청을 429로 제한", 429) : vulnerableResult("허용 범위 내 시도");
    case "AUTH-03": return (input.password ?? "password123").length < 15 || /password|123456|qwerty/i.test(input.password ?? "") ? blockedResult("비밀번호 정책 위반", 422) : vulnerableResult("강한 비밀번호");
    case "AUTH-04": return (input.attempt ?? 20) > 5 ? blockedResult("자동화 위험 요청을 제한", 429) : vulnerableResult("허용 범위 내 요청");
    case "SESS-01": return blockedResult(input.sessionBefore === input.sessionAfter ? "인증 후 세션 ID 재발급 필요" : "고정 세션으로 접근 불가", 401);
    case "SESS-02": return blockedResult("HttpOnly, Secure, SameSite 쿠키 속성을 강제", 400);
    case "SESS-03": return input.tokenRevoked ? blockedResult("폐기 목록에서 토큰 감지", 401) : vulnerableResult("유효 토큰");
    case "SESS-04": return input.expired ? blockedResult("exp 검증에서 만료 감지", 401) : vulnerableResult("유효 토큰");
    case "AUTHZ-01": case "AUTHZ-03": case "AUTHZ-04": return input.actorId !== input.ownerId ? blockedResult("리소스 소유권 불일치") : vulnerableResult("소유자 요청");
    case "AUTHZ-02": return input.role !== "ADMIN" ? blockedResult("ADMIN 역할 필요") : vulnerableResult("관리자 요청");
    case "TOKEN-01": return input.algorithm !== "HS256" ? blockedResult("허용하지 않은 JWT 알고리즘", 401) : vulnerableResult("허용 알고리즘");
    case "TOKEN-02": return input.tokenIssuedBeforePasswordChange ? blockedResult("토큰 발급 시각이 보안 변경보다 이전", 401) : vulnerableResult("최신 토큰");
    case "FLOW-01": return input.resetTokenUsed ? blockedResult("단일 사용 토큰이 이미 소비됨", 410) : vulnerableResult("사용 가능한 토큰");
    case "FLOW-02": return input.origin !== input.expectedOrigin ? blockedResult("Origin 불일치 및 CSRF 검증 실패") : vulnerableResult("신뢰 출처 요청");
    default: return blockedResult("알 수 없는 시나리오", 404);
  }
}
