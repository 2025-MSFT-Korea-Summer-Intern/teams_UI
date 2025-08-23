import React from "react";
import { app, teamsCore } from "@microsoft/teams-js";
import MediaQuery from "react-responsive";
import "./App.css";

class Tab extends React.Component {
  constructor(props) {
    super(props);
    // 화면에 보여줄, 바뀌는 값들 state로 정의
    this.state = {
      context: {},
      meetingId: "",
      userName: "",
      terms: [], //불러올 단어 list / [{id, term, category, confidence, timestamp, source_text, explanation, lang, embedding?}]
      loading: true, // 로딩 상태
      error: null, // 에러 상태
    };
    this.ws=null; // 웹소켓 연결을 위한 컴포넌트 변수 - 리렌더링에 영향 x
  }

  async componentDidMount() {
    try {
      // Initialize the Teams app
      await app.initialize();
      // Notify that the app is ready for user interaction
      app.notifySuccess();

      // Get the user context from Teams and set it in the state
      const context = await app.getContext();
      this.setState({
        meetingId: context.meeting.id,
        userName: context.user.userPrincipalName, 
      });

      // Enable app caching if in side panel (앱이 teams 사이드 패널에서 실행 중인 경우)
      if (context.page.frameContext === "sidePanel") {
        teamsCore.registerOnLoadHandler((context) => {
          app.notifySuccess();
          //로드 이벤트가 오면 notifySuccess를 호출
        });

        teamsCore.registerBeforeUnloadHandler((readyToUnload) => {
          readyToUnload(); //언로드 이벤트가 오면 readyToUnload를 호출
          return true; //언로드 허용
        });
      }

      // websocket 서버 meetingID 전달하여 연결
      this.connectWebSocket(/* meetingId: */ context.meeting?.id);

    } catch (error) {
      console.error("Error initializing Teams app:", error);
      this.setState({ error: String(error?.message || error), loading: false });
    }
  }

  componentWillUnmount() {
    // Clean up the WebSocket connection when the component unmounts
    try {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // 웹소켓이 열려있으면 연결 종료
      this.ws.close();
    }
  } catch {}
}

  connectWebSocket(meetingId) {
    // 테스트용으로 로컬 서버에 연결, 실제로는 wss 프로토콜을 사용해야 함
    const WS_URL = process.env.WEBSOCKET_SERVER_URL || "ws://localhost:8081/terms";
    const url = new URL(WS_URL);
    if (meetingId) url.searchParams.set("meetingId", meetingId); // URL에 meetingId 추가

    const ws = new WebSocket(url.toString());
    this.ws = ws; // 웹소켓 연결을 컴포넌트 변수에 저장, unmount 시 연결 종료를 위해

    ws.onopen = () => {
      //연결 성공, 첫 데이터 오기 전이니까 loading 유지
      this.setState({ loading: false });
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data); //서버 데이터 json파싱으로 객체 변환
        
        if (msg?.type === "upsert" && msg?.item?.id) {
          this.setState((prev) => {
            const map = new Map(prev.terms.map((t) => [t.term, t])); //기존 단어들을 Map으로 변환
            map.set(msg.item.id, { ...map.get(msg.item.id), ...msg.item });
            return {
              terms: Array.from(map.values()), //Map의 값들을 배열로 변환하여 상태 업데이트
              loading: false,
              error: null,
            };
          });
                            } else {
          console.warn("Unknown message type or missing item:", msg);
        }
      } catch(e) {
        console.error("Error parsing WebSocket message:", e);
        this.setState({ error: "Error parsing data from server.", loading: false });
      }
    };

    ws.onerror = () => {
      this.setState({ error: "WebSocket error occurred.", loading: false });
    };

    ws.onclose = () => {
      // if needed, backoff
      // setTimeout(() => this.connectWebSocket(meetingId), 5000);
    };

  }

  render() {
    const {meetingId, userName, terms, loading, error} =this.state;

    return (
      <div>
        <h1>Glossify sample</h1>
        <h3>Principle Name:</h3>
        <p>{userName || "-"}</p>
        <h3>Meeting ID:</h3>
        <p>{meetingId || "-"}</p>
        <MediaQuery maxWidth={280}>
          <h3>This is the side panel</h3>
          <a href="https://docs.microsoft.com/en-us/microsoftteams/platform/apps-in-teams-meetings/teams-apps-in-meetings">
            Need more info, open this document in new tab or window.
          </a>
        </MediaQuery>
        <hr />

        <h3>실시간 단어</h3>
        {loading && <div>불러오는 중…</div>}
        {error && <div style={{ color: "red" }}>에러: {error}</div>}
        
        
        <ul style={{ marginTop: 8 }}>
          {terms.map((t) => (
            <li key={t.id} style={{ marginBottom: 6 }}>
              <b>{t.term}</b> — {t.definition}
            </li>
          ))}
          {!loading && !error && terms.length === 0 && (
            <li style={{ opacity: 0.7 }}>표시할 항목이 없습니다.</li>
          )}
        </ul>

      </div>
    );
  }
}

export default Tab;
