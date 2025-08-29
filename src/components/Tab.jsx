import React, { useEffect, useRef, useState, useCallback } from "react";
import * as microsoftTeams from "@microsoft/teams-js";
import MediaQuery from "react-responsive";
import "./App.css";

import { createWebSocket } from "../utils/commonUtils";
import { RenderTerm } from "../utils/tabUtils";
import { handleThemeChange } from "../utils/teamsUtils";

// 메인 탭 컴포넌트
function Tab() {
  // 상태 및 ref 정의
  const [meetingId, setMeetingId] = useState("");
  const [userName, setUserName] = useState("");
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState("light");
  const contextRef = useRef(null);
  const wsRef = useRef(null);

  // WebSocket 메시지 핸들러
  const handleWebSocketMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.data);
      const term_list = Array.isArray(data.term_list) ? data.term_list : [];
      
      const normalized = term_list.map((x) => ({
      id: x.id || `${x.timestamp}_${x.entity}`, // 안정적인 key
      entity: x.entity || x.term,
      domain: x.domain || x.category || "-",
      body: x.body || x.explanation || "",
      timestamp: x.timestamp || "",
    }));

    setTerms((prev) => {
      const map = new Map(prev.map((t) => [t.id, t]));
      normalized.forEach((it) => {
        map.set(it.id, { ...map.get(it.id), ...it });
      });
      return Array.from(map.values()).sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );
    });
    setLoading(false);
    setError(null);
  } catch (e) {
    setError("데이터 처리 중 오류가 발생했습니다.");
    setLoading(false);
  }
}, []);


  // WebSocket 에러 핸들러
  const handleWebSocketError = useCallback(() => {
    setError("웹소켓 연결에 실패했습니다.");
    setLoading(false);
  }, []);

  // WebSocket open 핸들러
  const handleWebSocketOpen = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  // WebSocket close 핸들러
  const handleWebSocketClose = useCallback(() => {
    // 필요시 재연결 로직 추가 가능
  }, []);

  // Microsoft Teams 초기화 및 WebSocket 연결
  useEffect(() => {
    let isMounted = true;
    async function initialize() {
      try {
        await microsoftTeams.app.initialize();

        // 미팅 정보 가져오기
        const context = await microsoftTeams.app.getContext();
        contextRef.current = context;
        setMeetingId(context.meeting?.meetingId || context.meeting?.id || "");
        setUserName(context.user?.userPrincipalName || "");

        // 테마 설정
        handleThemeChange(context.app.theme, setTheme);
        microsoftTeams.app.registerOnThemeChangeHandler((newTheme) =>
          handleThemeChange(newTheme, setTheme)
        );

        // WebSocket 연결
        if (wsRef.current) wsRef.current.close();
        wsRef.current = createWebSocket(
          context.meeting?.meetingId || context.meeting?.id,
          handleWebSocketMessage,
          handleWebSocketError,
          handleWebSocketOpen,
          handleWebSocketClose
        );
      } catch (err) {
        if (isMounted) {
          setError(String(err?.message || err));
          setLoading(false);
        }
      }
    }
    initialize();

    // 언마운트 시 WebSocket 정리
    return () => {
      isMounted = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [
    handleWebSocketMessage,
    handleWebSocketError,
    handleWebSocketOpen,
    handleWebSocketClose,
  ]);
  return (
    <div className={`tab-root theme-${theme}`}>
      <h1>Glossify sample-0829</h1>
      <h3>User Name:</h3>
      <p>{userName || "-"}</p>
      <h3>Meeting ID:</h3>
      <p>{meetingId || "-"}</p>
      <MediaQuery maxWidth={280}>
        <h3>이곳은 사이드 패널입니다</h3>
        <a href="https://docs.microsoft.com/en-us/microsoftteams/platform/apps-in-teams-meetings/teams-apps-in-meetings">
          자세한 정보는 새 탭에서 문서를 확인하세요.
        </a>
      </MediaQuery>
      <hr />

      <h3>실시간 단어</h3>
      {loading && <div>불러오는 중…</div>}
      {error && <div style={{ color: "red" }}>에러: {error}</div>}
      <ol type="1" id="termList">
        {terms.map((term) => (
          <RenderTerm key={term.id} term={term} theme={theme} />
        ))}
        {!loading && !error && terms.length === 0 && (
          <li style={{ opacity: 0.7 }}>표시할 항목이 없습니다.</li>
        )}
      </ol>
    </div>
  );
}

export default Tab;
