
// WebSocket 생성 함수
export function createWebSocket(meetingId, onMessage, onError, onOpen, onClose) {
    // meetingId가 없으면 연결하지 않음
    if (!meetingId) return null;
    const base = (process.env.REACT_APP_WS_ENDPOINT || "").replace(/\/+$/, "");
    const wsEndpoint = `${base}/meeting/${meetingId}/terms`;
    const ws = new window.WebSocket(wsEndpoint);
    // const wsEndpoint = `${process.env.REACT_APP_WS_ENDPOINT}/meeting/${meetingId}/terms`;
    // const ws = new window.WebSocket(wsEndpoint);

    ws.onopen = () => {
        if (onOpen) onOpen();
    };
    ws.onmessage = (event) => {
        if (onMessage) onMessage(event);
    };
    ws.onerror = (event) => {
        if (onError) onError(event);
    };
    ws.onclose = () => {
        if (onClose) onClose();
    };
    return ws;
}