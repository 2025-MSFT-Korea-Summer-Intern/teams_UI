# websocket 허브(브로드캐스트)
import asyncio, json, websockets

CLIENTS = set()

async def handler(ws, path):
    CLIENTS.add(ws)
    try:
        async for msg in ws:
            # 받은 메시지를 그대로 모든 클라이언트에게 브로드캐스트
            try:
                obj = json.loads(msg)
                # 업서트 포맷만 재방송(안전)
                if obj.get("type") == "upsert" and obj.get("item", {}).get("id"):
                    await asyncio.gather(*(c.send(msg) for c in list(CLIENTS) if not c.closed))
            except Exception:
                pass
    finally:
        CLIENTS.discard(ws)

async def main():
    print("WS hub on ws://localhost:8081/terms")
    async with websockets.serve(handler, "0.0.0.0", 8081):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
