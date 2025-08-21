// scripts/drip.js
// Node.js 18+ (global fetch 사용)
// Functions 서버가 http://localhost:7071 에서 실행 중이면 바로 동작합니다 (func start)

const API = process.env.API || "http://localhost:7071/api/broadcast";
// 목적지 엔드포인트: 나중에 실제 배포 URL로 바꾸면 됨.
const MEETING_ID = process.env.MEETING_ID || "dev-meeting";
const SPEAKER = process.env.SPEAKER || "spk-words";
const ITEM_DELAY_MS = Number(process.env.ITEM_DELAY_MS || 250); // 단어 간 전송 간격

// === 예시 데이터 (STT가 단어/설명으로 정리해 준다고 가정) ===
const DATA = [
  { word: "농협중앙회", description: "농협중앙회는 예쁘다" },
  { word: "Microsoft", description: "생산성 클라우드 제품군을 제공" },
  { word: "Copilot", description: "업무 자동화와 요약을 돕는 AI 보조도구" },
  { word: "Teams", description: "회의/채팅/탭 앱 통합 협업 허브" }
];
// 필요하면 외부 JSON에서 읽어와도 됨: fs.readFile로 대체 가능

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function post(payload) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`POST failed ${res.status}: ${text}`);
  }
}

(async () => {
  try {
    console.log(`[words] meetingId=${MEETING_ID}, items=${DATA.length}`);

    // 각 단어를 "하나의 발화"로 간주 → final만 보냄
    for (let i = 0; i < DATA.length; i++) {
      const { word, description } = DATA[i];

      // UI는 payload.text만 렌더링하므로 보기 좋게 합쳐서 보냄
      const text = `${word} — ${description}`;

      const payload = {
        meetingId: MEETING_ID,
        payload: {
          type: "final",                  // 단어는 부분 업데이트가 필요 없으니 final로 고정
          utteranceId: `w-${Date.now()}-${i}`, // 단어별 고유 ID
          seq: 1,                         // 해당 발화 내에서 첫(유일) 이벤트
          text,                           // "단어 — 설명" 형식
          speaker: SPEAKER,
          meta: { kind: "word", word }    // (선택) 클라에서 단어만 별도 표시하고 싶을 때 사용
        }
      };

      await post(payload);
      console.log(` ✔ sent [${i + 1}/${DATA.length}] ${text}`);
      if (i < DATA.length - 1) await sleep(ITEM_DELAY_MS);
    }

    console.log("✅ done");
  } catch (e) {
    console.error("[words:error]", e.message || e);
    process.exit(1);
  }
})();
