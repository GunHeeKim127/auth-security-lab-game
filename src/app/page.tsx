"use client";

import { useMemo, useState } from "react";
import { scenarios, type ScenarioCategory } from "@/lib/scenarios";

type Control = {
  id: string;
  name: string;
  layer: string;
  cost: number;
  description: string;
  blocks: string[];
};

const controls: Control[] = [
  { id: "identity", name: "신원 노출 차단", layer: "인증", cost: 2, description: "균일 오류와 강한 비밀번호 정책을 적용합니다.", blocks: ["AUTH-01", "AUTH-03"] },
  { id: "rate", name: "로그인 방화벽", layer: "인증", cost: 2, description: "계정과 출처별 반복 시도를 제한합니다.", blocks: ["AUTH-02", "AUTH-04"] },
  { id: "session-entry", name: "안전한 세션 발급", layer: "세션", cost: 2, description: "로그인 후 ID를 바꾸고 쿠키를 보호합니다.", blocks: ["SESS-01", "SESS-02"] },
  { id: "session-life", name: "세션 수명 관리", layer: "세션", cost: 2, description: "로그아웃·만료 뒤 세션 재사용을 차단합니다.", blocks: ["SESS-03", "SESS-04"] },
  { id: "ownership", name: "자원 소유권 검문", layer: "인가", cost: 3, description: "조회·수정·삭제마다 소유자를 확인합니다.", blocks: ["AUTHZ-01", "AUTHZ-03", "AUTHZ-04"] },
  { id: "role", name: "관리자 역할 검문", layer: "인가", cost: 2, description: "관리자 기능을 서버에서 다시 검사합니다.", blocks: ["AUTHZ-02"] },
  { id: "token", name: "토큰 무결성 금고", layer: "토큰", cost: 3, description: "서명 알고리즘과 보안 변경 시점을 검증합니다.", blocks: ["TOKEN-01", "TOKEN-02"] },
  { id: "flow", name: "복구·요청 보호막", layer: "요청 흐름", cost: 3, description: "단일 사용 토큰과 CSRF 검증을 적용합니다.", blocks: ["FLOW-01", "FLOW-02"] }
];

const categoryLabel: Record<ScenarioCategory, string> = {
  인증: "로그인 관문",
  세션: "접속 유지 통로",
  권한: "자원 접근 구역",
  "토큰·요청 흐름": "토큰과 복구 통로"
};

const MAX_BUDGET = 20;
const authAuthzPreset = ["identity", "rate", "ownership", "role"];
const fullPreset = controls.map((control) => control.id);

export default function Home() {
  const [selected, setSelected] = useState<string[]>(authAuthzPreset);
  const [hasRun, setHasRun] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  const selectedControls = controls.filter((control) => selected.includes(control.id));
  const spent = selectedControls.reduce((sum, control) => sum + control.cost, 0);
  const blockedIds = useMemo(() => new Set(selectedControls.flatMap((control) => control.blocks)), [selectedControls]);
  const blockedCount = scenarios.filter((scenario) => blockedIds.has(scenario.id)).length;
  const successCount = scenarios.length - blockedCount;
  const successRate = Math.round((successCount / scenarios.length) * 100);
  const layers = new Set(selectedControls.map((control) => control.layer)).size;
  const score = Math.max(0, Math.round((blockedCount / 16) * 70 + (layers / 5) * 20 + ((MAX_BUDGET - spent) / MAX_BUDGET) * 10));

  function toggleControl(control: Control) {
    setHasRun(false);
    setActiveScenario(null);
    if (selected.includes(control.id)) {
      setSelected(selected.filter((id) => id !== control.id));
      return;
    }
    if (spent + control.cost <= MAX_BUDGET) setSelected([...selected, control.id]);
  }

  function applyPreset(ids: string[]) {
    setSelected(ids);
    setHasRun(false);
    setActiveScenario(null);
  }

  const active = scenarios.find((scenario) => scenario.id === activeScenario);
  const activeControl = controls.find((control) => active && control.blocks.includes(active.id));

  return (
    <main>
      <nav className="topbar">
        <a className="brand" href="#top"><span>LB</span> 로그인 너머</a>
        <div className="navlinks"><a href="#game">게임</a><a href="#research">연구 결과</a><a href="#codex">공격 도감</a></div>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">ACCOUNT DEFENSE STRATEGY</p>
          <h1>로그인은 막았다.<br /><em>그런데 침입은 끝나지 않았다.</em></h1>
          <p className="lead">20 포인트의 보안 예산으로 웹서비스를 방어하세요. 로그인과 권한만 지킬지, 세션과 토큰 뒤편까지 보호할지는 당신의 선택입니다.</p>
          <a className="primary" href="#game">첫 방어전 시작하기 <span>→</span></a>
        </div>
        <div className="hero-visual" aria-label="세 가지 보안 모드의 공격 성공률">
          <div className="radar-ring ring-one" /><div className="radar-ring ring-two" />
          <div className="shield-mark">⌾</div>
          <div className="rate-card red"><strong>100%</strong><span>무방비</span></div>
          <div className="rate-card amber"><strong>50%</strong><span>인증·인가만</span></div>
          <div className="rate-card blue"><strong>0%</strong><span>다중 통제</span></div>
        </div>
      </section>

      <section className="research-strip" id="research">
        <div><span>실제 연구 데이터</span><strong>480</strong><small>총 공격 관찰</small></div>
        <div><span>취약 모드</span><strong className="danger">160/160</strong><small>공격 성공</small></div>
        <div><span>부분 강화</span><strong className="warning">80/160</strong><small>다른 경로로 우회</small></div>
        <div><span>전체 강화</span><strong className="safe">0/160</strong><small>공격 성공</small></div>
      </section>

      <section className="game" id="game">
        <header className="section-head">
          <div><p className="eyebrow">DEFENSE LOADOUT</p><h2>방어 카드를 배치하세요</h2><p>통제 하나는 특정 경로만 막습니다. 여러 신뢰 경계를 함께 보세요.</p></div>
          <div className="budget"><span>남은 예산</span><strong>{MAX_BUDGET - spent}</strong><small>/ {MAX_BUDGET} P</small></div>
        </header>

        <div className="preset-row">
          <button onClick={() => applyPreset([])}>무방비 실험</button>
          <button onClick={() => applyPreset(authAuthzPreset)}>인증·인가만 강화</button>
          <button onClick={() => applyPreset(fullPreset)}>다중 통제 완성</button>
          <button onClick={() => applyPreset([])}>초기화</button>
        </div>

        <div className="control-grid">
          {controls.map((control) => {
            const on = selected.includes(control.id);
            const disabled = !on && spent + control.cost > MAX_BUDGET;
            return (
              <button className={`control-card ${on ? "selected" : ""}`} disabled={disabled} key={control.id} onClick={() => toggleControl(control)}>
                <span className="control-top"><i>{control.layer}</i><b>{control.cost}P</b></span>
                <strong>{control.name}</strong><small>{control.description}</small>
                <span className="check">{on ? "✓ 배치 완료" : disabled ? "예산 부족" : "+ 배치하기"}</span>
              </button>
            );
          })}
        </div>

        <div className="launch-panel">
          <div><span>예상 방어 범위</span><strong>{blockedCount}<small>/16 경로</small></strong></div>
          <div className="launch-copy"><b>{layers}개 보안 계층 활성화</b><p>선택한 통제로 16개 공격을 한 번씩 시뮬레이션합니다.</p></div>
          <button className="launch" onClick={() => setHasRun(true)}>공격 웨이브 실행</button>
        </div>

        {hasRun && (
          <section className="result-panel" aria-live="polite">
            <div className="score-block"><span>방어 점수</span><strong>{score}</strong><small>/100</small></div>
            <div className="result-main">
              <p className="eyebrow">BATTLE REPORT</p>
              <h3>{successCount === 0 ? "모든 우회 경로를 막았습니다" : `${successCount}개의 우회 경로가 남았습니다`}</h3>
              <div className="result-bar"><span style={{ width: `${successRate}%` }} /></div>
              <p>공격 성공률 <b>{successRate}%</b> · 차단 {blockedCount}건 · 성공 {successCount}건</p>
            </div>
            <div className={`verdict ${successRate === 0 ? "complete" : "open"}`}>
              {successRate === 50 ? "논문과 같은 부분 강화 결과" : successRate === 0 ? "다중 통제 완성" : successRate === 100 ? "모든 경로 노출" : "사용자 전략 결과"}
            </div>
          </section>
        )}
      </section>

      <section className="codex" id="codex">
        <header className="section-head"><div><p className="eyebrow">ATTACK CODEX</p><h2>16개 공격 경로 도감</h2><p>카드를 선택해 공격이 어디를 통과하고 무엇이 막는지 확인하세요.</p></div></header>
        <div className="scenario-layout">
          <div className="scenario-list">
            {scenarios.map((scenario) => {
              const blocked = blockedIds.has(scenario.id);
              return (
                <button key={scenario.id} onClick={() => setActiveScenario(scenario.id)} className={`${activeScenario === scenario.id ? "active" : ""} ${blocked ? "blocked" : "breached"}`}>
                  <span>{scenario.id}</span><strong>{scenario.title}</strong><i>{hasRun ? (blocked ? "차단" : "성공") : categoryLabel[scenario.category]}</i>
                </button>
              );
            })}
          </div>
          <aside className="scenario-detail">
            {active ? (
              <>
                <span className="detail-id">{active.id} · {active.cwe}</span>
                <h3>{active.title}</h3>
                <dl><div><dt>취약 원인</dt><dd>{active.weakness}</dd></div><div><dt>공격 경로</dt><dd>{active.attack}</dd></div><div><dt>해결 방법</dt><dd>{active.defense}</dd></div></dl>
                <div className={`path-result ${blockedIds.has(active.id) ? "safe" : "danger"}`}>
                  <span>공격 입력</span><b>→</b><span>취약 검증 지점</span><b>→</b><span>{blockedIds.has(active.id) ? `${activeControl?.name}에서 차단` : "보호 자산 도달"}</span>
                </div>
              </>
            ) : <div className="empty-detail"><span>⌖</span><p>왼쪽 공격 카드를 선택하세요.</p></div>}
          </aside>
        </div>
      </section>

      <footer><strong>로그인 너머</strong><p>김건희의 인증·인가 우회 경로 연구와 480건의 로컬 실험을 바탕으로 만든 교육용 게임입니다.</p></footer>
    </main>
  );
}
