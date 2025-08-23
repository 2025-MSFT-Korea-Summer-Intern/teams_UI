
import asyncio, json, threading
from queue import Queue, Empty
import websockets
import time

WS_URL = "ws://localhost:8081/terms"

_q = Queue() #watcher가 emit()로 넣은 문서를 이 큐에서 꺼내서 전송
_stop = False

async def _run_sender():
    global _stop
    ws = None
    while not _stop:
        try:
            if ws is None or ws.closed:
                ws = await websockets.connect(WS_URL)
            doc = _q.get(timeout=0.5)
            payload = {"type": "upsert", "item": doc}
            await ws.send(json.dumps(payload, ensure_ascii=False))
        except Exception:
            # 네트워크 문제 시 재시도
            await asyncio.sleep(1.0)

def _thread_main():
    asyncio.run(_run_sender())

_thread = threading.Thread(target=_thread_main, daemon=True)
_thread.start()

def emit(doc: dict):
    """doc 한 건을 허브로 전송 큐에 넣는다"""
    _q.put(doc)

def shutdown():
    global _stop
    _stop = True
