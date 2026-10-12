import { scenarios } from "@/lib/scenarios";

export default function Home() {
  const mode = process.env.LAB_MODE === "secure" ? "secure" : "vulnerable";
  return (
    <main>
      <span className="badge">현재 모드: {mode}</span>
      <h1>Auth Security Lab</h1>
      <p>인증·세션·권한 검증 16개 시나리오를 취약 모드와 보안 강화 모드에서 비교하는 로컬 실험 환경입니다.</p>
      <div className="grid">
        {scenarios.map((scenario) => (
          <article className="card" key={scenario.id}>
            <strong>{scenario.id} · {scenario.title}</strong>
            <span>{scenario.category} · {scenario.cwe}</span>
            <p>{scenario.weakness}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
