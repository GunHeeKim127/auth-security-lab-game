export type ScenarioCategory = "인증" | "세션" | "권한" | "토큰·요청 흐름";

export type Scenario = {
  id: string;
  category: ScenarioCategory;
  title: string;
  weakness: string;
  attack: string;
  defense: string;
  cwe: string;
};

export const scenarios: Scenario[] = [
  { id: "AUTH-01", category: "인증", title: "사용자 열거", weakness: "계정 존재 여부에 따라 오류가 달라진다.", attack: "서로 다른 이메일의 로그인 응답을 비교한다.", defense: "동일한 오류 메시지와 상태 코드를 반환한다.", cwe: "CWE-204" },
  { id: "AUTH-02", category: "인증", title: "무차별 대입", weakness: "반복 로그인 요청을 제한하지 않는다.", attack: "같은 계정에 짧은 시간 동안 여러 비밀번호를 대입한다.", defense: "계정·IP 기준 속도 제한과 지연을 적용한다.", cwe: "CWE-307" },
  { id: "AUTH-03", category: "인증", title: "약한 비밀번호", weakness: "짧고 흔한 비밀번호를 허용한다.", attack: "password123을 신규 비밀번호로 제출한다.", defense: "길이·유출 비밀번호·사용자 정보 포함 여부를 검사한다.", cwe: "CWE-521" },
  { id: "AUTH-04", category: "인증", title: "자격 증명 스터핑", weakness: "자동화된 대량 로그인을 구분하지 않는다.", attack: "여러 계정에 재사용 비밀번호를 연속 대입한다.", defense: "속도 제한, 위험 기반 탐지, 다중 인증을 결합한다.", cwe: "CWE-307" },
  { id: "SESS-01", category: "세션", title: "세션 고정", weakness: "로그인 전후 세션 ID가 같다.", attack: "공격자가 정한 세션 ID로 피해자를 로그인시킨다.", defense: "인증 성공 시 세션 ID를 재발급한다.", cwe: "CWE-384" },
  { id: "SESS-02", category: "세션", title: "세션 쿠키 탈취", weakness: "쿠키 보안 속성이 빠져 있다.", attack: "클라이언트 스크립트에서 세션 쿠키 접근을 시도한다.", defense: "HttpOnly, Secure, SameSite 속성을 적용한다.", cwe: "CWE-1004" },
  { id: "SESS-03", category: "세션", title: "로그아웃 후 재사용", weakness: "로그아웃한 토큰이 계속 유효하다.", attack: "로그아웃 전에 복사한 토큰을 다시 제출한다.", defense: "서버 측 세션을 폐기하고 토큰 버전을 검사한다.", cwe: "CWE-613" },
  { id: "SESS-04", category: "세션", title: "만료 토큰 수락", weakness: "만료 시간을 검증하지 않는다.", attack: "과거 exp 값을 가진 토큰으로 요청한다.", defense: "서명과 exp, nbf, iss, aud를 함께 검증한다.", cwe: "CWE-613" },
  { id: "AUTHZ-01", category: "권한", title: "수평 권한 우회", weakness: "리소스 소유자를 검사하지 않는다.", attack: "URL의 리소스 ID를 다른 사용자 것으로 바꾼다.", defense: "모든 조회에 인증 사용자 소유권 조건을 포함한다.", cwe: "CWE-639" },
  { id: "AUTHZ-02", category: "권한", title: "수직 권한 우회", weakness: "관리자 API가 로그인 여부만 검사한다.", attack: "일반 사용자 토큰으로 관리자 API를 호출한다.", defense: "서버에서 역할과 권한을 명시적으로 검사한다.", cwe: "CWE-862" },
  { id: "AUTHZ-03", category: "권한", title: "IDOR 수정", weakness: "수정 대상의 소유권을 검사하지 않는다.", attack: "다른 사용자의 ID로 PATCH 요청을 보낸다.", defense: "소유권 조건을 포함한 단일 DB 쿼리로 수정한다.", cwe: "CWE-639" },
  { id: "AUTHZ-04", category: "권한", title: "IDOR 삭제", weakness: "삭제 대상의 소유권을 검사하지 않는다.", attack: "다른 사용자의 ID로 DELETE 요청을 보낸다.", defense: "소유권·역할 확인 후 삭제하고 감사 로그를 남긴다.", cwe: "CWE-639" },
  { id: "TOKEN-01", category: "토큰·요청 흐름", title: "JWT 알고리즘 변조", weakness: "허용 알고리즘을 고정하지 않는다.", attack: "alg=none으로 바꾼 토큰을 제출한다.", defense: "검증 알고리즘과 키를 서버에서 고정한다.", cwe: "CWE-347" },
  { id: "TOKEN-02", category: "토큰·요청 흐름", title: "비밀번호 변경 후 토큰 재사용", weakness: "보안 사건 후 기존 토큰을 폐기하지 않는다.", attack: "비밀번호 변경 전에 발급된 토큰을 재사용한다.", defense: "토큰 버전 또는 발급 시각을 계정 상태와 비교한다.", cwe: "CWE-613" },
  { id: "FLOW-01", category: "토큰·요청 흐름", title: "비밀번호 재설정 토큰 우회", weakness: "재설정 토큰이 단순하거나 재사용 가능하다.", attack: "예측한 토큰 또는 이미 쓴 토큰을 제출한다.", defense: "충분한 난수, 짧은 만료, 단일 사용, 해시 저장을 적용한다.", cwe: "CWE-640" },
  { id: "FLOW-02", category: "토큰·요청 흐름", title: "CSRF", weakness: "쿠키 인증 상태 변경 요청의 출처를 검증하지 않는다.", attack: "다른 출처를 가장한 POST 요청을 보낸다.", defense: "SameSite 쿠키와 CSRF 토큰, Origin 검증을 적용한다.", cwe: "CWE-352" }
];

export const scenarioById = new Map(scenarios.map((scenario) => [scenario.id, scenario]));
