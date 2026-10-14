"use client";

import { useMemo, useRef, useState } from "react";
import { scenarios, type ScenarioCategory } from "@/lib/scenarios";

type Control={id:string;name:string;layer:string;cost:number;icon:string;description:string;blocks:string[]};
const controls:Control[]=[
 {id:"identity",name:"신원 은폐막",layer:"인증",cost:2,icon:"◉",description:"균일 오류·강한 비밀번호",blocks:["AUTH-01","AUTH-03"]},
 {id:"rate",name:"로그인 포탑",layer:"인증",cost:2,icon:"⌁",description:"반복·자동화 요청 제한",blocks:["AUTH-02","AUTH-04"]},
 {id:"session-entry",name:"세션 재발급기",layer:"세션",cost:2,icon:"↻",description:"ID 교체·쿠키 보호",blocks:["SESS-01","SESS-02"]},
 {id:"session-life",name:"세션 소멸장",layer:"세션",cost:2,icon:"⌛",description:"로그아웃·만료 검증",blocks:["SESS-03","SESS-04"]},
 {id:"ownership",name:"소유권 검문소",layer:"인가",cost:3,icon:"◇",description:"자원마다 소유자 확인",blocks:["AUTHZ-01","AUTHZ-03","AUTHZ-04"]},
 {id:"role",name:"역할 감시탑",layer:"인가",cost:2,icon:"♜",description:"관리자 권한 재검사",blocks:["AUTHZ-02"]},
 {id:"token",name:"토큰 무결성 금고",layer:"토큰",cost:3,icon:"⬡",description:"서명·발급 시점 검증",blocks:["TOKEN-01","TOKEN-02"]},
 {id:"flow",name:"요청 흐름 보호막",layer:"흐름",cost:3,icon:"✦",description:"CSRF·복구 토큰 검증",blocks:["FLOW-01","FLOW-02"]}
];
const labels:Record<ScenarioCategory,string>={인증:"AUTH",세션:"SESSION",권한:"ACCESS","토큰·요청 흐름":"TOKEN"};
const authPreset=["identity","rate","ownership","role"];
const allPreset=controls.map(c=>c.id); const MAX=20;
type Log={id:number;text:string;kind:"info"|"safe"|"danger"};

export default function Home(){
 const [selected,setSelected]=useState<string[]>(authPreset); const [running,setRunning]=useState(false);
 const [wave,setWave]=useState(-1); const [resolved,setResolved]=useState<string[]>([]); const [health,setHealth]=useState(100);
 const [logs,setLogs]=useState<Log[]>([{id:0,text:"방어 장치를 배치하고 공격 웨이브를 시작하세요.",kind:"info"}]);
 const [speed,setSpeed]=useState(1); const [active,setActive]=useState<string|null>(null); const runId=useRef(0);
 const chosen=controls.filter(c=>selected.includes(c.id)); const spent=chosen.reduce((a,c)=>a+c.cost,0);
 const blocked=useMemo(()=>new Set(chosen.flatMap(c=>c.blocks)),[selected]); const blockedCount=scenarios.filter(s=>blocked.has(s.id)).length;
 const current=wave>=0&&wave<scenarios.length?scenarios[wave]:null; const complete=wave===scenarios.length;
 const breaches=resolved.filter(id=>!blocked.has(id)).length; const score=Math.max(0,Math.round((blockedCount/16)*80+(new Set(chosen.map(c=>c.layer)).size/5)*20));
 function resetBattle(next=selected){runId.current++;setSelected(next);setRunning(false);setWave(-1);setResolved([]);setHealth(100);setLogs([{id:Date.now(),text:"새 방어 구성이 준비되었습니다.",kind:"info"}]);}
 function toggle(c:Control){if(running)return; if(selected.includes(c.id))resetBattle(selected.filter(x=>x!==c.id));else if(spent+c.cost<=MAX)resetBattle([...selected,c.id]);}
 async function launch(){const id=++runId.current;setRunning(true);setWave(0);setResolved([]);setHealth(100);setLogs([{id:Date.now(),text:"⚠ 적대 트래픽 감지. 16개 공격 웨이브가 접근합니다.",kind:"info"}]);
  for(let i=0;i<scenarios.length;i++){if(runId.current!==id)return;const s=scenarios[i];setWave(i);setLogs(v=>[...v.slice(-5),{id:Date.now()+i,text:`${s.id} · ${s.title} 접근 중`,kind:"info"}]);await new Promise(r=>setTimeout(r,900/speed));if(runId.current!==id)return;const ok=blocked.has(s.id);setResolved(v=>[...v,s.id]);if(!ok)setHealth(h=>Math.max(0,h-7));setLogs(v=>[...v.slice(-5),{id:Date.now()+100+i,text:ok?`차단 성공 — ${controls.find(c=>c.blocks.includes(s.id)&&selected.includes(c.id))?.name}`:`침투 성공 — ${s.category} 계층 피해`,kind:ok?"safe":"danger"}]);await new Promise(r=>setTimeout(r,420/speed));}
  if(runId.current===id){setWave(scenarios.length);setRunning(false);}
 }
 const detail=scenarios.find(s=>s.id===active);
 return <main>
  <nav><a className="brand" href="#top"><i>LB</i><span>로그인 너머<small>CYBER DEFENSE</small></span></a><div><a href="#battle">방어전</a><a href="#arsenal">방어 장치</a><a href="#codex">공격 도감</a></div></nav>
  <section className="hero" id="top"><div><p className="kicker">INTERACTIVE SECURITY LAB</p><p className="paper-title">논문 · 웹 애플리케이션의 인증·인가 우회 경로 분석 및 다중 보안 통제 적용에 따른 취약점 개선 효과 평가</p><h1>우회 경로를 추적하고<br/><em>서비스를 방어하라</em></h1><p className="help-line"><b>웹서비스 개발자와 보안 학습자</b>가 16개 우회 공격을 직접 막아 보며 빠진 보안 통제를 발견하도록 돕습니다.</p><div className="mission-steps"><span><b>01</b> 방어 장치 배치</span><span><b>02</b> 공격 웨이브 실행</span><span><b>03</b> 결과·원리 확인</span></div><a href="#battle" className="cta">작전실 입장 <b>↓</b></a></div><div className="hero-core"><span className="orbit o1"/><span className="orbit o2"/><span className="scan"/><div className="core">16<small>ATTACK<br/>VECTORS</small></div><i className="blip b1"/><i className="blip b2"/><i className="blip b3"/></div></section>

  <section className="battle-wrap" id="battle"><header className="section-title"><div><p className="kicker">LIVE BATTLEFIELD</p><h2>실시간 방어 작전실</h2></div><div className={`status ${running?"live":complete?"done":"ready"}`}><i/>{running?`WAVE ${wave+1}/16`:complete?"전투 종료":"방어 준비"}</div></header>
   <div className="hud"><div><span>SERVER HP</span><b className={health<50?"hurt":""}>{health}</b><div className="hp"><i style={{width:`${health}%`}}/></div></div><div><span>BLOCKED</span><b>{resolved.filter(x=>blocked.has(x)).length}</b><small>/ {resolved.length}</small></div><div><span>BREACHED</span><b className="red">{breaches}</b></div><div><span>DEFENSE SCORE</span><b>{complete?score:"---"}</b></div></div>
   <div className={`arena ${running?"is-running":""} ${complete?"is-complete":""}`}>
    <div className="lane attacker"><label>THREAT GATE</label><div className="enemy"><span>{current?labels[current.category]:complete?"END":"?"}</span><b>{current?.id??(complete?"CLEAR":"대기 중")}</b><small>{current?.title??"웨이브를 실행하세요"}</small></div><div className="spawn-lines"/></div>
    <div className="flight-zone">{current&&<div key={`${current.id}-${resolved.length}`} className={`packet ${blocked.has(current.id)?"will-block":"will-hit"}`}><i/><b>{current.id}</b></div>}<span className="route r1"/><span className="route r2"/><span className="route r3"/></div>
    <div className="defense-wall"><label>DEFENSE GRID</label><div className="turrets">{controls.map(c=><div key={c.id} className={`turret ${selected.includes(c.id)?"on":"off"} ${current&&c.blocks.includes(current.id)&&selected.includes(c.id)?"firing":""}`}><i>{c.icon}</i><small>{c.name}</small></div>)}</div></div>
    <div className={`server ${health<50?"damaged":""}`}><label>CORE SERVER</label><div className="server-box"><i>⬡</i><b>AUTH<br/>SERVICE</b><span/></div></div>
   </div>
   <div className="console"><div className="console-head"><span>◉ LIVE EVENT LOG</span><div>속도 <button onClick={()=>setSpeed(speed===1?2:speed===2?4:1)}>×{speed}</button></div></div><div className="log-list">{logs.map(l=><p className={l.kind} key={l.id}><time>{new Date(l.id).toLocaleTimeString("ko-KR",{hour12:false})}</time>{l.text}</p>)}</div></div>
   <div className="battle-actions"><button className="abort" onClick={()=>resetBattle()} disabled={!running}>중단·초기화</button><button className="launch" onClick={launch} disabled={running}>{running?"공격 진행 중…":complete?"다시 도전":"공격 웨이브 시작"}</button></div>
   {complete&&<div className={`mission ${breaches?"failed":"victory"}`}><span>{breaches?"MISSION REPORT":"PERFECT DEFENSE"}</span><h3>{breaches?`${breaches}개의 우회 경로가 서버에 도달했습니다`:`16개 공격을 모두 차단했습니다`}</h3><p>{breaches?"인증과 인가 바깥의 세션·토큰·요청 흐름도 함께 보호해야 합니다.":"다중 보안 통제가 단일 계층의 빈틈을 보완했습니다."}</p></div>}
  </section>

  <section className="arsenal" id="arsenal"><header className="section-title"><div><p className="kicker">BUILD YOUR LOADOUT</p><h2>방어 장치 배치</h2><p>장치를 누르면 전장에 즉시 설치됩니다.</p></div><div className="budget"><span>가용 에너지</span><b>{MAX-spent}</b><small>/ {MAX} P</small></div></header>
   <div className="presets"><button onClick={()=>resetBattle([])}>무방비</button><button onClick={()=>resetBattle(authPreset)}>인증·인가 요새</button><button onClick={()=>resetBattle(allPreset)}>다중 통제 완성</button></div>
   <div className="cards">{controls.map(c=>{const on=selected.includes(c.id),disabled=!on&&spent+c.cost>MAX;return <button key={c.id} className={on?"on":""} disabled={disabled||running} onClick={()=>toggle(c)}><span className="card-icon">{c.icon}</span><i>{c.layer}</i><strong>{c.name}</strong><p>{c.description}</p><footer><span>{on?"ONLINE":"OFFLINE"}</span><b>{c.cost}P</b></footer></button>})}</div>
  </section>

  <section className="research"><span>RESEARCH DATA · 480 OBSERVATIONS</span><div><b>100%</b><small>무방비 공격 성공률</small></div><i>→</i><div><b>50%</b><small>인증·인가만 강화</small></div><i>→</i><div className="zero"><b>0%</b><small>다중 통제 적용</small></div></section>

  <section className="codex" id="codex"><header className="section-title"><div><p className="kicker">ATTACK CODEX</p><h2>16개 공격 경로 도감</h2></div></header><div className="codex-grid"><div className="scenario-list">{scenarios.map(s=><button key={s.id} className={`${active===s.id?"active":""} ${resolved.includes(s.id)?(blocked.has(s.id)?"safe":"breach"):""}`} onClick={()=>setActive(s.id)}><i>{labels[s.category]}</i><b>{s.id}</b><span>{s.title}</span><em>{resolved.includes(s.id)?(blocked.has(s.id)?"BLOCKED":"BREACH"):"VIEW"}</em></button>)}</div><aside>{detail?<><span>{detail.id} · {detail.cwe}</span><h3>{detail.title}</h3><dl><dt>취약 원인</dt><dd>{detail.weakness}</dd><dt>공격 방식</dt><dd>{detail.attack}</dd><dt>방어 원리</dt><dd>{detail.defense}</dd></dl></>:<div className="empty"><b>⌖</b><p>공격 카드를 선택해<br/>분석 정보를 확인하세요.</p></div>}</aside></div></section>
  <div className="site-footer"><b>LOGIN BEYOND</b><span>김건희 · 인증·인가 우회 경로 연구 기반 교육용 시뮬레이션</span></div>
 </main>
}
